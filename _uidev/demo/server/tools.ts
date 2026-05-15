import fs from "node:fs";
import path from "node:path";
import { getAgencyRoot } from "./paths.js";

/**
 * Agentic file-system tools exposed to Claude.
 *
 * Claude calls these to navigate the agency repository the same way a Cursor
 * agent or Claude Projects session would: discover folders, read instruction
 * files, load deal JSON, browse the property catalog, search for content.
 *
 * All paths are sandboxed to AGENCY_ROOT. No `..` escapes, no absolute paths.
 * Writes are intentionally NOT exposed here — deal updates flow through the
 * `state_patch` envelope and property writes flow through `/api/apply-property`
 * (UI confirm gate), preserving the existing safety model.
 */

const MAX_READ_BYTES = 200_000;
const MAX_LIST_ENTRIES = 200;
const MAX_SEARCH_HITS = 50;
const SEARCH_SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "_uidev",
  "dist",
  "build",
  ".next",
  ".cache",
]);

/** Tool schema sent to Anthropic (matches their tool_use spec). */
export const AGENCY_TOOLS = [
  {
    name: "read_file",
    description:
      "Read a file from the agency repository. Use this to load instruction files (AI_README.md, orchestrator/*, specialist identity/rules/examples), agent profiles, SOPs, deal JSON, and property listings.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Path relative to the agency repo root. Examples: 'AI_README.md', '00_orchestrator/rules.md', '02_property_research/examples.md', '_catalog/properties/ATX-016.md', '_database/deals/412-buyer.json', '_sops/sop_01_new_lead.md'.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_directory",
    description:
      "List files and subfolders in a directory under the agency repo. Use this to discover what exists before reading. Folder entries are suffixed with '/'.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative directory path from the agency root. Use '.' for the repo root. Examples: '.', '00_orchestrator', '_catalog/properties', '_database/deals', '_sops', '_config/agent_profiles'.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "search_files",
    description:
      "Search text files in the agency repo for a regex pattern. Returns a small snippet per match. Use this when you don't know the exact filename (e.g. 'which property is in Travis Heights', 'where is the appraisal SOP step').",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string",
          description: "JavaScript regex pattern (case-insensitive).",
        },
        path: {
          type: "string",
          description:
            "Optional subdirectory to limit the search to (default: whole repo). Examples: '_catalog/properties', '_sops'.",
        },
        glob: {
          type: "string",
          description:
            "Optional filename filter, e.g. '*.md', '*.json', '*.yaml'.",
        },
      },
      required: ["pattern"],
    },
  },
];

export type ToolCallRecord = {
  name: string;
  input: Record<string, unknown>;
  ok: boolean;
  summary: string;
};

function safeJoin(root: string, rel: string): string {
  const normalized = path
    .normalize(rel.replace(/^[/\\]+/, ""))
    .replace(/\\/g, path.sep);
  if (normalized.startsWith("..") || normalized.includes("\0")) {
    throw new Error(`unsafe path: ${rel}`);
  }
  const absRoot = path.resolve(root);
  const resolved = path.resolve(absRoot, normalized);
  if (resolved !== absRoot && !resolved.startsWith(absRoot + path.sep)) {
    throw new Error(`path escapes agency root: ${rel}`);
  }
  return resolved;
}

function matchGlob(name: string, glob: string): boolean {
  if (!glob || glob === "*") return true;
  if (glob.startsWith("*.")) return name.toLowerCase().endsWith(glob.slice(1).toLowerCase());
  return name === glob;
}

function relToRepo(root: string, abs: string): string {
  return path.relative(root, abs).replace(/\\/g, "/") || ".";
}

function doReadFile(root: string, rel: string): { result: string; record: ToolCallRecord } {
  const abs = safeJoin(root, rel);
  if (!fs.existsSync(abs)) {
    const msg = `file not found: ${rel}`;
    return { result: msg, record: { name: "read_file", input: { path: rel }, ok: false, summary: msg } };
  }
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const msg = `'${rel}' is a directory — use list_directory instead`;
    return { result: msg, record: { name: "read_file", input: { path: rel }, ok: false, summary: msg } };
  }
  let body = fs.readFileSync(abs, "utf8");
  let truncated = false;
  if (body.length > MAX_READ_BYTES) {
    body = body.slice(0, MAX_READ_BYTES);
    truncated = true;
  }
  const result = truncated
    ? `${body}\n\n[…truncated; original ${stat.size} bytes]`
    : body;
  return {
    result,
    record: {
      name: "read_file",
      input: { path: rel },
      ok: true,
      summary: `read ${rel} (${stat.size}b)`,
    },
  };
}

function doListDirectory(root: string, rel: string): { result: string; record: ToolCallRecord } {
  const abs = safeJoin(root, rel || ".");
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    const msg = `not a directory: ${rel}`;
    return {
      result: msg,
      record: { name: "list_directory", input: { path: rel }, ok: false, summary: msg },
    };
  }
  const items = fs.readdirSync(abs).sort();
  const limited = items.slice(0, MAX_LIST_ENTRIES);
  const formatted = limited
    .map((name) => {
      const p = path.join(abs, name);
      try {
        return fs.statSync(p).isDirectory() ? `${name}/` : name;
      } catch {
        return name;
      }
    })
    .join("\n");
  const note =
    items.length > MAX_LIST_ENTRIES
      ? `\n\n[…truncated; showing ${MAX_LIST_ENTRIES} of ${items.length} entries]`
      : "";
  return {
    result: (formatted || "(empty)") + note,
    record: {
      name: "list_directory",
      input: { path: rel },
      ok: true,
      summary: `list ${rel || "."} (${items.length} items)`,
    },
  };
}

function doSearchFiles(
  root: string,
  pattern: string,
  searchPath: string,
  glob: string
): { result: string; record: ToolCallRecord } {
  const abs = safeJoin(root, searchPath || ".");
  if (!fs.existsSync(abs)) {
    const msg = `search path not found: ${searchPath}`;
    return {
      result: msg,
      record: { name: "search_files", input: { pattern, path: searchPath, glob }, ok: false, summary: msg },
    };
  }
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, "im");
  } catch (e) {
    const msg = `invalid regex: ${e instanceof Error ? e.message : String(e)}`;
    return {
      result: msg,
      record: { name: "search_files", input: { pattern, path: searchPath, glob }, ok: false, summary: msg },
    };
  }

  const hits: string[] = [];
  const walk = (dir: string) => {
    if (hits.length >= MAX_SEARCH_HITS) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (hits.length >= MAX_SEARCH_HITS) return;
      if (entry.name.startsWith(".") && entry.name !== "." && entry.name !== "..") continue;
      if (SEARCH_SKIP_DIRS.has(entry.name)) continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
        continue;
      }
      if (!entry.isFile()) continue;
      if (glob && !matchGlob(entry.name, glob)) continue;
      try {
        const content = fs.readFileSync(p, "utf8");
        const match = regex.exec(content);
        if (!match) continue;
        const idx = match.index;
        const start = Math.max(0, idx - 80);
        const end = Math.min(content.length, idx + match[0].length + 120);
        const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
        hits.push(`${relToRepo(root, p)} :: …${snippet}…`);
      } catch {
        // skip unreadable / binary files
      }
    }
  };
  walk(abs);
  return {
    result: hits.length ? hits.join("\n") : "(no matches)",
    record: {
      name: "search_files",
      input: { pattern, path: searchPath, glob },
      ok: true,
      summary: `search /${pattern}/ in ${searchPath || "."} → ${hits.length} hit(s)`,
    },
  };
}

export function executeAgencyTool(
  name: string,
  input: Record<string, unknown>
): { result: string; record: ToolCallRecord } {
  const root = getAgencyRoot();
  try {
    if (name === "read_file") {
      return doReadFile(root, String(input.path ?? ""));
    }
    if (name === "list_directory") {
      return doListDirectory(root, String(input.path ?? "."));
    }
    if (name === "search_files") {
      return doSearchFiles(
        root,
        String(input.pattern ?? ""),
        String(input.path ?? "."),
        String(input.glob ?? "")
      );
    }
    const msg = `unknown tool: ${name}`;
    return { result: msg, record: { name, input, ok: false, summary: msg } };
  } catch (e) {
    const msg = `tool error: ${e instanceof Error ? e.message : String(e)}`;
    return { result: msg, record: { name, input, ok: false, summary: msg } };
  }
}

export function toolRecordToActivityItem(record: ToolCallRecord): {
  time: string;
  icon: string;
  label: string;
} {
  const icon =
    record.name === "read_file"
      ? "📄"
      : record.name === "list_directory"
        ? "📁"
        : record.name === "search_files"
          ? "🔎"
          : "🛠️";
  return {
    time: new Date().toTimeString().slice(0, 8),
    icon,
    label: record.summary,
  };
}

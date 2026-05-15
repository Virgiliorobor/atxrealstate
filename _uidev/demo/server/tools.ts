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
 * Two backends, selected by STORAGE_MODE:
 *   - "local"  → reads from the local filesystem under AGENCY_ROOT.
 *   - "github" → reads from the GitHub Contents API (same repo configuration
 *                used by memoryStore.ts for deal/property writes). Used by the
 *                Netlify deployment so the live demo always reads the canonical
 *                repository at request time, regardless of what got bundled
 *                into the Lambda artifact.
 *
 * All local paths are sandboxed to AGENCY_ROOT. Writes are intentionally NOT
 * exposed here — deal updates flow through the `state_patch` envelope and
 * property writes flow through `/api/apply-property` (UI confirm gate),
 * preserving the existing safety model.
 */

const MAX_READ_BYTES = 200_000;
const MAX_LIST_ENTRIES = 200;
const MAX_SEARCH_HITS = 50;
const MAX_SEARCH_FILES = 120; // soft cap on files scanned per search call
const SEARCH_SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "_uidev",
  "dist",
  "build",
  ".next",
  ".cache",
]);
const SEARCH_TEXT_EXT = new Set([
  ".md",
  ".markdown",
  ".json",
  ".yaml",
  ".yml",
  ".txt",
  ".csv",
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
      "Search text files in the agency repo for a regex pattern. Returns a small snippet per match. Prefer narrowing with `path` (e.g. '_catalog/properties') and `glob` (e.g. '*.md') so the search stays fast.",
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

type StorageMode = "local" | "github";

function storageMode(): StorageMode {
  const m = (process.env.STORAGE_MODE ?? "local").trim().toLowerCase();
  return m === "github" ? "github" : "local";
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL BACKEND
// ─────────────────────────────────────────────────────────────────────────────

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

function localReadFile(rel: string): { result: string; record: ToolCallRecord } {
  const root = getAgencyRoot();
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

function localListDirectory(rel: string): { result: string; record: ToolCallRecord } {
  const root = getAgencyRoot();
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

function localSearchFiles(
  pattern: string,
  searchPath: string,
  glob: string
): { result: string; record: ToolCallRecord } {
  const root = getAgencyRoot();
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

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB BACKEND
// ─────────────────────────────────────────────────────────────────────────────

interface GithubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  basePath: string;
}

function githubConfig(): GithubConfig {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const token = process.env.GITHUB_TOKEN?.trim();
  const basePath = (process.env.GITHUB_BASE_PATH?.trim() || "").replace(/\/+$/, "");
  if (!owner || !repo || !token) {
    throw new Error(
      "STORAGE_MODE=github requires GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN"
    );
  }
  return { owner, repo, branch, token, basePath };
}

function normalizeRel(rel: string): string {
  // Strip leading slashes, normalize separators, reject parent escapes.
  const t = rel.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  if (t === "." || t === "") return "";
  if (t.split("/").some((seg) => seg === "..")) {
    throw new Error(`unsafe path: ${rel}`);
  }
  return t;
}

function withBase(rel: string, basePath: string): string {
  if (!basePath) return rel;
  return rel ? `${basePath}/${rel}` : basePath;
}

function ghEncode(p: string): string {
  return encodeURIComponent(p).replace(/%2F/g, "/");
}

async function ghFetch(url: string): Promise<Response> {
  const c = githubConfig();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "agency-demo-tools",
    },
  });
}

type GhContentsItem = {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
};

type GhContentsFile = {
  type: "file";
  name: string;
  path: string;
  size: number;
  content: string;
  encoding: "base64";
};

// File content cache (warm-Lambda lifetime). Keyed by `branch:relPath`.
const fileCache = new Map<string, { body: string; size: number }>();

async function ghReadFileBody(rel: string): Promise<{ body: string; size: number } | null> {
  const c = githubConfig();
  const key = `${c.branch}:${rel}`;
  const cached = fileCache.get(key);
  if (cached) return cached;
  const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${ghEncode(
    withBase(rel, c.basePath)
  )}?ref=${encodeURIComponent(c.branch)}`;
  const res = await ghFetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`github read failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as Partial<GhContentsFile>;
  if (data.type !== "file" || data.encoding !== "base64" || typeof data.content !== "string") {
    return null;
  }
  const body = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  const entry = { body, size: typeof data.size === "number" ? data.size : body.length };
  fileCache.set(key, entry);
  return entry;
}

async function ghListDirEntries(rel: string): Promise<GhContentsItem[] | null> {
  const c = githubConfig();
  const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${ghEncode(
    withBase(rel, c.basePath)
  )}?ref=${encodeURIComponent(c.branch)}`;
  const res = await ghFetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`github list failed ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  return data.map((e) => ({
    name: String(e?.name ?? ""),
    path: String(e?.path ?? ""),
    type:
      e?.type === "dir"
        ? "dir"
        : e?.type === "symlink"
          ? "symlink"
          : e?.type === "submodule"
            ? "submodule"
            : "file",
  }));
}

// Recursive tree cache (warm-Lambda lifetime). Lets us enumerate files for
// search_files without paginating contents calls. Keyed by `branch`.
let treeCache: { branch: string; entries: Array<{ path: string; type: string }> } | null = null;

async function ghTree(): Promise<Array<{ path: string; type: string }>> {
  const c = githubConfig();
  if (treeCache && treeCache.branch === c.branch) return treeCache.entries;
  const url = `https://api.github.com/repos/${c.owner}/${c.repo}/git/trees/${encodeURIComponent(
    c.branch
  )}?recursive=1`;
  const res = await ghFetch(url);
  if (!res.ok) {
    throw new Error(`github tree failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    tree?: Array<{ path: string; type: string }>;
    truncated?: boolean;
  };
  const raw = data.tree ?? [];
  const stripped = c.basePath
    ? raw
        .filter((e) => e.path === c.basePath || e.path.startsWith(c.basePath + "/"))
        .map((e) => ({
          ...e,
          path: e.path === c.basePath ? "" : e.path.slice(c.basePath.length + 1),
        }))
        .filter((e) => e.path)
    : raw;
  treeCache = { branch: c.branch, entries: stripped };
  return stripped;
}

function ghReadFile(rel: string): Promise<{ result: string; record: ToolCallRecord }> {
  const normalized = (() => {
    try {
      return normalizeRel(rel);
    } catch (e) {
      const msg = `unsafe path: ${rel}`;
      return { error: msg } as const;
    }
  })();
  if (typeof normalized === "object" && "error" in normalized) {
    return Promise.resolve({
      result: normalized.error,
      record: { name: "read_file", input: { path: rel }, ok: false, summary: normalized.error },
    });
  }
  return (async () => {
    try {
      const entry = await ghReadFileBody(normalized);
      if (!entry) {
        const msg = `file not found: ${rel}`;
        return {
          result: msg,
          record: { name: "read_file", input: { path: rel }, ok: false, summary: msg },
        };
      }
      const truncated = entry.body.length > MAX_READ_BYTES;
      const body = truncated ? entry.body.slice(0, MAX_READ_BYTES) : entry.body;
      const result = truncated
        ? `${body}\n\n[…truncated; original ${entry.size} bytes]`
        : body;
      return {
        result,
        record: {
          name: "read_file",
          input: { path: rel },
          ok: true,
          summary: `read ${rel} (${entry.size}b)`,
        },
      };
    } catch (e) {
      const msg = `github read error: ${e instanceof Error ? e.message : String(e)}`;
      return {
        result: msg,
        record: { name: "read_file", input: { path: rel }, ok: false, summary: msg },
      };
    }
  })();
}

async function ghListDirectory(
  rel: string
): Promise<{ result: string; record: ToolCallRecord }> {
  let normalized: string;
  try {
    normalized = normalizeRel(rel);
  } catch {
    const msg = `unsafe path: ${rel}`;
    return {
      result: msg,
      record: { name: "list_directory", input: { path: rel }, ok: false, summary: msg },
    };
  }
  try {
    const entries = await ghListDirEntries(normalized);
    if (!entries) {
      const msg = `not a directory: ${rel}`;
      return {
        result: msg,
        record: { name: "list_directory", input: { path: rel }, ok: false, summary: msg },
      };
    }
    const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));
    const limited = sorted.slice(0, MAX_LIST_ENTRIES);
    const formatted = limited
      .map((e) => (e.type === "dir" ? `${e.name}/` : e.name))
      .join("\n");
    const note =
      sorted.length > MAX_LIST_ENTRIES
        ? `\n\n[…truncated; showing ${MAX_LIST_ENTRIES} of ${sorted.length} entries]`
        : "";
    return {
      result: (formatted || "(empty)") + note,
      record: {
        name: "list_directory",
        input: { path: rel },
        ok: true,
        summary: `list ${rel || "."} (${sorted.length} items)`,
      },
    };
  } catch (e) {
    const msg = `github list error: ${e instanceof Error ? e.message : String(e)}`;
    return {
      result: msg,
      record: { name: "list_directory", input: { path: rel }, ok: false, summary: msg },
    };
  }
}

function fileExt(p: string): string {
  const i = p.lastIndexOf(".");
  return i >= 0 ? p.slice(i).toLowerCase() : "";
}

function shouldSkipPath(p: string): boolean {
  const segments = p.split("/");
  return segments.some((seg) => SEARCH_SKIP_DIRS.has(seg));
}

async function ghSearchFiles(
  pattern: string,
  searchPath: string,
  glob: string
): Promise<{ result: string; record: ToolCallRecord }> {
  let normalizedPath: string;
  try {
    normalizedPath = normalizeRel(searchPath || ".");
  } catch {
    const msg = `unsafe search path: ${searchPath}`;
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

  let tree: Array<{ path: string; type: string }>;
  try {
    tree = await ghTree();
  } catch (e) {
    const msg = `github tree error: ${e instanceof Error ? e.message : String(e)}`;
    return {
      result: msg,
      record: { name: "search_files", input: { pattern, path: searchPath, glob }, ok: false, summary: msg },
    };
  }

  // Filter candidate files by search path + glob + extension + skip-dirs.
  const prefix = normalizedPath ? normalizedPath + "/" : "";
  const candidates = tree.filter((e) => {
    if (e.type !== "blob") return false;
    if (prefix && !e.path.startsWith(prefix) && e.path !== normalizedPath) return false;
    if (shouldSkipPath(e.path)) return false;
    const name = e.path.split("/").pop() ?? "";
    if (glob && !matchGlob(name, glob)) return false;
    if (!glob && !SEARCH_TEXT_EXT.has(fileExt(name))) return false;
    return true;
  });

  const toScan = candidates.slice(0, MAX_SEARCH_FILES);
  const hits: string[] = [];
  for (const entry of toScan) {
    if (hits.length >= MAX_SEARCH_HITS) break;
    let body: string;
    try {
      const fetched = await ghReadFileBody(entry.path);
      if (!fetched) continue;
      body = fetched.body;
    } catch {
      continue;
    }
    const match = regex.exec(body);
    if (!match) continue;
    const idx = match.index;
    const start = Math.max(0, idx - 80);
    const end = Math.min(body.length, idx + match[0].length + 120);
    const snippet = body.slice(start, end).replace(/\s+/g, " ").trim();
    hits.push(`${entry.path} :: …${snippet}…`);
  }

  const truncatedNote =
    candidates.length > MAX_SEARCH_FILES
      ? ` (scanned ${MAX_SEARCH_FILES} of ${candidates.length} candidate files — narrow path/glob for full coverage)`
      : "";
  return {
    result: hits.length ? hits.join("\n") + truncatedNote : "(no matches)" + truncatedNote,
    record: {
      name: "search_files",
      input: { pattern, path: searchPath, glob },
      ok: true,
      summary: `search /${pattern}/ in ${searchPath || "."} → ${hits.length} hit(s)`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

export async function executeAgencyTool(
  name: string,
  input: Record<string, unknown>
): Promise<{ result: string; record: ToolCallRecord }> {
  try {
    const mode = storageMode();
    if (mode === "github") {
      if (name === "read_file") {
        return await ghReadFile(String(input.path ?? ""));
      }
      if (name === "list_directory") {
        return await ghListDirectory(String(input.path ?? "."));
      }
      if (name === "search_files") {
        return await ghSearchFiles(
          String(input.pattern ?? ""),
          String(input.path ?? "."),
          String(input.glob ?? "")
        );
      }
    } else {
      if (name === "read_file") {
        return localReadFile(String(input.path ?? ""));
      }
      if (name === "list_directory") {
        return localListDirectory(String(input.path ?? "."));
      }
      if (name === "search_files") {
        return localSearchFiles(
          String(input.pattern ?? ""),
          String(input.path ?? "."),
          String(input.glob ?? "")
        );
      }
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

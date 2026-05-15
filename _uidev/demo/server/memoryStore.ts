import fs from "node:fs";
import path from "node:path";
import {
  assertSafeDealFile,
  assertSafePropertyId,
  dealsDir,
  getAgencyRoot,
  propertyFilePath,
  safeDealFilename,
} from "./paths.js";

type Json = Record<string, unknown>;
type StorageMode = "local" | "github";

export type StatePatch = {
  append_events?: Array<Record<string, unknown>>;
  meta_updates?: { stage?: string; updated_at?: string };
};

export type MemoryEntry = {
  id: string;
  time: string;
  source: string;
  kind: "event" | "communication" | "risk" | "deadline";
  title: string;
  detail: string;
};

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export function getStorageMode(): StorageMode {
  const m = (process.env.STORAGE_MODE ?? "local").trim().toLowerCase();
  return m === "github" ? "github" : "local";
}

function timeOnly(ts: unknown): string {
  if (typeof ts !== "string") return "";
  const t = ts.includes("T") ? ts.split("T")[1] : ts.split(" ")[1];
  return t ? t.slice(0, 8) : "";
}

function relDealPath(dealFile: string): string {
  assertSafeDealFile(dealFile);
  return `_database/deals/${dealFile}`;
}

function localDealPath(dealFile: string): string {
  return path.join(dealsDir(getAgencyRoot()), dealFile);
}

function githubConfig() {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const token = process.env.GITHUB_TOKEN?.trim();
  const basePath = process.env.GITHUB_BASE_PATH?.trim().replace(/\/+$/, "") || "";
  if (!owner || !repo || !token) {
    throw new Error("STORAGE_MODE=github requires GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN");
  }
  return { owner, repo, branch, token, basePath };
}

function githubUrl(relPath: string): string {
  const c = githubConfig();
  const p = c.basePath ? `${c.basePath}/${relPath}` : relPath;
  return `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${encodeURIComponent(p).replace(/%2F/g, "/")}`;
}

async function githubRead(relPath: string): Promise<string> {
  const c = githubConfig();
  const res = await fetch(`${githubUrl(relPath)}?ref=${encodeURIComponent(c.branch)}`, {
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "agency-demo-memory-store",
    },
  });
  if (!res.ok) {
    throw new Error(`github read failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") {
    throw new Error("github read failed: unexpected content encoding");
  }
  return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
}

async function githubWrite(relPath: string, text: string, message: string): Promise<void> {
  const c = githubConfig();
  const getRes = await fetch(`${githubUrl(relPath)}?ref=${encodeURIComponent(c.branch)}`, {
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "agency-demo-memory-store",
    },
  });
  let sha: string | undefined;
  if (getRes.ok) {
    const j = (await getRes.json()) as { sha?: string };
    sha = j.sha;
  } else if (getRes.status !== 404) {
    throw new Error(`github prewrite failed ${getRes.status}: ${await getRes.text()}`);
  }

  const body = {
    message,
    content: Buffer.from(text, "utf8").toString("base64"),
    branch: c.branch,
    sha,
  };
  const putRes = await fetch(githubUrl(relPath), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "agency-demo-memory-store",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!putRes.ok) {
    throw new Error(`github write failed ${putRes.status}: ${await putRes.text()}`);
  }
}

async function readDealFile(dealFile: string): Promise<Json> {
  if (getStorageMode() === "github") {
    return JSON.parse(await githubRead(relDealPath(dealFile))) as Json;
  }
  return JSON.parse(fs.readFileSync(localDealPath(dealFile), "utf8")) as Json;
}

async function writeDealFile(dealFile: string, data: Json): Promise<void> {
  if (getStorageMode() === "github") {
    await githubWrite(
      relDealPath(dealFile),
      JSON.stringify(data, null, 2),
      `demo(memory): update ${dealFile}`
    );
    return;
  }
  const p = localDealPath(dealFile);
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, p);
}

export async function readDealJsonString(dealFile: string): Promise<string> {
  assertSafeDealFile(dealFile);
  if (getStorageMode() === "github") return githubRead(relDealPath(dealFile));
  return fs.readFileSync(localDealPath(dealFile), "utf8");
}

export function channelToDealFile(channel: string): string | null {
  return safeDealFilename(channel.replace(/^#/, "#"));
}

export async function applyDealStatePatch(
  dealFile: string,
  patch: StatePatch
): Promise<{ applied: string[]; errors: string[] }> {
  const applied: string[] = [];
  const errors: string[] = [];
  if (!patch || typeof patch !== "object") return { applied, errors };

  let doc: Json;
  try {
    doc = await readDealFile(dealFile);
  } catch (e) {
    errors.push(`read deal failed: ${e}`);
    return { applied, errors };
  }

  const deal = doc.deal as Json | undefined;
  if (!deal || typeof deal !== "object") {
    errors.push("invalid deal document");
    return { applied, errors };
  }

  const meta = deal.meta as Json | undefined;
  if (patch.meta_updates && meta) {
    if (typeof patch.meta_updates.stage === "string") {
      meta.stage = patch.meta_updates.stage;
      applied.push("meta.stage");
    }
    meta.updated_at = patch.meta_updates.updated_at ?? nowIso();
    applied.push("meta.updated_at");
  }

  if (Array.isArray(patch.append_events) && patch.append_events.length) {
    const events = deal.events;
    if (!Array.isArray(events)) {
      errors.push("deal.events is not an array");
      return { applied, errors };
    }
    for (const ev of patch.append_events) {
      if (ev && typeof ev === "object") events.push(ev);
    }
    applied.push(`append_events:${patch.append_events.length}`);
  }

  try {
    await writeDealFile(dealFile, doc);
  } catch (e) {
    errors.push(`write deal failed: ${e}`);
  }
  return { applied, errors };
}

export async function buildChannelMemory(channel: string): Promise<MemoryEntry[]> {
  const dealFile = channelToDealFile(channel);
  if (!dealFile) return [];
  const raw = JSON.parse(await readDealJsonString(dealFile)) as Record<string, unknown>;
  const deal = raw.deal as Record<string, unknown> | undefined;
  if (!deal) return [];

  const entries: Array<MemoryEntry & { sortTs: string }> = [];
  const events = deal.events;
  if (Array.isArray(events)) {
    for (const ev of events) {
      if (!ev || typeof ev !== "object") continue;
      const r = ev as Record<string, unknown>;
      const ts = typeof r.timestamp === "string" ? r.timestamp : "";
      entries.push({
        id: String(r.event_id ?? `event-${entries.length + 1}`),
        time: timeOnly(ts),
        source: String(r.actor_id ?? "system"),
        kind: "event",
        title: String(r.action ?? "deal_event"),
        detail: String(r.detail ?? ""),
        sortTs: ts,
      });
    }
  }

  const communications = deal.communications;
  if (Array.isArray(communications)) {
    for (const c of communications) {
      if (!c || typeof c !== "object") continue;
      const r = c as Record<string, unknown>;
      const ts = typeof r.sent_at === "string" ? r.sent_at : String(r.drafted_at ?? "");
      entries.push({
        id: String(r.comm_id ?? `comm-${entries.length + 1}`),
        time: timeOnly(ts),
        source: String(r.drafted_by ?? "client_communication"),
        kind: "communication",
        title: String(r.subject ?? r.situation ?? "communication"),
        detail: `recipient: ${String(r.recipient ?? "n/a")} · status: ${String(r.status ?? "unknown")}`,
        sortTs: ts,
      });
    }
  }

  const riskFlags = deal.risk_flags;
  if (Array.isArray(riskFlags)) {
    for (const f of riskFlags) {
      if (!f || typeof f !== "object") continue;
      const r = f as Record<string, unknown>;
      const ts = String(r.detected_at ?? "");
      entries.push({
        id: String(r.flag_id ?? `flag-${entries.length + 1}`),
        time: timeOnly(ts),
        source: String(r.detected_by ?? "transaction_coordinator"),
        kind: "risk",
        title: String(r.type ?? "risk_flag"),
        detail: String(r.detail ?? ""),
        sortTs: ts,
      });
    }
  }

  const deadlines = deal.deadlines;
  if (Array.isArray(deadlines)) {
    for (const d of deadlines) {
      if (!d || typeof d !== "object") continue;
      const r = d as Record<string, unknown>;
      const ts = String(r.datetime ?? "");
      entries.push({
        id: `deadline-${String(r.name ?? entries.length + 1)}`,
        time: timeOnly(ts),
        source: String(r.owner ?? "owner"),
        kind: "deadline",
        title: String(r.name ?? "deadline"),
        detail: `priority: ${String(r.priority ?? "n/a")} · status: ${String(r.status ?? "n/a")}`,
        sortTs: ts,
      });
    }
  }

  entries.sort((a, b) => a.sortTs.localeCompare(b.sortTs));
  return entries.map(({ sortTs, ...e }) => e);
}

export async function writePropertyMarkdown(propertyId: string, markdown: string): Promise<string> {
  assertSafePropertyId(propertyId);
  if (getStorageMode() === "github") {
    const rel = `_catalog/properties/${propertyId.toUpperCase()}.md`;
    await githubWrite(rel, markdown, `demo(memory): update ${propertyId.toUpperCase()}.md`);
    return rel;
  }
  const p = propertyFilePath(getAgencyRoot(), propertyId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, markdown, "utf8");
  fs.renameSync(tmp, p);
  return p;
}

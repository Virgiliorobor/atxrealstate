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

export type ChatLogEntry = {
  ts: string;
  author: string;           // agent_id of speaker: "marco" | "diana" | "ai_orchestrator"
  author_name?: string;     // display name
  role: "user" | "ai";
  text: string;
  specialist?: string | null;  // for AI entries: which specialist generated this
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

/**
 * Append a chat exchange to the deal's chat_log array.
 *
 * Per ICM rules.md: "Always write every SOP step to the database event log."
 * We extend this to also log every conversation exchange — preserves the full
 * Slack-channel-equivalent history in the same JSON file the orchestrator
 * already owns. New schema field: `deal.chat_log[]`.
 */
export async function appendChatLog(
  dealFile: string,
  entries: ChatLogEntry[]
): Promise<void> {
  if (!entries.length) return;
  const doc = (await readDealFile(dealFile)) as Json;
  const deal = doc.deal as Json | undefined;
  if (!deal || typeof deal !== "object") {
    throw new Error("invalid deal document — cannot append chat_log");
  }
  if (!Array.isArray((deal as { chat_log?: unknown }).chat_log)) {
    (deal as { chat_log: ChatLogEntry[] }).chat_log = [];
  }
  const log = (deal as { chat_log: ChatLogEntry[] }).chat_log;
  for (const e of entries) log.push(e);
  await writeDealFile(dealFile, doc);
}

export async function readChatLog(dealFile: string): Promise<ChatLogEntry[]> {
  assertSafeDealFile(dealFile);
  const doc = (await readDealFile(dealFile)) as Json;
  const deal = doc.deal as Json | undefined;
  if (!deal || typeof deal !== "object") return [];
  const log = (deal as { chat_log?: unknown }).chat_log;
  return Array.isArray(log) ? (log as ChatLogEntry[]) : [];
}

/**
 * Team channels (non-deal): #team-general, #diana-dashboard, etc.
 * Per system_settings.yaml, team_channels are first-class. We persist their
 * chat logs to _database/team_channels/<name>.json so Diana's open-entry
 * sessions and other cross-deal conversations survive restarts.
 */
function teamChannelSafeName(channel: string): string {
  const cleaned = channel.replace(/^#/, "").toLowerCase();
  if (!/^[a-z0-9-]+$/.test(cleaned)) {
    throw new Error("Invalid team channel name");
  }
  return cleaned;
}

function localTeamChannelPath(channel: string): string {
  const name = teamChannelSafeName(channel);
  return path.join(getAgencyRoot(), "_database", "team_channels", `${name}.json`);
}

function relTeamChannelPath(channel: string): string {
  const name = teamChannelSafeName(channel);
  return `_database/team_channels/${name}.json`;
}

async function readTeamChannelFile(channel: string): Promise<{ chat_log: ChatLogEntry[] }> {
  if (getStorageMode() === "github") {
    try {
      return JSON.parse(await githubRead(relTeamChannelPath(channel))) as {
        chat_log: ChatLogEntry[];
      };
    } catch {
      return { chat_log: [] };
    }
  }
  const p = localTeamChannelPath(channel);
  if (!fs.existsSync(p)) return { chat_log: [] };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as { chat_log: ChatLogEntry[] };
  } catch {
    return { chat_log: [] };
  }
}

async function writeTeamChannelFile(
  channel: string,
  data: { chat_log: ChatLogEntry[] }
): Promise<void> {
  if (getStorageMode() === "github") {
    await githubWrite(
      relTeamChannelPath(channel),
      JSON.stringify(data, null, 2),
      `demo(memory): update team_channels/${teamChannelSafeName(channel)}.json`
    );
    return;
  }
  const p = localTeamChannelPath(channel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, p);
}

export async function appendTeamChannelChatLog(
  channel: string,
  entries: ChatLogEntry[]
): Promise<void> {
  if (!entries.length) return;
  const doc = await readTeamChannelFile(channel);
  if (!Array.isArray(doc.chat_log)) doc.chat_log = [];
  for (const e of entries) doc.chat_log.push(e);
  await writeTeamChannelFile(channel, doc);
}

export async function readTeamChannelChatLog(channel: string): Promise<ChatLogEntry[]> {
  const doc = await readTeamChannelFile(channel);
  return Array.isArray(doc.chat_log) ? doc.chat_log : [];
}

/**
 * Discover all deal channels by listing _database/deals/ (or the GitHub equivalent).
 * Returns minimal deal summary for the channel sidebar / dashboard.
 */
export type DealChannelSummary = {
  channel: string;            // "#019-buyer"
  deal_file: string;          // "019-buyer.json"
  deal_id: string;            // "019"
  side: "buyer" | "seller";
  agent_id: string | null;    // assigned agent
  client_name: string | null;
  stage: string | null;
  updated_at: string | null;
};

function parseDealSummary(filename: string, raw: string): DealChannelSummary | null {
  if (!/^\d+-(buyer|seller)\.json$/i.test(filename)) return null;
  let doc: Json;
  try {
    doc = JSON.parse(raw) as Json;
  } catch {
    return null;
  }
  const deal = doc.deal as Json | undefined;
  if (!deal || typeof deal !== "object") return null;
  const idBlock = deal._id as Record<string, unknown> | undefined;
  const meta = deal.meta as Record<string, unknown> | undefined;
  const agent = deal.agent as Record<string, unknown> | undefined;
  const client = deal.client as Record<string, unknown> | undefined;
  const channelName =
    (idBlock?.slack_channel as string | undefined) ?? `#${filename.replace(/\.json$/, "")}`;
  return {
    channel: channelName,
    deal_file: filename,
    deal_id: String(idBlock?.deal_id ?? filename.replace(/-(buyer|seller)\.json$/i, "")),
    side: filename.toLowerCase().includes("-buyer") ? "buyer" : "seller",
    agent_id: typeof agent?.agent_id === "string" ? (agent.agent_id as string) : null,
    client_name: typeof client?.name === "string" ? (client.name as string) : null,
    stage: typeof meta?.stage === "string" ? (meta.stage as string) : null,
    updated_at: typeof meta?.updated_at === "string" ? (meta.updated_at as string) : null,
  };
}

export async function listDealChannels(): Promise<DealChannelSummary[]> {
  const summaries: DealChannelSummary[] = [];
  if (getStorageMode() === "github") {
    const c = githubConfig();
    const base = c.basePath ? `${c.basePath}/_database/deals` : `_database/deals`;
    const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${encodeURIComponent(
      base
    ).replace(/%2F/g, "/")}?ref=${encodeURIComponent(c.branch)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${c.token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "agency-demo-memory-store",
      },
    });
    if (!res.ok) return summaries;
    const entries = (await res.json()) as Array<{ name: string; type: string }>;
    for (const entry of entries) {
      if (entry.type !== "file") continue;
      if (!/^\d+-(buyer|seller)\.json$/i.test(entry.name)) continue;
      try {
        const text = await githubRead(`${base}/${entry.name}`);
        const s = parseDealSummary(entry.name, text);
        if (s) summaries.push(s);
      } catch {
        // skip unreadable entries
      }
    }
    return summaries;
  }
  const dir = dealsDir(getAgencyRoot());
  if (!fs.existsSync(dir)) return summaries;
  for (const name of fs.readdirSync(dir)) {
    if (!/^\d+-(buyer|seller)\.json$/i.test(name)) continue;
    try {
      const text = fs.readFileSync(path.join(dir, name), "utf8");
      const s = parseDealSummary(name, text);
      if (s) summaries.push(s);
    } catch {
      // skip unreadable
    }
  }
  return summaries;
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

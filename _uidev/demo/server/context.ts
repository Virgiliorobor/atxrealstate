import fs from "node:fs";
import path from "node:path";
import { getAgencyRoot } from "./paths.js";

const MAX_CHUNK = 48_000;

function readRel(rel: string): string | null {
  const p = path.join(getAgencyRoot(), ...rel.split("/"));
  if (!fs.existsSync(p)) return null;
  const s = fs.readFileSync(p, "utf8");
  return s.length > MAX_CHUNK ? s.slice(0, MAX_CHUNK) + "\n\n[…truncated…]\n" : s;
}

function section(title: string, body: string) {
  return `\n\n=== ${title} ===\n\n${body}`;
}

export function buildContextPackage(opts: {
  channel: string;
  dealFile: string | null;
}): string {
  const root = getAgencyRoot();
  const parts: string[] = [];
  parts.push(`AGENCY_ROOT: ${root}`);
  parts.push(`CURRENT_CHANNEL: ${opts.channel}`);

  const ch = opts.channel.toLowerCase();
  const isOpenEntry =
    ch.includes("open-entry") || ch.includes("principal-open") || ch === "#diana";

  if (isOpenEntry) {
    parts.push(
      section(
        "SESSION_MODE — OPEN_ENTRY (Principal)",
        `The human in this channel is **Diana Castellano**, principal — not the guided junior-agent (Marco) demo persona.
**Open entry:** they may ask anything — firm strategy, system behavior, cross-deal questions, hypotheticals, or free-form instructions.
Route to specialists when it helps; answer in a direct principal-appropriate voice when that is clearer. Do not assume guided-mode Marco unless they change channel.`
      )
    );
  }

  if (opts.dealFile) {
    const dealPath = path.join("_database", "deals", opts.dealFile);
    const full = readRel(dealPath);
    if (full) parts.push(section(`DEAL_FILE ${opts.dealFile}`, full));
  }

  const coreStatic = [
    "AI_README.md",
    "00_orchestrator/identity.md",
    "00_orchestrator/rules.md",
    "00_orchestrator/handoff.md",
    "_config/slack_commands.md",
  ];

  for (const rel of coreStatic) {
    const body = readRel(rel);
    if (body) parts.push(section(rel, body));
  }

  const agentYaml = isOpenEntry
    ? "_config/agent_profiles/diana.yaml"
    : "_config/agent_profiles/marco.yaml";
  const agentMd = isOpenEntry
    ? "_config/agent_profiles/diana.md"
    : "_config/agent_profiles/marco.md";
  for (const rel of [agentYaml, agentMd]) {
    const body = readRel(rel);
    if (body) parts.push(section(rel, body));
  }

  const specialists = [
    "01_lead_qualifier/identity.md",
    "01_lead_qualifier/rules.md",
    "02_property_research/identity.md",
    "02_property_research/rules.md",
    "03_client_communication/identity.md",
    "03_client_communication/rules.md",
    "04_transaction_coordinator/identity.md",
    "04_transaction_coordinator/rules.md",
    "05_listing_manager/identity.md",
    "05_listing_manager/rules.md",
  ];
  for (const rel of specialists) {
    const body = readRel(rel);
    if (body) parts.push(section(rel, body));
  }

  if (opts.channel.toLowerCase().includes("327") || opts.channel.toLowerCase().includes("seller")) {
    const c = readRel("_config/agent_profiles/carlos.yaml");
    if (c) parts.push(section("carlos.yaml (seller channel context)", c.slice(0, 12_000)));
  }

  return parts.join("\n");
}

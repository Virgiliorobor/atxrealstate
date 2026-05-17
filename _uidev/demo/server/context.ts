import { getAgencyRoot } from "./paths.js";

export type CurrentUser = {
  agent_id: string;
  name: string;
  slack_handle: string;
  role: "agent" | "principal";
};

/**
 * Builds the small per-turn context block that goes into Claude's system prompt.
 *
 * In the agentic design, we do NOT pre-load instruction files here. Claude reads
 * the agency repo itself via the tools defined in `tools.ts`, starting from
 * `AI_README.md`. This block only tells Claude WHERE it is (channel, deal,
 * persona) so it knows what to read.
 *
 * Two identity modes:
 *  1. `currentUser` provided (production /app route): identity comes from the
 *     authenticated session — exactly the spirit of ICM rules.md ("the Slack
 *     handle is the identity key"). Claude is told who the speaker is and
 *     loads their agent profile.
 *  2. No `currentUser` (legacy /api/chat demo): identity is inferred from
 *     the channel name (kept for backwards compatibility with the demo).
 */
export function buildContextPackage(opts: {
  channel: string;
  dealFile: string | null;
  currentUser?: CurrentUser | null;
}): string {
  const root = getAgencyRoot();
  const ch = opts.channel.toLowerCase();
  const isOpenEntry =
    ch.includes("open-entry") ||
    ch.includes("principal-open") ||
    ch === "#diana" ||
    ch.includes("diana-dashboard") ||
    ch.includes("team-general");

  const lines: string[] = [];
  lines.push(`AGENCY_ROOT: ${root}`);
  lines.push(`CURRENT_CHANNEL: ${opts.channel}`);

  if (opts.dealFile) {
    lines.push(`ACTIVE_DEAL_FILE: _database/deals/${opts.dealFile}`);
  } else {
    lines.push(`ACTIVE_DEAL_FILE: (none — this channel is not deal-bound)`);
  }

  // PRODUCTION MODE: identity is authenticated, not inferred from channel.
  // This mirrors ICM rules.md exactly: "Every incoming message is mapped to
  // an agent profile before any routing decision is made."
  if (opts.currentUser) {
    const u = opts.currentUser;
    const roleClause =
      u.role === "principal"
        ? "She is the principal — full system access, operational mode, can read all deals and override agent decisions."
        : "Apply their output_mode and communication tone from the profile.";
    lines.push(
      `SPEAKER: ${u.slack_handle} (${u.name}, agent_id="${u.agent_id}", role=${u.role}). ` +
        `Per orchestrator rules.md, load _config/agent_profiles/${u.agent_id}.yaml and ${u.agent_id}.md ` +
        `before any routing decision. ${roleClause}`
    );
    if (u.role === "principal" && opts.dealFile) {
      lines.push(
        "NOTE: Diana is observing/posting in another agent's deal channel. " +
          "The deal's assigned agent is recorded in the deal file's `deal.agent.agent_id` field — " +
          "treat the assigned agent as the deal owner. Diana's posts are principal-level guidance, " +
          "not the deal owner's voice."
      );
    }
    return lines.join("\n");
  }

  // LEGACY DEMO MODE: identity inferred from channel name.
  if (isOpenEntry) {
    lines.push(
      "SESSION_MODE: OPEN_ENTRY — the human is Diana Castellano (principal). " +
        "She may ask anything. Load her profile from `_config/agent_profiles/diana.yaml` " +
        "and `_config/agent_profiles/diana.md`. " +
        "Answer in a principal-appropriate direct voice; do not assume guided-mode Marco."
    );
  } else if (ch.includes("327") || (ch.includes("seller") && !ch.includes("inbound"))) {
    lines.push(
      "SESSION_MODE: GUIDED — the human is Carlos Mendoza (senior agent, listing/seller specialist). " +
        "Load his profile from `_config/agent_profiles/carlos.yaml` and `_config/agent_profiles/carlos.md`. " +
        "SELLER_CONTEXT: this is a seller-side listing deal. " +
        "Read the deal file to understand current stage, listing status, and any offers received."
    );
  } else if (ch.includes("412")) {
    lines.push(
      "SESSION_MODE: GUIDED — the human is Elena Reyes (senior agent, buyer specialist). " +
        "Load her profile from `_config/agent_profiles/elena.yaml` and `_config/agent_profiles/elena.md`. " +
        "Deal #412 (Chen family) is in due diligence — two risk flags are open (appraisal gap $23K, inspection response pending). " +
        "Read the deal file before advising."
    );
  } else if (ch.includes("inbound-lead")) {
    lines.push(
      "SESSION_MODE: GUIDED — this is a NEW INBOUND LEAD from the agency website. " +
        "Load Marco's profile from `_config/agent_profiles/marco.yaml` as the default handler. " +
        "Run `sop_01_new_lead` step by step, explaining each action as you go (guided mode). " +
        "Help the agent qualify the lead, verify pre-approval, and create a deal record."
    );
  } else if (ch.includes("019") || ch.includes("team-general")) {
    lines.push(
      "SESSION_MODE: GUIDED — the human is Marco Reyes (junior agent, output_mode=guided). " +
        "Load his profile from `_config/agent_profiles/marco.yaml` and `_config/agent_profiles/marco.md`. " +
        "Deal #019 (Jordan Kim, buyer, draft stage) is active in this channel. " +
        "Read `_database/deals/019-buyer.json` for context before advising. " +
        "Walk Marco through each step of the intake SOP, explaining what you are checking and why."
    );
  } else {
    lines.push(
      "SESSION_MODE: GUIDED — the human is Marco Reyes (junior agent, output_mode=guided). " +
        "Load his profile from `_config/agent_profiles/marco.yaml` and `_config/agent_profiles/marco.md`."
    );
  }

  return lines.join("\n");
}

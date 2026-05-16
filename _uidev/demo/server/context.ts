import { getAgencyRoot } from "./paths.js";

/**
 * Builds the small per-turn context block that goes into Claude's system prompt.
 *
 * In the agentic design, we do NOT pre-load instruction files here. Claude reads
 * the agency repo itself via the tools defined in `tools.ts`, starting from
 * `AI_README.md`. This block only tells Claude WHERE it is (channel, deal,
 * persona) so it knows what to read.
 */
export function buildContextPackage(opts: {
  channel: string;
  dealFile: string | null;
}): string {
  const root = getAgencyRoot();
  const ch = opts.channel.toLowerCase();
  const isOpenEntry =
    ch.includes("open-entry") || ch.includes("principal-open") || ch === "#diana";

  const lines: string[] = [];
  lines.push(`AGENCY_ROOT: ${root}`);
  lines.push(`CURRENT_CHANNEL: ${opts.channel}`);

  if (opts.dealFile) {
    lines.push(`ACTIVE_DEAL_FILE: _database/deals/${opts.dealFile}`);
  } else {
    lines.push(`ACTIVE_DEAL_FILE: (none — this channel is not deal-bound)`);
  }

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

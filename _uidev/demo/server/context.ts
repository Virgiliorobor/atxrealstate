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
        "She may ask anything (firm strategy, system behavior, cross-deal questions, " +
        "hypotheticals, free-form instructions). Load her profile from " +
        "`_config/agent_profiles/diana.yaml` and `_config/agent_profiles/diana.md`. " +
        "Answer in a principal-appropriate direct voice; do not assume guided-mode Marco."
    );
  } else {
    lines.push(
      "SESSION_MODE: GUIDED — the human is Marco Reyes (junior agent, output_mode=guided). " +
        "Load his profile from `_config/agent_profiles/marco.yaml` and `_config/agent_profiles/marco.md`."
    );
  }

  if (ch.includes("327") || ch.includes("seller")) {
    lines.push(
      "SELLER_CONTEXT: this is a seller-side deal. Also load `_config/agent_profiles/carlos.yaml` " +
        "(the seller/listing agent persona) when relevant."
    );
  }

  return lines.join("\n");
}

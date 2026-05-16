import Anthropic from "@anthropic-ai/sdk";
import {
  AGENCY_TOOLS,
  executeAgencyTool,
  toolRecordToActivityItem,
  type ToolCallRecord,
} from "./tools.js";

export type ActivityItem = { time: string; icon: string; label: string };

export type UiBlock =
  | { type: "brief"; title: string; markdown: string }
  | { type: "listing_preview"; title: string; property_id: string; markdown: string };

export type ClaudeTurnResult = {
  chat_response: string;
  activity_log: ActivityItem[];
  specialist_activated: string | null;
  sop_active: string | null;
  sop_step: number | null;
  deal_stage: string | null;
  ui_blocks?: UiBlock[];
  state_patch?: {
    append_events?: Array<Record<string, unknown>>;
    meta_updates?: { stage?: string };
  };
  _meta?: {
    model: string;
    stop_reason: string | null;
    output_tokens: number;
    input_tokens: number;
    latency_ms: number;
    max_tokens: number;
    tool_iterations: number;
    tool_calls: number;
  };
};

/**
 * Bootstrap instruction. This is intentionally short. The agency repository
 * itself is Claude's "system" — these few paragraphs just point Claude at it
 * and define the JSON envelope the UI expects in the FINAL response.
 */
const BOOTSTRAP_INSTRUCTION = `You are the AI operating system for **Diana Castellano Real Estate**, a boutique residential real estate team in Austin, TX. The complete specification for how you behave lives in the **agency repository** — a folder of markdown, YAML, and JSON files — which you can read with tools.

## YOUR FIRST ACTION, ALWAYS

Call \`read_file("AI_README.md")\`. That file tells you to read the four files under \`00_orchestrator/\` before doing anything else. Read them — \`identity.md\`, \`rules.md\`, \`handoff.md\`, \`examples.md\`. They define who you are and how to route.

## HOW TO NAVIGATE

The repo is laid out as:
- \`AI_README.md\` — system briefing (read FIRST)
- \`00_orchestrator/\` — your own identity, rules, handoff protocol, examples
- \`01_lead_qualifier/\`, \`02_property_research/\`, \`03_client_communication/\`, \`04_transaction_coordinator/\`, \`05_listing_manager/\` — specialists you route to (each has \`identity.md\`, \`rules.md\`, \`examples.md\`)
- \`_config/agent_profiles/\` — agent personas (marco, diana, carlos, elena, sara)
- \`_config/slack_commands.md\`, \`_config/brand_standards.md\`, \`_config/system_settings.yaml\`
- \`_sops/\` — step-by-step standard operating procedures (sop_01 … sop_05)
- \`_catalog/properties/\` — the property catalog (ATX-001 through ATX-016+, each a markdown file with YAML frontmatter)
- \`_database/deals/\` — live deal state as JSON (e.g. \`412-buyer.json\`, \`327-seller.json\`)
- \`_database/schema.json\` — the canonical deal schema

Use \`list_directory\` to discover what's there. Use \`read_file\` to load instructions, deal state, and property listings. Use \`search_files\` when you don't know the exact path (e.g. "which property is in Travis Heights").

## ROUTING WORKFLOW (per AI_README + orchestrator)

1. Read \`AI_README.md\`, then all four \`00_orchestrator/\` files.
2. Detect intent from the user's message + the channel hint below.
3. Read the relevant specialist's three files (\`identity.md\`, \`rules.md\`, \`examples.md\`).
4. Read the active deal JSON if any (use ACTIVE_DEAL_FILE from the turn context).
5. Read any specific property file the user references (e.g. \`_catalog/properties/ATX-016.md\`).
6. Read the relevant SOP from \`_sops/\` if the workflow needs it.
7. Compose your response in the specialist's voice and produce the JSON envelope below.

Be efficient: don't re-read files within a single turn, don't list folders you don't need, don't read all 16 property files when the user asked about one.

## WRITES

You do NOT write files via tools. To persist changes:
- For deal state (events, stage), include \`state_patch\` in your final JSON. The server merges it into the deal JSON for you.
- For new property markdown, include a \`listing_preview\` ui_block. The UI shows a Confirm button; the user gates the write.

## PROPERTY ID NOTE

\`ATX-016\` is the Chen / Bluebonnet contract home for deal #412. \`ATX-003\` is a separate demo catalog listing. Do not conflate them.

## FINAL OUTPUT (REQUIRED)

When you have enough context, your FINAL assistant turn must be a **single JSON object** with no markdown fences, no commentary, no preface. Schema:

\`\`\`
{
  "chat_response": string — Slack-style message body for the center panel, in the active specialist's tone,
  "activity_log": array of { "time": "HH:MM:SS", "icon": string, "label": string } — 4-12 entries describing what you did (orchestrator routing, specialist activation, file ops, decisions). The server will prepend real tool calls automatically; you supply the narrative ones.
  "specialist_activated": string | null (e.g. "02_property_research"),
  "sop_active": string | null (e.g. "sop_03_offer_received"),
  "sop_step": number | null,
  "deal_stage": string | null,
  "ui_blocks": optional array of:
    { "type": "brief", "title": string, "markdown": string }  — for research / brief / CMA output,
    { "type": "listing_preview", "title": string, "property_id": "ATX-###", "markdown": string }  — proposed listing markdown including YAML frontmatter,
  "state_patch": optional, ONLY when a deal channel is active:
    {
      "append_events": [ { "event_id", "timestamp", "actor_type", "actor_id", "agent_id", "action", "detail", "outcome", "next_triggered" }, ... ],
      "meta_updates": { "stage": string }
    }
}
\`\`\`

Never invent file paths outside \`_database/deals/\` or \`_catalog/properties/\` for writes. If you're unsure, omit \`state_patch\`.`;

function stripFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```$/i, "");
    t = t.trim();
  }
  // Claude sometimes emits narrative text before the JSON envelope — find the object.
  const start = t.indexOf("{");
  if (start > 0) t = t.slice(start);
  const end = t.lastIndexOf("}");
  if (end >= 0 && end < t.length - 1) t = t.slice(0, end + 1);
  return t.trim();
}

export function parseClaudeJson(text: string): ClaudeTurnResult {
  const cleaned = stripFence(text);
  const data = JSON.parse(cleaned) as Partial<ClaudeTurnResult>;
  return {
    chat_response: String(data.chat_response ?? ""),
    activity_log: Array.isArray(data.activity_log) ? data.activity_log : [],
    specialist_activated: data.specialist_activated ?? null,
    sop_active: data.sop_active ?? null,
    sop_step: typeof data.sop_step === "number" ? data.sop_step : null,
    deal_stage: data.deal_stage ?? null,
    ui_blocks: Array.isArray(data.ui_blocks) ? data.ui_blocks : undefined,
    state_patch:
      data.state_patch && typeof data.state_patch === "object" ? data.state_patch : undefined,
  };
}

type AnthropicMessageParam = Anthropic.MessageParam;
type AnthropicContentBlock = Anthropic.ContentBlock;

export async function runClaudeTurn(
  channelContext: string,
  userMessage: string
): Promise<ClaudeTurnResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
  const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS ?? "8192") || 8192;
  const maxIterations =
    Number(process.env.ANTHROPIC_MAX_TOOL_ITERATIONS ?? "25") || 25;
  const client = new Anthropic({ apiKey });

  const system = `${BOOTSTRAP_INSTRUCTION}\n\n=== TURN CONTEXT ===\n\n${channelContext}`;
  const messages: AnthropicMessageParam[] = [
    { role: "user", content: userMessage },
  ];
  const toolRecords: ToolCallRecord[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let lastModel = model;
  let lastStopReason: string | null = null;
  const started = Date.now();

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const msg = await client.messages.create({
      model,
      max_tokens: maxTokens,
      tools: AGENCY_TOOLS,
      system,
      messages,
    });
    totalInputTokens += msg.usage?.input_tokens ?? 0;
    totalOutputTokens += msg.usage?.output_tokens ?? 0;
    lastModel = msg.model ?? model;
    lastStopReason = msg.stop_reason ?? null;

    if (msg.stop_reason === "tool_use") {
      const assistantBlocks = msg.content as AnthropicContentBlock[];
      messages.push({ role: "assistant", content: assistantBlocks });

      const toolUseBlocks = assistantBlocks.filter(
        (b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> =>
          b.type === "tool_use"
      );
      // Execute tool calls in parallel — local fs is sync, GitHub API is I/O-bound.
      const executed = await Promise.all(
        toolUseBlocks.map((b) =>
          executeAgencyTool(b.name, (b.input as Record<string, unknown>) ?? {})
        )
      );
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
        is_error?: boolean;
      }> = [];
      executed.forEach(({ result, record }, i) => {
        toolRecords.push(record);
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUseBlocks[i].id,
          content: result,
          is_error: !record.ok,
        });
      });
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // end_turn (or max_tokens / stop_sequence) — produce final result
    const textBlock = (msg.content as AnthropicContentBlock[]).find(
      (b): b is Extract<AnthropicContentBlock, { type: "text" }> => b.type === "text"
    );
    const meta = {
      model: lastModel,
      stop_reason: lastStopReason,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      latency_ms: Date.now() - started,
      max_tokens: maxTokens,
      tool_iterations: iteration + 1,
      tool_calls: toolRecords.length,
    };

    if (!textBlock) {
      return {
        chat_response: "(model returned no text)",
        activity_log: toolRecords.map(toolRecordToActivityItem),
        specialist_activated: null,
        sop_active: null,
        sop_step: null,
        deal_stage: null,
        _meta: meta,
      };
    }

    try {
      const parsed = parseClaudeJson(textBlock.text);
      // Prepend real tool calls so judges see actual file ops in the activity feed.
      const toolItems = toolRecords.map(toolRecordToActivityItem);
      const merged = [...toolItems, ...parsed.activity_log];
      return { ...parsed, activity_log: merged, _meta: meta };
    } catch {
      return {
        chat_response: textBlock.text,
        activity_log: [
          ...toolRecords.map(toolRecordToActivityItem),
          {
            time: new Date().toTimeString().slice(0, 8),
            icon: "⚠️",
            label: "Model returned non-JSON; showing raw text",
          },
        ],
        specialist_activated: null,
        sop_active: null,
        sop_step: null,
        deal_stage: null,
        _meta: meta,
      };
    }
  }

  // Hit iteration cap without an end_turn — return what we have.
  return {
    chat_response: `(stopped after ${maxIterations} tool iterations without a final response — increase ANTHROPIC_MAX_TOOL_ITERATIONS if this recurs)`,
    activity_log: toolRecords.map(toolRecordToActivityItem),
    specialist_activated: null,
    sop_active: null,
    sop_step: null,
    deal_stage: null,
    _meta: {
      model: lastModel,
      stop_reason: lastStopReason,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      latency_ms: Date.now() - started,
      max_tokens: maxTokens,
      tool_iterations: maxIterations,
      tool_calls: toolRecords.length,
    },
  };
}

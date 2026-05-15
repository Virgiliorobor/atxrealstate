import Anthropic from "@anthropic-ai/sdk";

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
  };
};

const JSON_INSTRUCTION = `You are The Agency operating system. Use the loaded folder context exactly; route like the Orchestrator and specialists.

You MUST respond with a single JSON object only (no markdown fences, no commentary). Keys:
- "chat_response": string — Slack-style message body for the center panel (use specialist tone; prefix lines with role if helpful).
- "activity_log": array of { "time": "HH:MM:SS", "icon": string, "label": string } — 4–12 entries simulating orchestrator + routing + file ops.
- "specialist_activated": string | null — e.g. "02_property_research" or null.
- "sop_active": string | null
- "sop_step": number | null
- "deal_stage": string | null — current inferred stage for the active deal channel.
- "ui_blocks": optional array of blocks:
  - { "type": "brief", "title": string, "markdown": string } for property/neighborhood/CMA style output when user asks brief/research.
  - { "type": "listing_preview", "title": string, "property_id": "ATX-###", "markdown": string } when proposing listing/catalog edits (full proposed .md body including YAML frontmatter).
- "state_patch": optional object used ONLY when a deal channel is active (#412-buyer or #327-seller):
  - "append_events": optional array of event objects to append to deal.events (include event_id, timestamp, actor_type, actor_id, agent_id, action, detail, outcome, next_triggered fields when possible).
  - "meta_updates": optional { "stage": string } if stage legitimately changes.
Property IDs: **ATX-016** is the Chen / Bluebonnet contract home for deal #412; **ATX-003** is a separate demo catalog listing — do not conflate them (DEMO_UI_UPDATE_SPEC).
Never invent file paths outside _database/deals/ or _catalog/properties/. If unsure, omit state_patch.`;

function stripFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```$/i, "");
  }
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
    state_patch: data.state_patch && typeof data.state_patch === "object" ? data.state_patch : undefined,
  };
}

export async function runClaudeTurn(systemContext: string, userMessage: string): Promise<ClaudeTurnResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
  const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS ?? "8192") || 8192;
  const client = new Anthropic({ apiKey });
  const started = Date.now();

  const msg = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: `${JSON_INSTRUCTION}\n\n=== AGENCY CONTEXT PACKAGE ===\n\n${systemContext}`,
    messages: [{ role: "user", content: userMessage }],
  });
  const meta = {
    model,
    stop_reason: msg.stop_reason ?? null,
    output_tokens: msg.usage?.output_tokens ?? 0,
    input_tokens: msg.usage?.input_tokens ?? 0,
    latency_ms: Date.now() - started,
    max_tokens: maxTokens,
  };

  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text content from Claude");
  }
  try {
    return { ...parseClaudeJson(block.text), _meta: meta };
  } catch {
    return {
      chat_response: block.text,
      activity_log: [
        { time: new Date().toTimeString().slice(0, 8), icon: "⚠️", label: "Model returned non-JSON; showing raw text" },
      ],
      specialist_activated: null,
      sop_active: null,
      sop_step: null,
      deal_stage: null,
      _meta: meta,
    };
  }
}

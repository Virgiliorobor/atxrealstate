import { bootstrapAgencyFiles } from "../../dist/server/bootstrap.js";
import { buildContextPackage } from "../../dist/server/context.js";
import { runClaudeTurn } from "../../dist/server/claude.js";
import {
  applyDealStatePatch,
  buildChannelMemory,
  channelToDealFile,
  getStorageMode,
  readDealJsonString,
  writePropertyMarkdown,
} from "../../dist/server/memoryStore.js";
import { assertSafePropertyId } from "../../dist/server/paths.js";

let boot = null;

export function ensureBoot() {
  if (!boot) boot = bootstrapAgencyFiles();
  return boot;
}

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

export function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

export async function handleChat(event) {
  try {
    ensureBoot();
    const body = parseBody(event);
    const message = String(body?.message ?? "").trim();
    const channel = String(body?.channel ?? "#team-general").trim();
    if (!message) return json(400, { error: "message required" });

    const dealFile = channelToDealFile(channel);
    const ctx = buildContextPackage({ channel, dealFile });
    const result = await runClaudeTurn(ctx, `[Channel: ${channel}]\n\n${message}`);

    let persistence = {};
    if (dealFile && result.state_patch) {
      const out = await applyDealStatePatch(dealFile, result.state_patch);
      persistence = { deal: out.applied, errors: out.errors };
    }

    return json(200, { ...result, persistence });
  } catch (e) {
    return json(500, { error: String(e) });
  }
}

export async function handleDeal(event) {
  try {
    ensureBoot();
    const channel = String(event.queryStringParameters?.channel ?? "#412-buyer");
    const dealFile = channelToDealFile(channel);
    if (!dealFile) return json(400, { error: "invalid channel" });
    const raw = await readDealJsonString(dealFile);
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: raw };
  } catch (e) {
    return json(500, { error: String(e) });
  }
}

export async function handleChannelMemory(event) {
  try {
    ensureBoot();
    const channel = String(event.queryStringParameters?.channel ?? "#team-general");
    const entries = await buildChannelMemory(channel);
    return json(200, { channel, entries });
  } catch (e) {
    return json(500, { error: String(e) });
  }
}

export async function handleApplyProperty(event) {
  try {
    ensureBoot();
    const body = parseBody(event);
    const propertyId = String(body?.property_id ?? "").trim();
    const markdown = String(body?.markdown ?? "");
    assertSafePropertyId(propertyId);
    if (!markdown.includes("property_id:")) {
      return json(400, { error: "markdown must include YAML frontmatter with property_id" });
    }
    const p = await writePropertyMarkdown(propertyId, markdown);
    return json(200, { ok: true, path: p });
  } catch (e) {
    return json(500, { error: String(e) });
  }
}

export function handleHealth() {
  try {
    const b = ensureBoot();
    return json(200, { ok: true, agencyRoot: b.agencyRoot, storageMode: getStorageMode() });
  } catch (e) {
    return json(500, { ok: false, error: String(e) });
  }
}


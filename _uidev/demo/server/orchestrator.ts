import fs from "node:fs";
import path from "node:path";
import { assertSafeDealFile, dealsDir, getAgencyRoot } from "./paths.js";

type Json = Record<string, unknown>;

function readDealFile(dealFile: string): Json {
  assertSafeDealFile(dealFile);
  const p = path.join(dealsDir(getAgencyRoot()), dealFile);
  return JSON.parse(fs.readFileSync(p, "utf8")) as Json;
}

function writeDealFile(dealFile: string, data: Json) {
  assertSafeDealFile(dealFile);
  const p = path.join(dealsDir(getAgencyRoot()), dealFile);
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, p);
}

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export type StatePatch = {
  append_events?: Array<Record<string, unknown>>;
  meta_updates?: { stage?: string; updated_at?: string };
};

export function applyDealStatePatch(
  dealFile: string,
  patch: StatePatch
): { applied: string[]; errors: string[] } {
  const applied: string[] = [];
  const errors: string[] = [];
  if (!patch || typeof patch !== "object") return { applied, errors };

  let doc: Json;
  try {
    doc = readDealFile(dealFile);
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
    writeDealFile(dealFile, doc);
  } catch (e) {
    errors.push(`write deal failed: ${e}`);
  }
  return { applied, errors };
}

export function readDealJsonString(dealFile: string): string {
  assertSafeDealFile(dealFile);
  const p = path.join(dealsDir(getAgencyRoot()), dealFile);
  return fs.readFileSync(p, "utf8");
}

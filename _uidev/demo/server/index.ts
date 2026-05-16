import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapAgencyFiles } from "./bootstrap.js";
import { buildContextPackage } from "./context.js";
import { runClaudeTurn } from "./claude.js";
import { renderBriefPdf } from "./briefPdf.js";
import {
  applyDealStatePatch,
  buildChannelMemory,
  channelToDealFile,
  getStorageMode,
  readDealJsonString,
  writePropertyMarkdown,
} from "./memoryStore.js";
import {
  assertSafePropertyId,
} from "./paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

let boot: ReturnType<typeof bootstrapAgencyFiles> | null = null;
function ensureBoot() {
  if (!boot) boot = bootstrapAgencyFiles();
  return boot;
}

app.get("/api/health", (_req, res) => {
  try {
    const b = ensureBoot();
    res.json({ ok: true, agencyRoot: b.agencyRoot, storageMode: getStorageMode() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const b = ensureBoot();
    const message = String(req.body?.message ?? "").trim();
    const channel = String(req.body?.channel ?? "#team-general").trim();
    if (!message) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const dealFile = channelToDealFile(channel);
    const ctx = buildContextPackage({ channel, dealFile });

    const result = await runClaudeTurn(ctx, `[Channel: ${channel}]\n\n${message}`);

    let persistence: { deal?: string[]; errors?: string[] } = {};
    if (dealFile && result.state_patch) {
      const out = await applyDealStatePatch(dealFile, result.state_patch);
      persistence = { deal: out.applied, errors: out.errors };
    }

    res.json({ ...result, persistence });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/deal", async (req, res) => {
  try {
    ensureBoot();
    const channel = String(req.query.channel ?? "#412-buyer");
    const dealFile = channelToDealFile(channel);
    if (!dealFile) {
      res.status(400).json({ error: "invalid channel" });
      return;
    }
    const raw = await readDealJsonString(dealFile);
    res.type("application/json").send(raw);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/channel-memory", async (req, res) => {
  try {
    ensureBoot();
    const channel = String(req.query.channel ?? "#team-general");
    const entries = await buildChannelMemory(channel);
    res.json({ channel, entries });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/apply-property", async (req, res) => {
  try {
    const b = ensureBoot();
    const propertyId = String(req.body?.property_id ?? "").trim();
    const markdown = String(req.body?.markdown ?? "");
    assertSafePropertyId(propertyId);
    if (!markdown.includes("property_id:")) {
      res.status(400).json({ error: "markdown must include YAML frontmatter with property_id" });
      return;
    }
    const p = await writePropertyMarkdown(propertyId, markdown);
    res.json({ ok: true, path: p });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/brief-pdf", async (req, res) => {
  try {
    const title = String(req.body?.title ?? "Property brief").trim().slice(0, 200);
    const markdown = String(req.body?.markdown ?? "");
    if (!markdown.trim()) {
      res.status(400).json({ error: "markdown required" });
      return;
    }
    const buf = await renderBriefPdf(title, markdown);
    const safeName = title.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "brief";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.setHeader("Content-Length", buf.length.toString());
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Slack webhook stub — Phase 2 implementation
app.post("/api/slack/events", (req, res) => {
  if (req.body && req.body.type === "url_verification") {
    return res.json({ challenge: req.body.challenge });
  }
  res.status(200).json({ status: "received" });
});

/** Dev: default 19877; `npm run dev` sets PORT via cross-env. Override in `.env`. */
const port = Number(process.env.PORT) || 19877;

const agencyWebsiteCandidates = [
  path.join(ensureBoot().agencyRoot, "_uidev", "the_agency_website", "dist"),
  path.join(process.cwd(), "dist", "client", "the_agency_website"),
];
const agencyWebsiteDistDir =
  agencyWebsiteCandidates.find((d) => fs.existsSync(path.join(d, "index.html"))) ??
  agencyWebsiteCandidates[1];

console.log(`Agency website mount path: ${agencyWebsiteDistDir}`);
console.log(
  `  exists at this path? ${fs.existsSync(path.join(agencyWebsiteDistDir, "index.html"))}`
);
app.use("/the_agency_website", express.static(agencyWebsiteDistDir));
// SPA fallback for agency-website client-side routes (e.g. /the_agency_website/listings).
// Registered unconditionally so /the_agency_website/* never falls through to the demo SPA.
app.get(/^\/the_agency_website(?:\/.*)?$/, (_req, res) => {
  const indexPath = path.join(agencyWebsiteDistDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).type("text/plain").send(
      `Agency website build not found at ${agencyWebsiteDistDir}. ` +
        `Check Railway build logs — the sync-agency-website.mjs step may have failed.`
    );
  }
});

const clientDir = path.join(process.cwd(), "dist", "client");
if (fs.existsSync(path.join(clientDir, "index.html"))) {
  app.use(express.static(clientDir));
  // Demo SPA catchall — excludes /api/* and /the_agency_website/* so those routes
  // are handled by their dedicated middleware above.
  app.get(/^(?!\/(?:api|the_agency_website)(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

app.listen(port, () => {
  try {
    const b = ensureBoot();
    console.log(`Agency demo API http://127.0.0.1:${port}`);
    console.log(`AGENCY_ROOT=${b.agencyRoot}`);
  } catch (e) {
    console.error("Bootstrap failed:", e);
    process.exit(1);
  }
});

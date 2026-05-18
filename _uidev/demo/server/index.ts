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
  appendChatLog,
  appendTeamChannelChatLog,
  buildChannelMemory,
  channelToDealFile,
  getStorageMode,
  listDealChannels,
  readChatLog,
  readDealJsonString,
  readTeamChannelChatLog,
  writePropertyMarkdown,
  type ChatLogEntry,
} from "./memoryStore.js";
import {
  assertSafePropertyId,
} from "./paths.js";
import {
  clearSessionCookie,
  getCurrentUser,
  listUsers,
  requireAuth,
  setSessionCookie,
  verifyLogin,
  type UserRecord,
} from "./users.js";

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

/* =====================================================================
 * PRODUCTION ROUTES (/app)  — Option C
 *
 * The demo (/) is preserved unchanged. These routes power the production
 * version: real login, channel-per-deal derived from _database/deals/,
 * server-side auto-logging into deal.chat_log[], faithful to the ICM
 * orchestrator rules ("the Slack handle is the identity key").
 * ===================================================================== */

app.post("/api/auth/login", (req, res) => {
  const agentId = String(req.body?.agent_id ?? "").trim().toLowerCase();
  const pin = String(req.body?.pin ?? "").trim();
  if (!agentId || !pin) {
    res.status(400).json({ error: "agent_id and pin required" });
    return;
  }
  const user = verifyLogin(agentId, pin);
  if (!user) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  setSessionCookie(res, user.agent_id);
  const { pin: _pin, ...safe } = user;
  res.json({ user: safe });
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const u = getCurrentUser(req);
  if (!u) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  const { pin: _pin, ...safe } = u;
  res.json({ user: safe });
});

app.get("/api/auth/users", (_req, res) => {
  // Public list — UI uses this to populate the login dropdown.
  res.json({ users: listUsers() });
});

/**
 * GET /api/app/channels
 *
 * Channel-per-deal model from system_settings.yaml:
 *   deal_channel_format: "#[deal_id]-[side]"
 *
 * Membership rules:
 *  - Agent: sees deals where deal.agent.agent_id === their agent_id + their open channel
 *  - Principal (Diana): sees all deal channels + her open channel
 */
app.get("/api/app/channels", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: UserRecord }).user;
  let dealChannels: Awaited<ReturnType<typeof listDealChannels>> = [];
  let channelError: string | undefined;
  try {
    const allDeals = await listDealChannels();
    dealChannels =
      user.role === "principal"
        ? allDeals
        : allDeals.filter((d) => d.agent_id === user.agent_id);
  } catch (e) {
    // Don't fail auth on storage errors — return empty channel list so the
    // user can still log in. The error is surfaced in the response for debugging.
    console.error("[channels] listDealChannels failed:", e);
    channelError = String(e);
  }
  res.json({
    user: { agent_id: user.agent_id, name: user.name, role: user.role },
    deal_channels: dealChannels,
    open_channel: user.open_channel,
    ...(channelError ? { _channel_error: channelError } : {}),
  });
});

/**
 * GET /api/app/chat-log?channel=#019-buyer
 *
 * Returns the persisted conversation history for the channel.
 * - Deal channels: reads from deal.chat_log[]
 * - Team channels: reads from _database/team_channels/<name>.json
 *
 * Access control: agents can only read channels they're assigned to;
 * principal can read all.
 */
app.get("/api/app/chat-log", requireAuth, async (req, res) => {
  try {
    const user = (req as typeof req & { user: UserRecord }).user;
    const channel = String(req.query.channel ?? "").trim();
    if (!channel) {
      res.status(400).json({ error: "channel required" });
      return;
    }
    const dealFile = channelToDealFile(channel);
    if (dealFile) {
      // Authorization: agent must own this deal, principal sees all.
      if (user.role !== "principal") {
        const summaries = await listDealChannels();
        const match = summaries.find((s) => s.deal_file === dealFile);
        if (!match || match.agent_id !== user.agent_id) {
          res.status(403).json({ error: "forbidden" });
          return;
        }
      }
      const log = await readChatLog(dealFile);
      res.json({ channel, entries: log });
      return;
    }
    // Team channel
    const log = await readTeamChannelChatLog(channel);
    res.json({ channel, entries: log });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/app/chat
 *
 * Production chat endpoint — authenticated, identity-aware, auto-logs to schema.
 * Mirrors /api/chat but:
 *  - Requires login (cookie)
 *  - Tells Claude WHO is speaking (per orchestrator rules.md)
 *  - Appends every exchange to the deal's chat_log[] in the JSON schema
 *  - Authorizes: agents can only post to their assigned deal channels or
 *    their open team channel; principal can post anywhere
 */
app.post("/api/app/chat", requireAuth, async (req, res) => {
  try {
    const user = (req as typeof req & { user: UserRecord }).user;
    const b = ensureBoot();
    const message = String(req.body?.message ?? "").trim();
    const channel = String(req.body?.channel ?? "").trim();
    if (!message || !channel) {
      res.status(400).json({ error: "message and channel required" });
      return;
    }

    const dealFile = channelToDealFile(channel);

    // Authorization
    if (dealFile) {
      if (user.role !== "principal") {
        const summaries = await listDealChannels();
        const match = summaries.find((s) => s.deal_file === dealFile);
        if (!match || match.agent_id !== user.agent_id) {
          res.status(403).json({ error: "forbidden — not your channel" });
          return;
        }
      }
    } else {
      // Team channel — agents may only post to their own open channel; principal to any.
      if (user.role !== "principal" && channel !== user.open_channel) {
        res.status(403).json({ error: "forbidden — not your channel" });
        return;
      }
    }

    const ctx = buildContextPackage({
      channel,
      dealFile,
      currentUser: {
        agent_id: user.agent_id,
        name: user.name,
        slack_handle: user.slack_handle,
        role: user.role,
      },
    });

    const userTurnText =
      `[Channel: ${channel}]\n` +
      `[Speaker: ${user.slack_handle} — ${user.name}, role=${user.role}]\n\n` +
      message;

    const result = await runClaudeTurn(ctx, userTurnText);

    // Build chat log entries (always persist both sides)
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const userEntry: ChatLogEntry = {
      ts: now,
      author: user.agent_id,
      author_name: user.name,
      role: "user",
      text: message,
    };
    const aiEntry: ChatLogEntry = {
      ts: new Date().toISOString().slice(0, 19).replace("T", " "),
      author: "ai_orchestrator",
      author_name: "Orchestrator",
      role: "ai",
      text: result.chat_response,
      specialist: result.specialist_activated ?? null,
    };

    let persistence: { deal?: string[]; errors?: string[]; chat_logged?: boolean } = {};
    if (dealFile) {
      // Apply state_patch (events, meta) — existing behavior
      if (result.state_patch) {
        const out = await applyDealStatePatch(dealFile, result.state_patch);
        persistence = { deal: out.applied, errors: out.errors };
      }
      // Auto-log conversation to deal.chat_log[]
      try {
        await appendChatLog(dealFile, [userEntry, aiEntry]);
        persistence.chat_logged = true;
      } catch (e) {
        persistence.errors = [...(persistence.errors ?? []), `chat_log: ${String(e)}`];
      }
    } else {
      try {
        await appendTeamChannelChatLog(channel, [userEntry, aiEntry]);
        persistence.chat_logged = true;
      } catch (e) {
        persistence.errors = [...(persistence.errors ?? []), `chat_log: ${String(e)}`];
      }
    }

    res.json({ ...result, persistence });
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
  path.join(process.cwd(), "agency_site"),
  path.join(ensureBoot().agencyRoot, "_uidev", "the_agency_website", "dist"),
];
const agencyWebsiteDistDir =
  agencyWebsiteCandidates.find((d) => fs.existsSync(path.join(d, "index.html"))) ??
  agencyWebsiteCandidates[0];

const agencyWebsiteImagesDir = path.join(
  ensureBoot().agencyRoot,
  "_uidev",
  "the_agency_website",
  "public",
  "Images"
);
console.log(`Agency website mount path: ${agencyWebsiteDistDir}`);
console.log(`Agency website images path: ${agencyWebsiteImagesDir}`);
console.log(
  `  exists at this path? ${fs.existsSync(path.join(agencyWebsiteDistDir, "index.html"))}`
);
// Images served from source (committed in the_agency_website/public/Images),
// not duplicated into agency_site/ to keep that committed dir small.
app.use("/the_agency_website/Images", express.static(agencyWebsiteImagesDir));
app.use("/the_agency_website", express.static(agencyWebsiteDistDir));
// SPA fallback for agency-website client-side routes (e.g. /the_agency_website/listings).
// Registered unconditionally so /the_agency_website/* never falls through to the demo SPA.
app.get(/^\/the_agency_website(?:\/.*)?$/, (_req, res) => {
  const indexPath = path.join(agencyWebsiteDistDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).type("text/plain").send(
      `Agency website not found at ${agencyWebsiteDistDir}. ` +
        `Run "npm run build" in _uidev/the_agency_website and commit _uidev/demo/agency_site/.`
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

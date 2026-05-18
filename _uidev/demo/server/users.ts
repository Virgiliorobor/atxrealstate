import crypto from "node:crypto";
import type { Request, Response } from "express";

/**
 * Production-mode user registry.
 *
 * Per ICM rules.md: "Every incoming message is mapped to an agent profile
 * before any routing decision is made. The Slack handle is the identity key."
 *
 * In this web build, login replaces the Slack handle. The agent_id below maps
 * 1:1 to _config/agent_profiles/<agent_id>.{yaml,md}, so Claude can load the
 * exact same persona it would in Slack.
 *
 * For the demo, PINs are simple and shared in the UI. In real deployment,
 * pull these from env vars or an actual identity provider.
 */

export type UserRole = "agent" | "principal";

export type UserRecord = {
  agent_id: string;        // matches _config/agent_profiles/<agent_id>.yaml
  name: string;
  slack_handle: string;    // for ICM-faithful logging
  role: UserRole;
  pin: string;             // demo only
  assigned_channel: string | null;  // primary deal channel for this user (null for principal)
  open_channel: string;    // personal team channel (e.g. "#diana-dashboard")
};

const ENV_USERS = process.env.AGENCY_USERS_JSON?.trim();

const DEFAULT_USERS: UserRecord[] = [
  {
    agent_id: "diana",
    name: "Diana Castellano",
    slack_handle: "@diana",
    role: "principal",
    pin: process.env.DIANA_PIN?.trim() || "0000",
    assigned_channel: null,
    open_channel: "#diana-dashboard",
  },
  {
    agent_id: "marco",
    name: "Marco Reyes",
    slack_handle: "@marco",
    role: "agent",
    pin: process.env.MARCO_PIN?.trim() || "0000",
    assigned_channel: "#019-buyer",
    open_channel: "#team-general",
  },
];

let USERS: UserRecord[] = DEFAULT_USERS;
if (ENV_USERS) {
  try {
    const parsed = JSON.parse(ENV_USERS) as UserRecord[];
    if (Array.isArray(parsed) && parsed.length > 0) USERS = parsed;
  } catch {
    // fall back to defaults
  }
}

export function listUsers(): Array<Omit<UserRecord, "pin">> {
  return USERS.map(({ pin: _pin, ...rest }) => rest);
}

export function findUser(agentId: string): UserRecord | null {
  return USERS.find((u) => u.agent_id === agentId) ?? null;
}

export function verifyLogin(agentId: string, pin: string): UserRecord | null {
  const u = findUser(agentId);
  if (!u) return null;
  if (u.pin !== pin) return null;
  return u;
}

/* ------------------------------------------------------------------ */
/* Session cookie — HMAC-signed, agent_id payload only.                */
/* ------------------------------------------------------------------ */

const COOKIE_NAME = "agency_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h
const SESSION_SECRET =
  process.env.AGENCY_SESSION_SECRET?.trim() ||
  // For demo-only when no secret configured. Persists across requests within
  // one process; rotates on restart. Production must set AGENCY_SESSION_SECRET.
  crypto.randomBytes(32).toString("hex");

function sign(payload: string): string {
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  // timing-safe compare; both must be same length
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
    return null;
  }
  return payload;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = decodeURIComponent(part.slice(eq + 1).trim());
    out[k] = v;
  }
  return out;
}

export function setSessionCookie(res: Response, agentId: string): void {
  const value = sign(agentId);
  const cookie =
    `${COOKIE_NAME}=${encodeURIComponent(value)}; ` +
    `Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}`;
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function getCurrentUser(req: Request): UserRecord | null {
  const cookies = parseCookies(req.headers.cookie);
  const signed = cookies[COOKIE_NAME];
  if (!signed) return null;
  const agentId = verify(signed);
  if (!agentId) return null;
  return findUser(agentId);
}

/**
 * Express middleware factory: requires a logged-in user.
 * Attaches `req.user` on success.
 */
export function requireAuth(req: Request, res: Response, next: () => void): void {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  (req as Request & { user: UserRecord }).user = user;
  next();
}

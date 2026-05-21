# Deployment Strategy — AI Agency Operating System

> Reference document for deploying ICM-based real estate AI assistants (or similar channel-per-deal, Claude-orchestrated apps) to Railway. Written from direct build experience. An AI agent should be able to follow this end-to-end.

---

## Architecture at a Glance

```
_database/deals/*.json        ← source of truth for all deal state + chat history
_config/agent_profiles/       ← agent personas loaded by Claude on every turn
_uidev/demo/server/           ← Express API (Claude, auth, storage, PDF)
_uidev/demo/src/              ← React SPA (demo + production /app login)
_uidev/the_agency_website/    ← Marketing site (Vite, pre-built into agency_site/)
```

**Request flow:**
1. User logs in → HMAC-signed session cookie issued
2. Front-end calls `/api/app/channels` → server reads `_database/deals/*.json` → returns filtered channel list
3. User sends message → `/api/app/chat` → Claude turn (with agent identity injected) → response + `state_patch` written back to deal JSON → chat entry appended to `deal.chat_log[]`

---

## Environment Variables (full list)

Set all of these in Railway → Service → Variables before first deploy.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Claude API key |
| `AGENCY_SESSION_SECRET` | **Yes** | 32+ char random string. Signs session cookies. **Must be stable across redeploys** — if unset, rotates on every restart and invalidates all sessions. |
| `STORAGE_MODE` | **Yes** | `local` (ephemeral, lost on redeploy) or `github` (durable, writes back to repo) |
| `GITHUB_OWNER` | If github mode | GitHub username or org |
| `GITHUB_REPO` | If github mode | Repository name |
| `GITHUB_TOKEN` | If github mode | Personal access token with **Contents: Read and Write** permission |
| `GITHUB_BRANCH` | If github mode | Branch to read/write (default: `main`) |
| `GITHUB_BASE_PATH` | No | Subdirectory inside repo if agency files aren't at root |
| `PORT` | No | Railway sets this automatically. Local default: `19877` |
| `ANTHROPIC_MODEL` | No | Override Claude model |
| `ANTHROPIC_MAX_TOKENS` | No | Default `8192` |
| `ANTHROPIC_MAX_TOOL_ITERATIONS` | No | Default `25` |
| `VITE_AGENCY_WEBSITE_URL` | No | Default `/the_agency_website/` |

**Critical:** Adding or changing any variable in Railway triggers an automatic redeploy. Use this to force rebuilds when auto-deploy doesn't fire.

---

## Storage Modes

### `STORAGE_MODE=local`
- Reads/writes to the container filesystem
- Railway containers are **ephemeral** — all runtime writes (chat messages, deal state updates) are wiped on every redeploy
- Safe for demos and testing; useless for production persistence
- Deal files committed to the repo are always present on deploy (from git clone)

### `STORAGE_MODE=github`
- Reads and writes go to GitHub via the Contents API
- Every chat message, state patch, and deal update becomes a real git commit on `GITHUB_BRANCH`
- Survives redeploys because data lives in GitHub, not the container
- Requires `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` to all be set
- **Fallback behaviour:** if GitHub is misconfigured, the server falls back to local FS for reads (channels still load from the cloned repo files). Writes will fail silently unless properly configured.

### GitHub Token Setup
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Select the specific repository
3. Repository permissions → **Contents: Read and Write**
4. No other permissions needed

---

## Railway Deployment

### First Deploy
1. Connect Railway service to the GitHub repo, branch `main`
2. Set root directory to `_uidev/demo` (where `package.json` and `railpack.json` live)
3. Add all required environment variables (see table above)
4. Railway will build and deploy automatically

### Build Pipeline
Railway uses `railpack.json` (in `_uidev/demo/`) which defines:
- **Install:** `npm install` in `_uidev/demo/` + `_uidev/the_agency_website/`
- **Build:** compile agency website into `agency_site/`, then `npm run build` for the SPA + server
- **Start:** `node dist/server/index.js`

The pre-built agency website (`agency_site/`) is committed to the repo to avoid build-time failures with nested package installs.

### Triggering Redeploys
- **Automatic:** Railway watches the connected branch and deploys on push (webhook). Sometimes the webhook doesn't fire.
- **Manual via variable change:** Edit any env var (even trivially) → Railway redeploys automatically. Most reliable trigger.
- **Manual via dashboard:** Deployments tab → three-dot menu on latest deployment → Redeploy.

---

## Authentication & Session Management

- Login replaces the Slack handle (per ICM rules: "the Slack handle is the identity key")
- Sessions use HMAC-SHA256 signed cookies (`agency_session`)
- `AGENCY_SESSION_SECRET` must be identical across all containers/redeploys
- If secret rotates (e.g. unset), all active sessions are invalidated → users see login screen

### User Registry
Defined in `server/users.ts`. Default users: `diana` (principal, PIN `0000`) and `marco` (agent, PIN `0000`).

Override at runtime with `AGENCY_USERS_JSON` env var (JSON array of `UserRecord`), or set `DIANA_PIN` / `MARCO_PIN` for just the PINs.

### Role Model
- **`agent`** — sees only deal channels where `deal.agent.agent_id === their agent_id` + their `open_channel`
- **`principal`** — sees all deal channels + their `open_channel`; can post to any channel as themselves

---

## Channel Discovery

Channels are derived dynamically from `_database/deals/*.json` at request time — there is no static channel registry.

**File naming convention:** `{deal_id}-{side}.json` (e.g. `019-buyer.json`, `327-seller.json`)

**Required fields inside each deal JSON:**
```json
{
  "deal": {
    "_id": { "slack_channel": "#019-buyer", "deal_id": "019" },
    "meta": { "stage": "active" },
    "agent": { "agent_id": "marco" },
    "client": { "name": "Jordan Kim" }
  }
}
```

If `_id.slack_channel` is missing, the channel name is derived from the filename (`#019-buyer`).
If `agent.agent_id` is missing, the deal shows as "unassigned" and only principals can see it.

---

## Chat Persistence

### Demo endpoint (`/api/chat`)
- Applies `state_patch` to deal JSON
- Does **not** write to `deal.chat_log[]`
- No authentication

### Production endpoint (`/api/app/chat`)
- Requires login cookie
- Injects speaker identity into Claude prompt: `[Speaker: @marco — Marco Reyes, role=agent]`
- Applies `state_patch` (deal events, stage changes, etc.)
- Appends both the user message and AI response to `deal.chat_log[]`
- Team channels (non-deal) write to `_database/team_channels/<name>.json`

**Chat log entry schema:**
```json
{
  "ts": "2026-05-21 14:30:00",
  "author": "marco",
  "author_name": "Marco Reyes",
  "role": "user",
  "text": "..."
}
```

---

## Common Failure Modes & Fixes

### Login screen reloads immediately after sign-in
**Cause:** `/api/app/channels` returning 500, causing the client to interpret it as an auth failure.
**Fix:** The channels endpoint must return 200 with an empty `deal_channels: []` on storage errors, never 500. The client must not treat a channel-load failure as an auth failure.

### Channels list is empty after login
**Causes (in order of likelihood):**
1. `STORAGE_MODE=github` but GitHub env vars missing → check Railway variables
2. Deal JSON files missing the `deal.agent.agent_id` field → update the JSON
3. Deal files not committed to the repo → commit them
4. Deal files use wrong filename format → must match `^\d+-(buyer|seller)\.json$`

### Chat history lost after redeploy
**Cause:** `STORAGE_MODE=local` — filesystem is ephemeral on Railway.
**Fix:** Switch to `STORAGE_MODE=github` with a properly scoped token.

### Session invalidated on every redeploy
**Cause:** `AGENCY_SESSION_SECRET` not set — a new random secret is generated each boot.
**Fix:** Set `AGENCY_SESSION_SECRET` to a stable 32+ character random string in Railway variables.

### GitHub storage writes failing silently
**Cause:** Token has read-only permissions.
**Fix:** Regenerate token with **Contents: Read and Write** on the specific repo.

### Agency website returns 503
**Cause:** `agency_site/` directory not committed, or the pre-built files are stale.
**Fix:** Run `npm run build` inside `_uidev/the_agency_website`, copy output to `_uidev/demo/agency_site/`, commit.

### Claude response leaking reasoning preamble into chat
**Cause:** Model returning chain-of-thought text before the actual response.
**Fix:** Strip everything before the first structured JSON block in `server/claude.ts`, or use a system prompt instruction to output JSON only.

---

## UI Navigation Rules (Production App)

- All users (agent and principal) land on the **channel picker dashboard** after login
- Clicking a channel card enters the chat view
- **`← Channels`** button appears in the topbar whenever the user is in a chat view — works for all roles
- Principal sees all deals; agent sees only their assigned deals
- Team/open channels (e.g. `#diana-dashboard`, `#team-general`) appear as a separate card on the dashboard

---

## Deploying a New Deal

1. Create `_database/deals/{id}-{buyer|seller}.json` with the required schema fields
2. Assign `deal.agent.agent_id` to match a user in `server/users.ts`
3. Commit and push to `main`
4. Railway redeploys automatically (or trigger manually)
5. The new channel appears immediately for the assigned agent on next login

---

## Adding a New Agent User

1. Add a `UserRecord` to `DEFAULT_USERS` in `server/users.ts`:
```typescript
{
  agent_id: "sofia",
  name: "Sofia Nguyen",
  slack_handle: "@sofia",
  role: "agent",
  pin: process.env.SOFIA_PIN?.trim() || "0000",
  assigned_channel: "#553-buyer",
  open_channel: "#team-general",
}
```
2. Create `_config/agent_profiles/sofia.yaml` and `sofia.md` (persona + system prompt)
3. Set `deal.agent.agent_id: "sofia"` in the relevant deal JSON files
4. Commit and push

---

## Checklist: First Successful Deploy

- [ ] `ANTHROPIC_API_KEY` set in Railway
- [ ] `AGENCY_SESSION_SECRET` set to a stable random string
- [ ] `STORAGE_MODE` set (`local` to start, `github` for persistence)
- [ ] If `github`: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` (read+write), `GITHUB_BRANCH` all set
- [ ] At least one deal JSON file committed with correct schema and `agent_id`
- [ ] Railway service root directory set to `_uidev/demo`
- [ ] Railway connected to `main` branch
- [ ] Agency website pre-built and `agency_site/` committed
- [ ] Login works with default PIN `0000`
- [ ] Channel picker shows deal channels after login
- [ ] Sending a message returns an AI response
- [ ] Chat log entry visible in deal JSON (GitHub mode) or local file (local mode)

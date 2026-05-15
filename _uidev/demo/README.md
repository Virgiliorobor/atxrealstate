# The Agency — Browser demo

Slack-style three-panel UI (Neo-Austin editorial look) backed by **real** agency markdown + optional writes to `_database/deals/*.json` and `_catalog/properties/*.md`.

**Developer guide:** [DEVELOPMENT.md](./DEVELOPMENT.md) — architecture, env vars, ports, API, bootstrap, deployment notes. Product addendum: [../DEMO_UI_UPDATE_SPEC.md](../DEMO_UI_UPDATE_SPEC.md) (onboarding, chips, ATX-016).
## Prereqs

- Node 20+
- [Anthropic API key](https://console.anthropic.com/)

## Setup

```bash
cd _uidev/demo
cp .env.example .env
# set ANTHROPIC_API_KEY=...
npm install
```

## Dev

Runs **`predev`** (`scripts/free-ports.mjs`) to clear **19877, 9777, 8787, 5173–5175** so old dev servers do not block ports. Then Vite serves the UI (usually **5173**) and proxies `/api` to **`http://127.0.0.1:19877`**. `dev:server` sets `PORT=19877` via `cross-env`. If you change the API port, update the `vite.config.ts` proxy `target` to match.

```bash
npm run dev
```

Open the Local URL Vite prints (often `http://localhost:5173`).

**Only run one `npm run dev` at a time.** Starting it again runs `predev`, which frees ports **5173** and **19877** and will stop an already-running dev session.

On first boot the API creates (if missing):

- `_database/deals/412-buyer.json` — from `_database/schema.json` with agent set to **Marco** (demo)
- `_database/deals/327-seller.json` — Hoffman seller fixture
- `_catalog/properties/ATX-016.md` — Chen / Bluebonnet contract property
- `_catalog/properties/ATX-003.md` — separate demo catalog listing

`AGENCY_ROOT` defaults to the repo root (parent of `_uidev`) when `cwd` is `_uidev/demo`.

## Production build (Node host)

Recommended: **Railway**, **Render**, or **Fly** — run Node with a persistent disk or bind-mounted repo so JSON/md writes survive.

```bash
npm run build
PORT=19877 npm start
```

Then open `http://127.0.0.1:19877` (Express serves `dist/client` + `/api`).

## Storage modes

- `STORAGE_MODE=local` (default): read/write files directly under `AGENCY_ROOT`.
- `STORAGE_MODE=github`: read/write via GitHub Contents API (no local fs persistence required). Set:
  - `GITHUB_OWNER`
  - `GITHUB_REPO`
  - `GITHUB_BRANCH` (default `main`)
  - `GITHUB_TOKEN`
  - optional `GITHUB_BASE_PATH`

When `STORAGE_MODE=github`, bootstrap write-seeding is skipped; make sure your target repo already contains the required agency files.

## Netlify + GitHub (production path)

This repo now supports a real Netlify deployment with persistent writes through GitHub API (no local filesystem dependency at runtime).

### How persistence works in Netlify mode

- `STORAGE_MODE=github`
- API routes run as Netlify Functions (`netlify/functions/*`)
- Read/write target:
  - `_database/deals/*.json` (deal memory, orchestrator logs/events)
  - `_catalog/properties/*.md` (listing record edits)
- Every write is committed to your GitHub repo via Contents API.

### 1) Push this project to GitHub

Create a GitHub repo and push `_uidev/demo` contents (without `.env`).

### 2) Create Netlify site

- Connect the GitHub repo
- Base directory: `_uidev/demo`
- Build command: `npm run build`
- Publish directory: `dist/client`

`netlify.toml` already configures:
- Functions dir: `netlify/functions`
- Redirect `/api/*` → `/.netlify/functions/:splat`

### 3) Set Netlify environment variables

Required:
- `ANTHROPIC_API_KEY`
- `STORAGE_MODE=github`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_TOKEN` (PAT with `contents:write`)

Recommended:
- `GITHUB_BRANCH=main`
- `GITHUB_BASE_PATH=` (only if agency files are in a subfolder)
- `ANTHROPIC_MODEL` (optional)
- `ANTHROPIC_MAX_TOKENS` (optional)

### 4) Verify after deploy

- `GET /api/health` should return `storageMode: "github"`
- Send `status #412-buyer`
- Confirm new memory appears in UI
- Check GitHub commit history for write commits from demo API calls

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Sanity + resolved `agencyRoot` + `storageMode` |
| POST | `/api/chat` | `{ message, channel }` → Claude JSON + optional `state_patch` merge into deal file |
| GET | `/api/deal?channel=%23412-buyer` | Raw deal JSON |
| GET | `/api/channel-memory?channel=%23412-buyer` | Timeline entries for workspace/history view |
| POST | `/api/apply-property` | `{ property_id, markdown }` — writes `_catalog/properties/{ID}.md` after UI confirm |

# The Agency — Demo app development guide

This document describes the **browser demo** living under `_uidev/demo/`: a Slack-shaped, Neo-Austin–styled chat UI backed by the **real agency folder** (markdown, YAML, JSON) and the **Anthropic API**.

For product intent and UX contract, see [`../DEMO_UI_SPEC.md`](../DEMO_UI_SPEC.md) and **[`../DEMO_UI_UPDATE_SPEC.md`](../DEMO_UI_UPDATE_SPEC.md)** (onboarding, channel subtitles, chips, ATX-016). Visual language matches **`_uidev/the_agency_website/`** tokens (see `the_agency_website/src/index.css`). Neo-Austin reference: [`../design_reference/neo_austin_editorial/DESIGN.md`](../design_reference/neo_austin_editorial/DESIGN.md).

---

## What this is

| Layer | Role |
|--------|------|
| **React + Vite** (`src/`) | Onboarding gate → three-panel Slack layout. Styling aligned with **`the_agency_website`** (clinical white, ink, teal, acid, neo-offset shadows). Per-channel welcomes, subtitles, and **chips** (click = send) per `DEMO_UI_UPDATE_SPEC.md`. |
| **Express API** (`server/`) | Loads context from the agency repo, calls Claude, optionally merges `state_patch` into deal JSON, serves built static files in production. |
| **Agency repo** (outside `_uidev/demo`) | Source of truth: `AI_README.md`, `00_orchestrator/`, specialists, `_config/`, `_database/deals/`, `_catalog/properties/`, etc. The demo **reads** these paths and **writes** only to allowlisted deal and property files. |

The demo is **not** the same as “agents working in Cursor”: it **simulates** the Slack-style loop for judges, using the same files as system context where possible.

---

## Repository layout

```
Realstateagency/                 ← AGENCY_ROOT (repo root)
├── AI_README.md
├── 00_orchestrator/
├── …
├── _database/
│   ├── schema.json
│   └── deals/                   ← created/updated by demo bootstrap + Orchestrator merge
│       ├── 412-buyer.json
│       └── 327-seller.json
├── _catalog/
│   └── properties/              ← ATX-016 (Chen home), ATX-003 (demo-only listing); + writes on confirm
└── _uidev/
    ├── DEMO_UI_SPEC.md
    ├── design_reference/
    └── demo/                    ← this app (package.json, src/, server/)
        ├── .env               ← gitignored; API key here
        ├── scripts/free-ports.mjs
        └── README.md          ← quick start
```

**Rule:** All **installable / buildable** demo code stays under `_uidev/demo/`. Do not move specialist folders into the demo tree.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | **Yes** (for chat) | Server-side only; never exposed to the browser. |
| `AGENCY_ROOT` | No | Local filesystem mode only. Absolute path to repo root containing `AI_README.md`. If empty, inferred when `cwd` is `_uidev/demo` as **two levels up** (`…/Realstateagency`). |
| `PORT` | No | API listen port. **`npm run dev`** sets **19877** via `cross-env` in `dev:server`. **`npm start`** defaults to **19877** if unset. |
| `ANTHROPIC_MODEL` | No | Override model id (default in code matches the spec’s Sonnet id). |
| `ANTHROPIC_MAX_TOKENS` | No | Max output tokens for Anthropic calls (default currently `8192`). |
| `ANTHROPIC_MAX_TOOL_ITERATIONS` | No | Cap on tool-use rounds per chat turn (default `25`). Raise if Claude legitimately needs to read more files; lower if you want stricter budget control. |
| `STORAGE_MODE` | No | `local` or `github`. For Netlify production use `github`. |
| `GITHUB_OWNER` | Required if `STORAGE_MODE=github` | GitHub owner/org containing the repo. |
| `GITHUB_REPO` | Required if `STORAGE_MODE=github` | Repository name (e.g. `atxrealstate`). |
| `GITHUB_BRANCH` | No | Target branch for reads/writes (default `main`). |
| `GITHUB_TOKEN` | Required if `STORAGE_MODE=github` | GitHub PAT with repo contents write permission. **Secret.** |
| `GITHUB_BASE_PATH` | No | Optional subdirectory root for agency files inside the repo. |
| `VITE_AGENCY_WEBSITE_URL` | No | Link target shown in demo UI (default `/the_agency_website/`). |

Copy `.env.example` → `.env` and fill at least `ANTHROPIC_API_KEY`.

---

## Scripts and ports

| Script | Behavior |
|--------|----------|
| `npm run dev` | Runs **`predev`** then **`concurrently`**: API (`tsx watch server/index.ts`) + Vite. |
| `predev` | `node scripts/free-ports.mjs` — frees **19877, 9777, 8787, 5173–5175** so stuck Node processes do not block a fresh dev session. |
| `npm run build` | Builds demo app + installs/builds `_uidev/the_agency_website` + copies website output into `dist/client/the_agency_website`. |
| `npm run build:demo` | Builds demo API and client (`dist/server`, `dist/client`). |
| `npm run build:agency-website` | Builds `_uidev/the_agency_website` with `--base=/the_agency_website/` for subpath hosting. |
| `npm run sync:agency-website` | Copies `_uidev/the_agency_website/dist` into demo publish folder. |
| `npm start` | Node serves `dist/client` + `/api` on `PORT` (default **19877**). |

**Vite dev:** UI is usually **`http://localhost:5173`**. `/api/*` is **proxied** to **`http://127.0.0.1:19877`** (`vite.config.ts` must match `dev:server`’s `PORT`).

**Important:** Run **only one** `npm run dev` at a time. A second run’s `predev` will kill the first session’s ports.

**Editing `.env` while dev is running:** Vite watches `.env` and may restart; on Windows the watcher sometimes exits non-zero and `concurrently -k` stops the API. Prefer stopping dev (Ctrl+C), editing `.env`, then `npm run dev` again.

---

## Bootstrap (first API start)

On server startup, `server/bootstrap.ts` ensures:

1. **`_database/deals/`** exists.  
2. **`412-buyer.json`** — if missing, copied from `_database/schema.json` with `deal.agent` set to **Marco** (demo persona).  
3. **`327-seller.json`** — if missing, copied from `server/fixtures/327-seller.json` (Hoffman seller narrative).  
4. **`_catalog/properties/ATX-016.md`** — if missing, seeded as the Chen / Bluebonnet contract property.
5. **`_catalog/properties/ATX-003.md`** — if missing, seeded as a separate demo-only listing (not the Chen home).

This keeps the demo functional without hand-seeding files, while matching the structure described in `_database/README.md` and `_catalog/schema.md`.

---

## API surface (dev / prod)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | `{ ok, agencyRoot, storageMode }` sanity check. |
| `POST` | `/api/chat` | Body: `{ "message": string, "channel": string }`. Builds system context from `AGENCY_ROOT`, calls Claude, returns JSON (`chat_response`, `activity_log`, optional `ui_blocks`, `state_patch`, etc.). If the channel maps to a deal file, applies **`state_patch`** via `server/memoryStore.ts`. |
| `GET` | `/api/deal?channel=%23412-buyer` | Raw deal JSON for debugging. |
| `GET` | `/api/channel-memory?channel=%23412-buyer` | Synthesized persisted timeline (`events`, `communications`, `risk_flags`, `deadlines`) for the “Workspace feed” view. |
| `POST` | `/api/apply-property` | Body: `{ "property_id": "ATX-003", "markdown": "…" }`. Writes `_catalog/properties/{ID}.md` after UI “Confirm · write catalog” (Diana gate simulated in UI). |

Channel → deal file mapping: `#412-buyer` → `412-buyer.json`, `#327-seller` → `327-seller.json` (`server/paths.ts` — `safeDealFilename`). **`#open-entry`** has no deal file: principal sandbox; context loads **Diana**’s profile instead of Marco’s (`server/context.ts`).

---

## Claude integration — agentic tool-use loop

The demo is **agentic**: Claude is **not** spoon-fed a giant pre-loaded system prompt. Instead, the server gives Claude **file-system tools** and lets it navigate the agency repo itself — exactly like a Claude Projects session or a Cursor agent. The folder IS the system; Claude reads `AI_README.md` first and follows its instructions to the relevant orchestrator / specialist / SOP / deal / property files.

**Pieces:**

| File | Role |
|------|------|
| `server/tools.ts` | Defines three tools sent to Claude: `read_file(path)`, `list_directory(path)`, `search_files(pattern, path?, glob?)`. Has **two backends** selected by `STORAGE_MODE`: local filesystem (sandboxed to `AGENCY_ROOT`) for `npm run dev`, and the GitHub Contents API (same auth as `memoryStore.ts`) for the Netlify deployment. Writes are intentionally **not** exposed as tools. |
| `server/context.ts` | Tiny per-turn bootstrap — only channel, active deal file pointer, and session persona (Marco vs Diana). No file content is pre-loaded. |
| `server/claude.ts` | Runs the tool-use loop: send messages with `tools`, when `stop_reason === "tool_use"` execute the calls and feed `tool_result` blocks back, repeat until `end_turn` (or `ANTHROPIC_MAX_TOOL_ITERATIONS`). |

**Per-turn flow (typical):**

```
User: "brief ATX-016 for the Chen buyer"
  ↓
read_file("AI_README.md")
read_file("00_orchestrator/identity.md")
read_file("00_orchestrator/rules.md")
read_file("00_orchestrator/handoff.md")
read_file("00_orchestrator/examples.md")
read_file("02_property_research/identity.md")
read_file("02_property_research/rules.md")
read_file("02_property_research/examples.md")
read_file("_catalog/properties/ATX-016.md")
read_file("_database/deals/412-buyer.json")
  ↓
final assistant turn = JSON envelope (chat_response, activity_log, ui_blocks, state_patch, …)
```

**Activity log:** the server prepends every real tool call (file read / dir list / search) to whatever narrative log Claude returns, so the UI's right-hand "Activity" panel reflects actual file operations. `_meta.tool_iterations` and `_meta.tool_calls` are also returned for debugging.

**Final JSON envelope:** Claude's **last** turn (after `stop_reason: "end_turn"`) must be a single JSON object — same schema as before (`chat_response`, `activity_log`, `specialist_activated`, `sop_active`, `sop_step`, `deal_stage`, optional `ui_blocks`, optional `state_patch`). The bootstrap instruction in `server/claude.ts` documents this contract for Claude.

**`state_patch`:** still optional `{ append_events?, meta_updates? }` — merged into the deal JSON only for deal channels. This is the **only** write path from Claude; the tools layer is intentionally read-only.

**Property markdown writes:** still gated by `/api/apply-property` after a UI "Confirm" on a `listing_preview` ui_block.

**Tradeoffs you should know:**

- A chat turn now makes **multiple** Claude API calls (typically 5–12, capped at 25). Latency per user message is ~5–25s depending on how many files Claude needs to read.
- Per-call context is much smaller (no giant prompt), so total tokens are often **similar or lower** than the previous pre-load design.
- If you see "stopped after N tool iterations without a final response" in `chat_response`, raise `ANTHROPIC_MAX_TOOL_ITERATIONS`.

---

## Styling note

The **DEMO_UI_SPEC** originally described a dark Slack-like theme. This implementation follows **Neo-Austin Editorial** for colors, typography, and zero-radius / outline-heavy UI while keeping **Slack-like information architecture** (three columns, channels, bubbles, activity feed).

---

## Deployment

- **Netlify + GitHub (current production path):**
  - Root `netlify.toml` sets:
    - `base = "_uidev/demo"`
    - `command = "npm run build"`
    - `publish = "dist/client"`
    - `functions = "netlify/functions"`
  - Redirects:
    - `/api/*` → `/.netlify/functions/:splat`
    - `/the_agency_website/*` → `/the_agency_website/index.html`
  - **All file access** goes through the GitHub Contents API when `STORAGE_MODE=github`:
    - `server/tools.ts` reads instructions, specialists, SOPs, deal JSON, property catalog — via the live repo at request time (file content + recursive tree are cached for the lifetime of the warm Lambda container, keyed by branch).
    - `server/memoryStore.ts` handles deal `state_patch` merges and property markdown writes through the same API.
  - `AGENCY_ROOT` is not needed in this mode.
  - Required env vars in the Netlify site config: `ANTHROPIC_API_KEY`, `STORAGE_MODE=github`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` (PAT with repo contents read+write), optionally `GITHUB_BRANCH` and `GITHUB_BASE_PATH`.

- **Node host + local filesystem (dev/self-host path):**
  - Run `npm run build && npm start` on a machine with full repo checkout.
  - Use `STORAGE_MODE=local`.
  - Set `AGENCY_ROOT` if app is not started from `_uidev/demo`.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `EADDRINUSE` on 19877 / 5173 | Another process (or a second `npm run dev`) holds the port. Stop duplicates or run `node scripts/free-ports.mjs` once, then `npm run dev`. |
| Chat send fails | Missing or invalid `ANTHROPIC_API_KEY`, quota, or model id. Check the **terminal running the API** (not only the browser). |
| Empty / wrong context | Wrong `AGENCY_ROOT` or server not started from `_uidev/demo` (auto root wrong). Set `AGENCY_ROOT` explicitly to the repo root. |
| Vite works, `/api` 502 / network error | API not on **19877** or proxy `target` in `vite.config.ts` does not match `PORT`. |
| `brief ATX-003` vs Chen home | Per **DEMO_UI_UPDATE_SPEC**, Chen’s home is **ATX-016**. Delete `_database/deals/412-buyer.json` once if it was bootstrapped before ATX-016 (it will be recreated from `schema.json` with `ATX-003` → `ATX-016` substitution), or edit JSON manually. Ensure `_catalog/properties/ATX-016.md` exists (run the server bootstrap). |
| Netlify shows 404 “Page not found” at site root | Netlify is building from wrong directory. Ensure root `netlify.toml` is present and deployment uses `base = "_uidev/demo"` and `publish = "dist/client"`. |
| Netlify `build.command` exit code 2 | Website sibling app dependencies missing during CI. `npm run build` now includes `install:agency-website`; redeploy on latest commit. |
| `/the_agency_website/` is blank | Subpath mismatch. Website must be built with `--base=/the_agency_website/` and router basename from `import.meta.env.BASE_URL` (already wired). |
| Listings show no photos | Source image files are not in repo at referenced paths (`/Images/properties/...`). UI now shows placeholders instead of broken media. Add real files under website public assets to restore photos. |

---

## Related files (quick index)

| File | Purpose |
|------|---------|
| `server/index.ts` | Express routes, static production fallback. |
| `server/bootstrap.ts` | Deal / property file bootstrap. |
| `server/context.ts` | Tiny per-turn bootstrap (channel, deal pointer, persona). No file pre-loading — Claude reads via tools. |
| `server/tools.ts` | Agentic file-system tools (`read_file`, `list_directory`, `search_files`) exposed to Claude, sandboxed to `AGENCY_ROOT`. |
| `server/claude.ts` | Anthropic tool-use loop + final JSON envelope parse. |
| `server/memoryStore.ts` | Centralized read/write service for deals/properties, channel-memory timeline builder, and `state_patch` merge logic. |
| `server/paths.ts` | `AGENCY_ROOT`, path safety helpers. |
| `scripts/sync-agency-website.mjs` | Copies website build output into demo publish folder. |
| `src/App.tsx` | Layout, chat, activity log, listing confirm. |
| `src/App.css` + `src/index.css` | Neo-Austin layout tokens. |
| `../the_agency_website/src/main.tsx` | Router basename for subpath deployment (`/the_agency_website/`). |
| `../the_agency_website/src/lib/media.ts` | Image URL normalization + placeholder fallback for missing media. |
| `../../netlify.toml` | Root Netlify build/publish config used in production deployment. |

---

*Document version: 1.3 — agentic tool-use loop with dual-backend tools (local filesystem for dev, GitHub Contents API for the Netlify deployment). Claude now reads the live repo at request time in production.*

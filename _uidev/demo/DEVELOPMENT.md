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
| `AGENCY_ROOT` | No | Absolute path to repo root containing `AI_README.md`. If empty, inferred when `cwd` is `_uidev/demo` as **two levels up** (`…/Realstateagency`). |
| `PORT` | No | API listen port. **`npm run dev`** sets **19877** via `cross-env` in `dev:server`. **`npm start`** defaults to **19877** if unset. |
| `ANTHROPIC_MODEL` | No | Override model id (default in code matches the spec’s Sonnet id). |

Copy `.env.example` → `.env` and fill at least `ANTHROPIC_API_KEY`.

---

## Scripts and ports

| Script | Behavior |
|--------|----------|
| `npm run dev` | Runs **`predev`** then **`concurrently`**: API (`tsx watch server/index.ts`) + Vite. |
| `predev` | `node scripts/free-ports.mjs` — frees **19877, 9777, 8787, 5173–5175** so stuck Node processes do not block a fresh dev session. |
| `npm run build` | `tsc` for `server/` → `dist/server/`, Vite build → `dist/client/`. |
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
4. **`_catalog/properties/ATX-003.md`** — if missing, a minimal property stub for the Chen / Bluebonnet story.

This keeps the demo functional without hand-seeding files, while matching the structure described in `_database/README.md` and `_catalog/schema.md`.

---

## API surface (dev / prod)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | `{ ok, agencyRoot }` sanity check. |
| `POST` | `/api/chat` | Body: `{ "message": string, "channel": string }`. Builds system context from `AGENCY_ROOT`, calls Claude, returns JSON (`chat_response`, `activity_log`, optional `ui_blocks`, `state_patch`, etc.). If the channel maps to a deal file, applies **`state_patch`** via `server/memoryStore.ts`. |
| `GET` | `/api/deal?channel=%23412-buyer` | Raw deal JSON for debugging. |
| `GET` | `/api/channel-memory?channel=%23412-buyer` | Synthesized persisted timeline (`events`, `communications`, `risk_flags`, `deadlines`) for the “Workspace feed” view. |
| `POST` | `/api/apply-property` | Body: `{ "property_id": "ATX-003", "markdown": "…" }`. Writes `_catalog/properties/{ID}.md` after UI “Confirm · write catalog” (Diana gate simulated in UI). |

Channel → deal file mapping: `#412-buyer` → `412-buyer.json`, `#327-seller` → `327-seller.json` (`server/paths.ts` — `safeDealFilename`). **`#open-entry`** has no deal file: principal sandbox; context loads **Diana**’s profile instead of Marco’s (`server/context.ts`).

---

## Claude integration

- **System prompt** concatenates folder context (`server/context.ts`): orchestrator pack, `slack_commands`, Marco profile, specialist identity/rules (truncated when very large), and the **active deal JSON** when applicable.  
- **User message** is prefixed with `[Channel: …]`.  
- **Response** is expected to be **JSON** (see `server/claude.ts` — `JSON_INSTRUCTION` + parser). If parsing fails, raw text is shown and the activity log notes it.  
- **`state_patch`**: optional `{ append_events?, meta_updates? }` merged into the deal file only for deal channels; paths are validated (no arbitrary file access).

---

## Styling note

The **DEMO_UI_SPEC** originally described a dark Slack-like theme. This implementation follows **Neo-Austin Editorial** for colors, typography, and zero-radius / outline-heavy UI while keeping **Slack-like information architecture** (three columns, channels, bubbles, activity feed).

---

## Deployment (short)

- **Recommended for “real files on disk”:** run the **Node** app (`npm run build` + `npm start`) on a host with the **full repo** checked out (Railway, Render, Fly, VPS). Set `AGENCY_ROOT` if the working directory is not the repo root.  
- **Netlify / GitHub Pages alone:** static hosting cannot hold secrets or a writable clone of your repo. You would add **Netlify Functions** (or another backend) and persist changes via **GitHub API**, a database, or object storage — out of scope for this first iteration; see `README.md` for a pointer.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `EADDRINUSE` on 19877 / 5173 | Another process (or a second `npm run dev`) holds the port. Stop duplicates or run `node scripts/free-ports.mjs` once, then `npm run dev`. |
| Chat send fails | Missing or invalid `ANTHROPIC_API_KEY`, quota, or model id. Check the **terminal running the API** (not only the browser). |
| Empty / wrong context | Wrong `AGENCY_ROOT` or server not started from `_uidev/demo` (auto root wrong). Set `AGENCY_ROOT` explicitly to the repo root. |
| Vite works, `/api` 502 / network error | API not on **19877** or proxy `target` in `vite.config.ts` does not match `PORT`. |
| `brief ATX-003` vs Chen home | Per **DEMO_UI_UPDATE_SPEC**, Chen’s home is **ATX-016**. Delete `_database/deals/412-buyer.json` once if it was bootstrapped before ATX-016 (it will be recreated from `schema.json` with `ATX-003` → `ATX-016` substitution), or edit JSON manually. Ensure `_catalog/properties/ATX-016.md` exists (run the server bootstrap). |

---

## Related files (quick index)

| File | Purpose |
|------|---------|
| `server/index.ts` | Express routes, static production fallback. |
| `server/bootstrap.ts` | Deal / property file bootstrap. |
| `server/context.ts` | Agency markdown/YAML → system context string. |
| `server/claude.ts` | Anthropic call + JSON parse. |
| `server/memoryStore.ts` | Centralized read/write service for deals/properties, channel-memory timeline builder, and `state_patch` merge logic. |
| `server/paths.ts` | `AGENCY_ROOT`, path safety helpers. |
| `src/App.tsx` | Layout, chat, activity log, listing confirm. |
| `src/App.css` + `src/index.css` | Neo-Austin layout tokens. |

---

*Document version: 1.0 — matches demo package as of first iteration.*

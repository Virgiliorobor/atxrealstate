# THE AGENCY — Demo UI Specification
> For: Cursor / Claude Code development
> Purpose: Live interactive demo for competition submission
> Stack: React + Claude API (claude-sonnet-4-20250514)

---

## HOW THIS SYSTEM IS INTENDED TO WORK IN PRODUCTION

**This is critical context before building anything.**

In real deployment, Diana's team uses this system through one of these setups:
- **Claude Projects** — the entire `agency-system/` folder is uploaded as project knowledge. Agents chat directly in the Claude interface. The AI reads the folder files as its context.
- **Claude Desktop + Cowork** — folder is open as a workspace. Same principle.
- **VS Code + Claude extension** — folder open in editor, Claude chat sidebar active.

In all cases: the agent types in a chat interface → Claude reads the system files as context → Claude responds as the Orchestrator → routes to the right specialist → returns the output.

**The folder files ARE the system.** They are not documentation. They are the instructions the AI reads on every interaction to know who it is, what rules it follows, what specialists exist, and how to route.

**The demo UI simulates this exact workflow** — but in a browser, styled to feel like Slack, so judges can experience it without needing Claude Projects or any local setup. Every message in the demo triggers a real Claude API call with the system files loaded as context. The AI reads those files and responds accordingly. This is not a chatbot with hardcoded responses. It is the actual system running live.

---

## WHAT THIS IS

A browser-based live chat interface that simulates the Slack-based AI operating system for a boutique real estate agency. Judges type real messages and receive real AI responses powered by the Claude API. The system loads the actual folder structure as context.

This is not a scripted walkthrough. It is a live system.

---

## THREE PANELS

```
LEFT SIDEBAR        CENTER CHAT          RIGHT ACTIVITY LOG
────────────        ───────────          ──────────────────
Channel list        Slack-style chat     Real-time system feed
Agent profile       Message input        Specialist activated
                    Bot responses        SOP step running
                                         Database event logged
                                         Deal stage current
```

---

## LEFT SIDEBAR

- Agency logo / firm name at top
- Channel list:
  - `#team-general` (default on load)
  - `#412-buyer` (Chen deal — pre-loaded, active)
  - `#327-seller` (Hoffman listing — active)
- Active agent display: "Marco Reyes · Guided Mode"
- Clicking a channel switches the chat view

---

## CENTER CHAT

- Slack-style message bubbles
- Agent messages: right-aligned, agent name + avatar initial
- Bot responses: left-aligned, specialist name as sender with emoji prefix:
  - 🎯 Orchestrator
  - 👤 Lead Qualifier
  - 🔍 Property Research
  - ✉️ Client Communication
  - 📋 Transaction Coordinator
  - 🏠 Listing Manager
- Message input bar at bottom with send button
- Supports slash-style commands: `brief ATX-003`, `status #412-buyer`
- On first load in `#team-general`: bot posts welcome/tutorial message automatically

**Welcome message on load:**
```
👋 Welcome to The Agency demo.
You are Marco Reyes (guided mode — system explains as it works).

Try these:
  new buyer          → start a lead intake
  brief ATX-003      → property snapshot
  status #412-buyer  → live deal status
  help               → full command list

#412-buyer is the Chen deal — already active at due_diligence stage.
Switch channels to see it in progress.
```

---

## RIGHT ACTIVITY LOG

Live feed updated with every interaction. Each entry shows:

```
[timestamp] [icon] [label]
─────────────────────────────────────────
14:22:01  🎯  Orchestrator received message
14:22:01  👤  @marco identified · guided mode loaded
14:22:02  🔍  Routing → Property Research
14:22:02  📂  Loading: travis_heights.md
14:22:03  🔍  Property Research processing...
14:22:04  ✅  Brief generated · returning to Orchestrator
14:22:04  💬  Relaying to #412-buyer
14:22:04  🗄️  EVT-011 logged · research_brief_generated
```

Color coding:
- Blue: Orchestrator actions
- Purple: Specialist activations
- Green: Completions and outputs
- Orange: Database events
- Red: Risk flags or alerts

---

## CLAUDE API INTEGRATION

Every message sent by the judge triggers a real Claude API call.

**How the files load — this is the core mechanic:**

On every API call the server reads the actual markdown files from the `agency-system/` folder and concatenates them into the system prompt. The AI is not pre-trained on this content — it reads the files fresh on every call, exactly as it would in Claude Projects.

```javascript
// Load system files at runtime
const systemBriefing = fs.readFileSync('agency-system/AI_README.md', 'utf8')
const orchestratorIdentity = fs.readFileSync('agency-system/00_orchestrator/identity.md', 'utf8')
const orchestratorRules = fs.readFileSync('agency-system/00_orchestrator/rules.md', 'utf8')
const orchestratorHandoff = fs.readFileSync('agency-system/00_orchestrator/handoff.md', 'utf8')

// Load the relevant specialist files based on context
// (lead qualifier, property research, etc. loaded dynamically)

// Load deal state
const dealRecord = fs.readFileSync('agency-system/_database/schema.json', 'utf8')

// Load agent profile
const agentProfile = fs.readFileSync('agency-system/_config/agent_profiles/marco.yaml', 'utf8')
```

**System prompt structure on every call:**
```
[AI_README.md — system briefing]
[00_orchestrator/identity.md]
[00_orchestrator/rules.md]
[00_orchestrator/handoff.md]
[relevant specialist files — loaded based on channel/context]
[_config/agent_profiles/marco.yaml + marco.md]
[_config/slack_commands.md]
[_database/schema.json — current deal state]
[current channel context]
```

**The API call returns two things:**
1. The chat response (displayed in center panel)
2. A structured activity log array (displayed in right panel)

**Prompt the model to return JSON:**
```json
{
  "chat_response": "The specialist response text...",
  "activity_log": [
    { "time": "14:22:01", "icon": "🎯", "label": "Orchestrator received message" },
    { "time": "14:22:02", "icon": "🔍", "label": "Routing → Property Research" }
  ],
  "specialist_activated": "02_property_research",
  "sop_active": null,
  "sop_step": null,
  "deal_stage": "due_diligence"
}
```

---

## PRE-LOADED STATE

The demo opens with real data already in place:

**`#412-buyer` — Chen Deal**
- Buyers: Robert & Maria Chen
- Stage: due_diligence
- Agent: Marco (guided mode)
- Active risk flags: appraisal gap $23k, inspection deadline
- 2 documents pending

**`#327-seller` — Hoffman Listing**
- Sellers: Patricia & James Hoffman
- Stage: active
- Agent: Carlos
- DOM: 28 days, no offer yet

This gives judges something to interact with immediately rather than starting from scratch.

---

## KEY COMMANDS TO DEMONSTRATE

These should all produce real AI responses:

```
help                          → command menu
new buyer                     → lead intake flow
brief ATX-003                 → property snapshot
status #412-buyer             → full deal status with deadlines
draft competing_offer #412    → client communication draft
deadlines #412-buyer          → deadline tracker
neighborhood travis_heights   → neighborhood brief
```

---

## DESIGN FEEL

> **Updated (v1.1):** Implement the demo together with **[DEMO_UI_UPDATE_SPEC.md](./DEMO_UI_UPDATE_SPEC.md)** and the **`_uidev/the_agency_website/`** Neo-Austin tokens (clinical white canvas, deep ink, teal + acid accents, sharp geometry, mono activity feed). Keep a **Slack-like information architecture** (three panels, channels), not Slack’s dark chrome. The bullets below are the original v1.0 mood board.

- Dark theme — Slack-inspired but not a copy *(superseded for demo chrome — use light Neo-Austin + Slack layout)*
- Clean, minimal — boutique firm aesthetic
- Monospace font for activity log (terminal feel)
- Serif or clean sans for chat (professional feel)
- Not playful — this is a professional operations tool

---

## WHAT THIS IS NOT

- Not a full Slack clone
- Not a real database — state can be in-memory for the demo
- Not multi-user — one agent session at a time
- Not production-ready auth — no login required for demo

---

## SUCCESS CRITERIA

A judge opens the URL, types `status #412-buyer`, and within 3 seconds sees:
1. A real AI-generated deal status in the chat panel
2. The activity log showing which specialists activated
3. The database event being logged
4. The current SOP step if one is running

That is the demo working.

---

*Spec Version: 1.0*
*Competition deadline: Sunday May 17, 2026 · 12pm EST*
*Claude model: claude-sonnet-4-20250514*

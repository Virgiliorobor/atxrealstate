# THE AGENCY
### AI Operating System for Diana Castellano Real Estate
#### Austin, TX — Boutique Residential Real Estate

---

> "If I hire a fifth agent in three months, I should be able to hand them this system and they should be operational in a day. That's the test."
> — Diana Castellano, Principal

This system passes that test.

---

## WHAT THIS IS

The Agency is an AI operating system for a boutique real estate team. It is not a CRM. It is not a platform. It is not another piece of software for Diana's team to maintain.

It is a set of AI specialists organized into folders, connected by explicit handoff protocols, operating through a chat-first interface. The agents talk to it the same way they talk to each other — in Slack. The system listens, extracts, structures, tracks, drafts, alerts, and generates. The agents stay in control of every decision and every client interaction.

**The core principle:** The system populates itself through conversation. Agents never perform data entry as a separate task. They communicate naturally. The AI does the rest.

---

## THE TEAM THIS SERVES

| Agent | Role | Specialty | System Mode |
|---|---|---|---|
| Diana Castellano | Principal | Both sides, full market | Operational — full dashboard access |
| Elena Reyes | Senior Agent | Buyer specialist | Operational |
| Carlos Mendoza | Senior Agent | Seller specialist | Operational |
| Marco Reyes | Junior Agent | Both sides, ramping | Guided — system explains as it works |
| Sara Kim | New Agent | Day 1 | Guided — review required on all client outputs |

**Guided mode** is the onboarding program. A new agent gets a Slack handle, a profile set to guided, and the system walks them through every deal in real time. That is how Sara becomes operational in a day.

---

## THE FIVE SPECIALISTS

```
00_orchestrator/          The air traffic controller
                          Reads every message, identifies the agent, loads their profile,
                          routes to the correct specialist, receives output, relays to agent.
                          The only writer to the database. Never processes domain content.

01_lead_qualifier/        First contact
                          Captures buyer and seller leads from natural Slack conversation.
                          Extracts structured data, flags missing fields, presents confirmation
                          gate. Creates the deal record everything else builds on.

02_property_research/     Market intelligence
                          Reads verified neighborhood files and catalog property records.
                          Generates neighborhood briefs, CMAs, property snapshots, and
                          appraisal support. Never pulls live web data — consistency matters.

03_client_communication/  The voice
                          Drafts every client-facing message in the assigned agent's voice.
                          Loaded with the agent's tone, phrases, sign-off, and avoid list.
                          Never sends. Always presents for agent review.

04_transaction_coordinator/ The operational backbone
                          Tracks every deadline across every active deal simultaneously.
                          Alerts at 48hr and 24hr. Generates all 11 transaction documents
                          from templates. Flags risk before it becomes a problem.
                          Solves the 11pm Slack problem.

05_listing_manager/       Catalog custodian and website engine
                          The only specialist that writes to the property catalog.
                          Processes photo uploads, generates listing pages, manages
                          publication queue. Diana approves before anything goes live.
```

---

## HOW A TYPICAL DEAL FLOWS

### New Buyer Lead

```
Elena texts in Slack:
"new buyers — Robert and Maria Chen, relocating from Chicago,
Travis Heights or South Congress, budget 450 to 650,
pre-approved at 625 through First Republic, 60 days"

→ Orchestrator identifies Elena, loads her profile
→ Routes to Lead Qualifier
→ Lead Qualifier extracts all data, flags: email and phone missing
→ Confirmation screen sent to Elena
→ Elena confirms with additions
→ Deal #412-buyer created, Slack channel #412-buyer opened
→ Property Research auto-triggered → Travis Heights brief generated
→ Client Communicator suggests welcome email draft
→ Elena reviews draft, sends to Chens
→ Database event log: 4 events recorded
```

### Offer Accepted → Under Contract

```
Elena: "offer accepted!! $612k, closing May 28 #412-buyer"

→ Orchestrator detects stage transition
→ TC activates — sends offer terms form link to Elena
→ Elena completes form (3 minutes)
→ TC sets all 7 deadlines from contract terms
→ Deadline tracker live
→ Earnest money alert: 48hrs
→ Offer accepted email drafted in Elena's voice
→ Elena reviews, sends to Chens
→ Dashboard updates: deal #412-buyer now under contract
→ Database: stage_history updated, 3 events logged
```

### The 11pm Slack Problem — Solved

```
Marco (11pm): "what happens with the roof thing #412-buyer"

→ Orchestrator loads deal record
→ TC returns full status:
   — Inspection deadline TOMORROW 5pm
   — Seller offered $8k credit
   — Draft inspection response ready
   — Draft client options message ready
   — Step-by-step: what to do, what happens if deadline passes
→ Marco has everything he needs
→ He never texts Diana
→ Database: event logged
```

---

## THE SYSTEM ARCHITECTURE

```
INTERACTION LAYER          INTELLIGENCE LAYER         DATA LAYER
──────────────────         ──────────────────         ──────────
Slack / Chat UI      →     00 Orchestrator      →     _database/
  Agent types               ↓ routes                  deals/412-buyer.json
  natural language          ↓                         One file per deal
                       01 Lead Qualifier              Full history, all fields
Dashboard            →     02 Property Research       Event log append-only
  Diana monitors           03 Client Comm             
  Approves website    →     04 TC                →    _catalog/
  Manages profiles         05 Listing Manager         properties/
                                ↓                     neighborhoods/
Listing Website      ←     All outputs                deal_states.md
  Editorial, curated        confirmed by agent    
  Auto-generated            before delivery      →    _config/
  from catalog                                        agent_profiles/
                                                       brand_standards.md
```

---

## THE FOLDER STRUCTURE

```
agency-system/
│
├── README.md                              ← You are here
│
├── 00_orchestrator/                       ← Router, state keeper, SOP executor
│   ├── identity.md
│   ├── rules.md
│   ├── examples.md
│   └── handoff.md
│
├── 01_lead_qualifier/                     ← Lead capture and deal creation
│   ├── identity.md
│   ├── rules.md
│   ├── examples.md
│   └── handoff.md
│
├── 02_property_research/                  ← Market intelligence
│   ├── identity.md
│   ├── rules.md
│   ├── examples.md
│   └── handoff.md
│
├── 03_client_communication/               ← Agent voice and drafting
│   ├── identity.md
│   ├── rules.md
│   ├── examples.md
│   └── handoff.md
│
├── 04_transaction_coordinator/            ← Deadlines, documents, risk
│   ├── identity.md
│   ├── rules.md
│   ├── examples.md
│   ├── handoff.md
│   └── templates/
│       ├── _legaldocs/                    ← 11 firm-generated document templates
│       │   ├── agency_disclosure.md
│       │   ├── exclusive_right_to_sell.md
│       │   ├── wire_fraud_advisory.md
│       │   ├── cma_report.md
│       │   ├── seller_disclosure.md
│       │   ├── lead_based_paint_disclosure.md
│       │   ├── purchase_agreement.md
│       │   ├── counter_offer.md
│       │   ├── inspection_response.md
│       │   ├── contingency_removal.md
│       │   └── final_walkthrough_attestation.md
│       └── _checklists/                   ← 4 transaction checklists
│           ├── buyer_checklist.md
│           ├── seller_checklist.md
│           ├── closing_checklist.md
│           └── deadline_tracker.md
│
├── 05_listing_manager/                    ← Catalog custodian and website engine
│   ├── identity.md
│   ├── rules.md
│   ├── examples.md
│   ├── handoff.md
│   └── templates/
│       ├── listing_input_sheet.md         ← MLS data entry document
│       └── listing_page_template.md       ← Website listing page template
│
├── _catalog/                              ← Verified market data
│   ├── deal_states.md                     ← Stage definitions and transitions
│   ├── document_registry.md              ← All 27 transaction documents
│   ├── schema.md                          ← Property and deal record schemas
│   └── neighborhoods/
│       ├── general_austin_market.md
│       ├── travis_heights.md
│       ├── east_austin.md
│       ├── barton_hills.md
│       └── north_austin.md
│
├── _config/                               ← System configuration
│   ├── brand_standards.md                 ← Voice, document, website standards
│   ├── slack_commands.md                  ← Full command directory
│   ├── system_settings.yaml              ← Global system configuration
│   └── agent_profiles/
│       ├── diana.yaml + diana.md
│       ├── elena.yaml + elena.md
│       ├── carlos.yaml + carlos.md
│       ├── marco.yaml + marco.md
│       └── sara.yaml + sara.md
│
├── _database/                             ← Operational memory engine
│   ├── README.md                          ← How the database works
│   ├── schema.json                        ← Master deal record template (Chen deal)
│   └── deals/                             ← One JSON per active deal
│
└── _sops/                                 ← Standard operating procedures
    ├── README.md                          ← How SOPs work with the Orchestrator
    ├── sop_01_new_lead.md
    ├── sop_02_follow_up.md
    ├── sop_03_offer_received.md
    ├── sop_04_weekly_digest.md
    └── sop_05_listing_live.md
```

---

## THE HANDOFF PROTOCOL

Every specialist receives a structured context package and returns a structured output. Nothing passes between specialists as free text.

**The data contract at every handoff:**

```
Orchestrator → Any Specialist:
  - Full deal record
  - Agent profile (pre-loaded from Slack handle mapping)
  - Property record (if property-specific)
  - Detected intent and routing reason
  - Timestamp

Any Specialist → Orchestrator:
  - Status (success / flagged / needs_data)
  - Output content
  - Suggested next action
  - Agent message (what to relay via Slack)
  - Any flags or risk items
```

The orchestrator is the only node that talks to every other node. Specialists never communicate directly — all routing goes through the orchestrator. This keeps the system auditable, debuggable, and extensible.

---

## THE DATABASE ENGINE

Every action — by every agent, by every AI specialist — is recorded in `_database/deals/[deal_id]-[side].json`.

The Orchestrator is the only writer. It appends one event after every interaction:

```json
{
  "event_id": "EVT-007",
  "timestamp": "2026-05-14T17:30:00",
  "actor_type": "human",
  "actor_id": "elena",
  "action": "offer_accepted_reported",
  "detail": "Offer accepted at $612,000.",
  "outcome": "success",
  "next_triggered": "tc_deadline_tracker_activated"
}
```

This is the CRM function without the CRM overhead. Agents never log anything — they just work in Slack and the system records everything behind the scenes.

Each deal file contains the full history: deal record, all parties, all deadlines, all documents, all communications, all risk flags, all research, and every event. Diana can see exactly what happened on any deal at any point. Reports run from the reporting fields on each deal file.

---

## THE AGENT PROFILES

Each agent has a YAML profile (structured data) and an MD voice guide (narrative instructions for the communication specialist). Together they define exactly how the system writes in each agent's voice.

Built on five qualifier questions — answers become the profile:

1. Tell me about a deal that almost fell apart and how you handled the client conversation
2. A client texts at 9pm asking if they should lower their offer. What do you text back?
3. What is something other agents say to clients that makes you cringe?
4. Describe your ideal client relationship in one sentence
5. A deal just closed. Write the first sentence of your text to the client

The answers reveal voice more accurately than any dropdown or slider. Diana — Miranda Priestly energy, one-sentence texts, "It's done." Elena — relationship-first, warm-professional. Carlos — strategic, data-forward. Marco — enthusiastic, authentic, still earning authority. Sara — thorough, customer-service warmth, review-required until 3 deals close.

---

## ONBOARDING A NEW AGENT — DAY 1

```
Step 1 — Diana creates agent profile
  Opens dashboard → New Agent → answers 5 qualifier questions
  System generates [name].yaml and [name].md
  Sets output_mode to "guided"
  Links Slack handle to profile

Step 2 — Agent joins Slack workspace
  Gets access to team channels
  Types "help" in Slack → system returns action menu

Step 3 — First lead comes in
  Agent types naturally about the lead
  System walks them through every step in guided mode
  Every output explains what it did and what happens next

Step 4 — Agent learns by doing
  Guided mode teaches the transaction process through real deals
  Diana monitors via dashboard
  When Diana decides they are ready → flips output_mode to operational
  One toggle. Instant change.
```

---

## WHAT THE SYSTEM NEVER DOES

- Sends a client message autonomously
- Creates a deal record without agent confirmation
- Generates a document without agent review
- Publishes a listing without Diana's approval
- Surfaces the seller's bottom-line price in any output
- Replaces the agent in any client relationship

The agents are the face of Diana's boutique firm. The system works behind the scenes so they show up better prepared.

---

## SETUP BEFORE USE

**For Claude Projects:**

1. Create a new Claude Project
2. Upload the entire `agency-system/` folder as project knowledge
3. Set the project system prompt to reference `00_orchestrator/identity.md`
4. Create one conversation per active deal, named `#[deal_id]-[side]`
5. Agent profiles load automatically via the orchestrator

**For API deployment:**

1. The orchestrator `identity.md` + `rules.md` become the system prompt
2. Each specialist's files load as context when the orchestrator routes to them
3. The database JSON files persist between sessions
4. See `_database/README.md` for the write protocol

**First things to configure:**

- [ ] Add your firm name throughout (replace "Diana Castellano Real Estate")
- [ ] Update agent profiles with real team members
- [ ] Review document templates against current TREC forms
- [ ] Set neighborhood data update reminder (monthly)
- [ ] Link agent Slack handles to their profiles in dashboard

---

## THE DEMO — THE CHEN DEAL

The system ships with a complete live example: Deal #412-buyer, the Chen deal.

Robert and Maria Chen are relocating from Chicago. Budget $450k–$650k. Travis Heights. Pre-approved at $625k. The deal runs through a competing offer, an accepted contract, an inspection with a roof issue, and an appraisal gap — exercising all five specialists across every major scenario.

The demo database record (`_database/schema.json`) is a fully populated live deal record at the `due_diligence` stage with 10 events logged, 2 active risk flags, 8 documents in various states, 3 communications sent, and 7 deadlines tracked.

---

## WHAT IS BUILT

| Component | Files | Location |
|---|---|---|
| 00 Orchestrator | 4 | `00_orchestrator/` |
| 01 Lead Qualifier | 4 | `01_lead_qualifier/` |
| 02 Property Research | 4 | `02_property_research/` |
| 03 Client Communication | 4 | `03_client_communication/` |
| 04 Transaction Coordinator | 4 + 11 + 4 = 19 | `04_transaction_coordinator/` |
| 05 Listing Manager | 4 + 2 = 6 | `05_listing_manager/` |
| Agent Profiles (5 agents) | 10 | `_config/agent_profiles/` |
| Neighborhood Data (5 files) | 5 | `_catalog/neighborhoods/` |
| Catalog Reference Files | 3 | `_catalog/` |
| System Config Files | 3 | `_config/` |
| Standard Operating Procedures | 6 | `_sops/` |
| Database Schema + README | 2 | `_database/` |
| Root README | 1 | `/` |
| **TOTAL** | **71 files** | |

## WHAT IS PHASE 2

| Feature | Notes |
|---|---|
| Document vault upload | Slack tag `#vault-[deal_id]` → file stored, deal record updated |
| Real Slack integration | Webhooks + slash commands or bot |
| Dashboard UI | React app reading from database JSON files |
| Listing website | Editorial layout, auto-generated from catalog |
| Client-facing forms | Mobile-friendly branded forms for TC data collection |
| Agent onboarding UI | 5-question flow generates profiles automatically |
| Fictional listings | Deal records ready to populate |

---

## THE DESIGN DECISIONS WORTH NOTING

**Anti-CRM by design.** The system populates itself through conversation. No separate data entry. No platform to maintain. Agents just talk to it.

**One writer to the database.** The Orchestrator is the only node that writes to deal records. Every specialist reads. This prevents conflicts and keeps the audit trail clean.

**Property data as snapshot, not live link.** Property data is copied into the deal record at creation. Reflects what the property looked like when the deal was made — not what it looks like after a price reduction.

**Guided mode as the training program.** New agents do not need onboarding sessions. The system teaches the transaction process through every real deal, in real time, in context.

**Voice profiles from qualifier answers, not dropdowns.** Five questions reveal more about how someone actually writes than any configuration panel. The answers become the profile.

**Neighborhood research pre-loaded, not live.** Consistency over theoretical recency. Every agent gets the same verified data for the same neighborhood. Updated monthly, not per query.

**SOPs as Orchestrator playbooks.** When a workflow matches a SOP trigger, the Orchestrator loads that SOP file and follows the step sequence exactly — rather than improvising. Every step is logged to the database. If the system restarts mid-SOP it resumes from the recorded step, never from Step 1.

**All routing through the Orchestrator — always.** Specialists never communicate directly, even during multi-step SOP execution. Every hop is Specialist → Orchestrator → Specialist. Every hop is logged. The database always reflects reality.

---

*Built for Diana Castellano Real Estate — Austin, TX*
*System Version: 1.0*
*Architecture: Multi-folder ICM with explicit handoff protocols*
*Last updated: May 2026*

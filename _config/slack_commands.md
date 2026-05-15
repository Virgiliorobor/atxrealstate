# _config / slack_commands.md
> The Agency — Slack Command Directory
> Reference for agents and the Orchestrator's keyword parsing
> Last updated: May 2026

---

## HOW COMMANDS WORK

Agents communicate with the system through natural language in Slack. The Orchestrator reads every message and routes by intent. For speed and precision, short commands give the Orchestrator an unambiguous signal — no interpretation needed.

**Two input modes:**

**Natural language** — Agent describes what they need in plain text. Orchestrator extracts intent.
> "just got a call from a couple relocating from Chicago, budget around 550, looking in Travis Heights"

**Command** — Agent uses a keyword for immediate, precise routing.
> `brief ATX-003`

Both work. Commands are faster. Natural language is more flexible.

---

## COMMAND SYNTAX

```
[COMMAND] [ARGUMENT] [DEAL_TAG]

Examples:
  brief ATX-003
  status #412-buyer
  draft inspection #412-buyer
  new buyer
  dev output_mode marco operational
```

**Deal tag** (`#412-buyer`) is required for any command about a specific active deal.
**Arguments** follow the command with a space.
**Commands are case-insensitive** — `BRIEF`, `brief`, and `Brief` all work.

---

## COMMAND DIRECTORY

### LEAD & DEAL COMMANDS

| Command | Syntax | Triggers | Who Can Use |
|---|---|---|---|
| `new buyer` | `new buyer` | Lead Qualifier → buyer intake form link | All agents |
| `new seller` | `new seller` | Lead Qualifier → seller intake form link | All agents |
| `new listing` | `new listing` | Lead Qualifier → seller intake form link | All agents |
| `status` | `status #[deal_id]-[side]` | Orchestrator → TC → full deal status | All agents |
| `pipeline` | `pipeline` | Orchestrator → TC → all active deals summary | All agents |
| `cold` | `cold #[deal_id]-[side]` | Orchestrator → marks deal cold, asks for reason | All agents |
| `reactivate` | `reactivate #[deal_id]-[side]` | Orchestrator → returns deal to confirmed stage | All agents |

---

### RESEARCH COMMANDS

| Command | Syntax | Triggers | Who Can Use |
|---|---|---|---|
| `brief` | `brief [property_id]` | Property Research → property snapshot | All agents |
| `comps` | `comps [address or property_id]` | Property Research → CMA report | All agents |
| `neighborhood` | `neighborhood [zone_name]` | Property Research → neighborhood brief | All agents |
| `market` | `market` | Property Research → general Austin market update | All agents |
| `search` | `search #[deal_id]-[side]` | Property Research → buyer search brief based on deal criteria | All agents |

**Zone names for `neighborhood` command:**
`travis_heights` · `east_austin` · `barton_hills` · `north_austin` · `general`

---

### COMMUNICATION COMMANDS

| Command | Syntax | Triggers | Who Can Use |
|---|---|---|---|
| `draft` | `draft [situation] #[deal_id]-[side]` | Client Communication → situation draft | All agents |
| `followup` | `followup #[deal_id]-[side]` | Client Communication → follow-up draft | All agents |
| `welcome` | `welcome #[deal_id]-[side]` | Client Communication → welcome email draft | All agents |
| `closing prep` | `closing prep #[deal_id]-[side]` | Client Communication → closing day instructions draft | All agents |
| `postclose` | `postclose #[deal_id]-[side]` | Client Communication → post-close thank you draft | All agents |

**Situation values for `draft` command:**
`competing_offer` · `offer_submitted` · `offer_accepted` · `inspection` · `appraisal` · `financing_delay` · `custom`

**Example:**
> `draft competing_offer #412-buyer`

---

### TRANSACTION COMMANDS

| Command | Syntax | Triggers | Who Can Use |
|---|---|---|---|
| `offer` | `offer #[deal_id]-[side]` | TC → offer submission form link | All agents |
| `checklist` | `checklist #[deal_id]-[side]` | TC → full transaction checklist status | All agents |
| `deadlines` | `deadlines #[deal_id]-[side]` | TC → deadline tracker, all items and statuses | All agents |
| `generate` | `generate [doc_name] #[deal_id]-[side]` | TC → document generation | All agents |
| `docs` | `docs #[deal_id]-[side]` | TC → document vault status, all documents | All agents |
| `risk` | `risk #[deal_id]-[side]` | TC → all active risk flags for deal | All agents |
| `close` | `close #[deal_id]-[side]` | TC → closing checklist, confirms stage transition | All agents |

**Document names for `generate` command:**
`agency_disclosure` · `wire_fraud` · `purchase_agreement` · `counter_offer` · `inspection_response` · `contingency_removal` · `walkthrough` · `cma` · `seller_disclosure`

**Example:**
> `generate inspection_response #412-buyer`

---

### LISTING COMMANDS

| Command | Syntax | Triggers | Who Can Use |
|---|---|---|---|
| `listing status` | `listing status [property_id]` | Listing Manager → property record status | All agents |
| `price` | `price [property_id] [new_price]` | Listing Manager → price change request + confirmation | Listing agent only |
| `publish` | `publish [property_id]` | Listing Manager → queues listing for Diana's approval | Listing agent only |
| `photos` | Upload photos with `#listing-[property_id]` tag | Listing Manager → photo processing | Listing agent only |
| `vault` | Upload signed PDF with `#vault-[deal_id]` tag | TC → document vault storage | All agents |

---

### SYSTEM COMMANDS

| Command | Syntax | Triggers | Who Can Use |
|---|---|---|---|
| `help` | `help` | Orchestrator → returns this command menu | All agents |
| `help [command]` | `help brief` | Orchestrator → explains specific command with example | All agents |
| `profile` | `profile` | Orchestrator → returns your agent profile summary | All agents |
| `deals` | `deals` | Orchestrator → all your active deals, current stage | All agents |
| `diana` | `diana` | Orchestrator → full portfolio view (Diana only) | Diana only |

---

### DEV COMMANDS — DIANA ONLY

**Access:** `dev` keyword is permission-controlled. Diana's Slack handle only. Any other agent using `dev` receives: "This command requires principal access. Contact Diana."

| Command | Syntax | What it does |
|---|---|---|
| `dev output_mode` | `dev output_mode [agent_id] [guided/operational]` | Toggle agent output mode |
| `dev profile` | `dev profile [agent_id]` | View full agent profile |
| `dev update` | `dev update [agent_id] [field] [value]` | Update specific profile field |
| `dev review` | `dev review [agent_id] [on/off]` | Toggle Sara's review requirement |
| `dev neighborhood` | `dev neighborhood [zone]` | View neighborhood file last update date |
| `dev status` | `dev status` | System health — all active deals, pending alerts, database status |
| `dev log` | `dev log #[deal_id]-[side]` | Full event log for a deal |

**Examples:**
```
dev output_mode marco operational
dev review sara off
dev log #412-buyer
dev status
```

---

## AUTOMATIC TRIGGERS — NO COMMAND NEEDED

These fire automatically without any agent input:

| Trigger | Timing | Action |
|---|---|---|
| Deadline approaching | 48hr before | TC alert → agent DM + deal channel |
| Deadline approaching | 24hr before | TC alert → agent DM (urgent) |
| Deadline missed | Immediately | TC escalation → agent DM + Diana DM |
| Risk flag unacknowledged | 2hr after flag | Orchestrator → Diana DM |
| Deal cold 90 days | Daily check | Orchestrator → agent DM with reengagement suggestion |
| Follow-up due | Per SOP 2 schedule | Orchestrator → Client Communication → draft to agent |
| Weekly digest | Every Monday 8am | Orchestrator → per-agent deal digest + Diana portfolio view |
| Monthly catalog report | 1st of month | Listing Manager → Diana dashboard |

---

## CHANNEL STRUCTURE

**One Slack channel per active deal:**

```
#412-buyer    ← Chen deal — all activity, all parties
#327-seller   ← Hoffman listing — all activity
#089-buyer    ← Lara deal — all activity
```

**Format:** `#[deal_id]-[side]`

**Benefits:**
- Full deal history in one place
- Easy handoff if agent is on vacation — new agent reads channel, knows everything
- All alerts, drafts, documents, and updates in context
- Multiple offers all tracked in one thread

**Team channels (always active):**
```
#team-general     ← Team-wide updates from Diana
#team-alerts      ← System-wide urgent flags (missed deadlines, escalations)
#listings         ← New listing announcements, photo uploads
#diana-dashboard  ← Diana's private digest channel
```

---

## QUICK REFERENCE CARD

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE AGENCY — SLACK QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEW DEALS
  new buyer          → buyer intake form
  new seller         → seller intake form

RESEARCH
  brief [id]         → property snapshot
  comps [address]    → CMA report
  neighborhood [zone]→ neighborhood brief
  search #[deal]     → buyer search results

STATUS
  status #[deal]     → full deal status
  deadlines #[deal]  → deadline tracker
  checklist #[deal]  → transaction checklist
  pipeline           → all your active deals

DOCUMENTS
  generate [doc] #[deal] → generate document
  docs #[deal]           → document vault status

COMMUNICATION
  draft [situation] #[deal] → draft client message
  followup #[deal]          → follow-up draft

SYSTEM
  help               → this menu
  profile            → your agent profile
  deals              → your active deals

UPLOADS
  #listing-[id]      → attach photos to listing
  #vault-[deal]      → attach signed document to vault
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*File: _config/slack_commands.md*
*Owned by: Diana (Principal)*
*Read by: All agents, Orchestrator keyword parser*
*Update when: New commands added, routing rules change*

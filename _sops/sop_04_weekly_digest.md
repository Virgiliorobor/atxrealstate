# SOP 04 — Weekly Active Deal Digest
> Trigger: Automatic — every Monday at 8am
> Owner: Orchestrator → TC → Orchestrator (delivery)
> No agent input required — fully automatic
> Database: sop.active_sop = "sop_04_weekly_digest" per deal updated

---

## TRIGGER CONDITIONS

**Automatic only — Monday 8am system clock**

No agent trigger needed. No command required. Fires every Monday for all active deals simultaneously.

On-demand version: agent types `pipeline` → Orchestrator runs digest for that agent's deals immediately

---

## STEP SEQUENCE

### STEP 1 — Orchestrator: Load All Active Deals
```
Monday 8am trigger:

Orchestrator:
  → Queries database: all deals where stage NOT IN [closed, cold]
  → Groups deals by assigned agent_id
  → For each deal: loads full deal record
  → Identifies urgent items (deadlines within 7 days, open risk flags)

Orchestrator:
  → Logs: EVT "weekly_digest_triggered" (system-level, not per deal)
  → Routes all deal records to TC for status compilation
```

### STEP 2 — TC: Compile Deal Status
```
Orchestrator → TC:
  Context: all active deal records[], grouped by agent,
           sop_context step 2

TC:
  For each deal:
  → Current stage
  → Next deadline: name, date, days remaining, priority
  → Pending documents: what is missing or in draft
  → Open risk flags: unresolved items
  → Last client contact: days since (from reporting.last_contact)
  → Days in current stage
  → Checklist completion percentage

  → Identifies urgent items across all deals:
      Deadlines within 48 hours → critical
      Deadlines within 7 days → attention needed
      Unacknowledged risk flags → flagged
      No client contact in 14+ days → follow-up suggested

TC → Orchestrator:
  sop_step_complete: 2
  output:
    per_agent_digests: {
      elena: [deal summaries],
      carlos: [deal summaries],
      marco: [deal summaries]
    }
    diana_portfolio: [all deal summaries, urgent_items[]]
    urgent_items: [cross-deal urgent list]

Orchestrator:
  → Logs: EVT "weekly_digest_compiled"
  → Updates database per deal: sop.current_step = 3
```

### STEP 3 — Orchestrator: Deliver Per-Agent Digests
```
For each agent with active deals:

Orchestrator → Agent (Slack DM):

"WEEKLY DIGEST — [Day] [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ACTIVE DEALS ([N])

#[deal_id] · [Client] · [Stage]
[urgency_flag] [Next deadline: name · date · days]
[pending item if any]

#[deal_id] · [Client] · [Stage]
[urgency_flag] [Next deadline: name · date · days]

THIS WEEK'S PRIORITIES
→ [Top 3 action items across all deals, ordered by urgency]

→ Full dashboard view"

Orchestrator:
  → Logs: EVT "weekly_digest_delivered" per agent
  → Updates database per deal: sop.current_step = 4
```

### STEP 4 — Orchestrator: Deliver Diana's Portfolio Digest
```
Orchestrator → Diana (Slack DM + dashboard):

"PORTFOLIO DIGEST — [Day] [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE DEALS ([N] total)

URGENT — NEEDS ATTENTION ([N])
#[deal_id] · [Client] · [Agent] · [Issue]

BY AGENT
Elena ([N] deals): [summary]
Carlos ([N] deals): [summary]
Marco ([N] deals): [summary]

LISTINGS NEEDING ATTENTION
[Any listings with 21+ DOM and no offer]

CLOSINGS THIS WEEK
[Deals in closing stage with this week's close date]

COLD DEALS THIS MONTH ([N])
[Deals that went cold since last digest]

→ Full dashboard"

Orchestrator:
  → Logs: EVT "diana_digest_delivered"
  → Updates database: all deal sop.completed_at = [timestamp]
  → Dashboard refreshed with current state
  → SOP 04 COMPLETE until next Monday
```

---

## DATABASE WRITES — FULL SOP 04

| Step | Event Logged | Fields Updated |
|---|---|---|
| 1 | weekly_digest_triggered | sop.active_sop per deal |
| 2 | weekly_digest_compiled | sop.current_step per deal |
| 3 | weekly_digest_delivered (per agent) | sop.current_step per deal |
| 4 | diana_digest_delivered | sop.completed_at per deal |

---

## DIGEST URGENCY FLAGS

| Flag | Condition | Display |
|---|---|---|
| 🔴 CRITICAL | Deadline within 48hr or missed | Bold, top of list |
| 🟡 ATTENTION | Deadline within 7 days or open risk flag | Highlighted |
| 🟢 ON TRACK | No urgent items | Normal |
| ⚪ FOLLOW-UP | No client contact in 14+ days | Noted at bottom |

---

## ON-DEMAND VERSION

Agent types: `pipeline`

Orchestrator runs Steps 2-3 for that agent's deals only.
Returns immediately — no waiting for Monday.
Does not affect the Monday schedule.

Diana types: `diana` or `pipeline all`

Orchestrator runs Steps 2-4 immediately.

---

*SOP version: 1.0*
*Trigger: Monday 8am automatic*
*Chained from: nothing — runs independently*
*Chains to: nothing — may trigger sop_02 if follow-up items detected*

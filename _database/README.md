# _database / README.md
> The Agency — Operational Database Layer
> The memory and reporting engine of the system

---

## WHAT THIS IS

The `_database/` folder is the operational engine of The Agency system. It is where everything that happens gets recorded, where current state lives, and where reports are generated from.

Every folder, every specialist file, every template in this system produces outputs. The database is where those outputs are permanently recorded. Without it the system has no memory — each interaction starts from scratch. With it the system knows the full history of every deal, every agent action, every AI output, and every client interaction.

---

## ONE FILE PER DEAL

```
_database/
├── README.md              ← This file
├── schema.json            ← Master empty template — the spec for every deal record
└── deals/
    ├── 412-buyer.json     ← The Chen deal — full history
    ├── 327-seller.json    ← Hoffman listing — full history
    └── 089-buyer.json     ← David Lara deal — full history
```

Each deal file is named `[deal_id]-[side].json`. It is the single source of truth for that deal — property data, parties, deadlines, documents, communications, risk flags, research, and the full event log.

---

## WHO WRITES TO THE DATABASE

**The Orchestrator only.**

Every specialist returns output to the Orchestrator. The Orchestrator writes the event, updates the state, and moves on. Agents never write directly. Specialists never write directly. One writer. Always. This prevents conflicts, duplicates, and data integrity problems.

---

## THE SEVEN SECTIONS OF EVERY DEAL RECORD

### 1. Identity (`_id`)
Deal ID, side, Slack channel, file name. The keys that link everything.

### 2. Meta (`meta`)
Current stage, full stage history with timestamps, created/updated/closed timestamps. This is the state machine — the Orchestrator updates it on every transition.

### 3. People (`agent`, `client`, `buyer_profile` / `seller_profile`)
Everyone involved in the deal. Agent profile summary (not the full profile — just what the database needs). Client contact and preferences. Buyer criteria or seller motivations. Property data snapshot copied at deal creation — not a live link.

### 4. Transaction (`transaction`, `contingencies`, `deadlines`)
All financial terms, contingencies with their status and alert history, and the full deadline tracker with 48hr/24hr alert flags. This is what the TC reads and updates.

### 5. Documents (`documents`)
Every document — firm-generated and third-party. Status, confirmation timestamps, vault path. The TC writes here after every document generation and confirmation.

### 6. Activity (`communications`, `risk_flags`, `research`)
Communications log — every draft, which option was selected, when it was sent. Risk flags — what was detected, when, severity, current resolution status. Research — every brief generated, by whom, when, delivered to whom.

### 7. Reporting (`reporting`)
Pre-calculated fields for Diana's reports and dashboard. Populated progressively as the deal advances. When a deal closes these fields are complete and the deal contributes to monthly, quarterly, and annual reporting.

---

## THE EVENT LOG

The most important section of every deal record is `events`. It is append-only — nothing is ever edited or deleted. Every action by every actor is a new event object:

```json
{
  "event_id": "EVT-001",
  "timestamp": "2026-05-13T09:40:00",
  "actor_type": "ai",
  "actor_id": "lead_qualifier",
  "agent_id": "elena",
  "action": "deal_draft_created",
  "detail": "Buyer lead extracted from Elena's Slack message.",
  "outcome": "success",
  "next_triggered": "confirmation_gate"
}
```

**Actor types:** `ai` (any specialist) or `human` (any agent)

**What gets logged:**
- Every deal stage transition
- Every agent confirmation or rejection
- Every document generated and confirmed
- Every alert sent and acknowledged
- Every risk flag raised and resolved
- Every communication drafted and sent
- Every research brief generated
- Every form sent to a client
- Every data update to the deal record

**What this enables:**
- Full audit trail — Diana can see exactly what happened on any deal at any point
- AI continuity — the Orchestrator loads the event log before routing and knows the full history
- Accountability — every action is attributed to a specific actor
- Debugging — if something goes wrong, the event log shows exactly where

---

## THE REPORTING LAYER

The `reporting` block on every deal is designed for aggregation. When Diana needs a report:

**Monthly close report:**
Query all deal files where `reporting.close_month = [month]` and `reporting.deal_outcome = "closed"`

**Agent performance:**
Group by `reporting.agent_id`, count closed deals, average `reporting.days_to_close`

**Neighborhood volume:**
Group by `reporting.neighborhood`, count deals, average `reporting.list_to_sale_ratio`

**Lead source effectiveness:**
Group by `reporting.lead_source`, count deals, count closed, calculate conversion rate

**Pipeline value:**
Sum `reporting.offer_price` across all active deals

These queries run against the deal files directly — no separate reporting database needed for the portfolio. In production, these files would feed into a proper database (Firestore, Supabase, Airtable) but the schema is identical.

---

## WRITE PROTOCOL — HOW THE ORCHESTRATOR UPDATES THE DATABASE

After every interaction the Orchestrator performs two writes:

**Write 1 — Append event:**
```json
{
  "event_id": "EVT-[next_number]",
  "timestamp": "[now]",
  "actor_type": "[ai or human]",
  "actor_id": "[specialist or agent_id]",
  "agent_id": "[assigned agent]",
  "action": "[what happened]",
  "detail": "[specific detail]",
  "outcome": "[success / flagged / delivered / failed]",
  "next_triggered": "[what this triggered, or null]"
}
```

**Write 2 — Update state field:**
Whatever changed — stage, deadline status, document status, flag status, reporting field. Only the changed field is updated. The rest of the record is untouched.

---

## PROPERTY DATA — WHY IT IS COPIED, NOT LINKED

The property data in each deal record is a snapshot copied from the catalog at deal creation. It is not a live link to `_catalog/properties/[ID].md`.

This is intentional. Property data changes — price reductions, status updates, new photos. The deal record needs to reflect what the property looked like when the deal was made, not what it looks like today. A buyer's offer was made at $629,000 list price — that fact should not change in the deal record just because the seller later reduced to $610,000.

The property_id is preserved so the catalog record can always be cross-referenced. But the snapshot is the authoritative source for the deal.

---

## DATA SECURITY NOTES

**bottom_line_price:** This field exists in the schema under `seller_profile`. It is populated at deal creation from the seller intake form. It is never surfaced in any AI output, any dashboard view accessible to buyer agents, any communication draft, or any reporting field. It is visible only to the assigned seller agent and Diana through the secure dashboard view.

**Client contact information:** Email and phone are stored in the deal record. They are used only for document generation and communication drafts. They are never included in Slack messages beyond the initial confirmation screen.

**Event log integrity:** The events array is append-only. No event is ever edited or deleted. If incorrect information was logged, a correction event is appended noting the error — the original event is preserved.

---

## FUTURE PRODUCTION PATH

For the portfolio submission, deal records are JSON files in this folder. For a real deployment, the same schema feeds directly into:

- **Firestore** (Google) — real-time sync with dashboard
- **Supabase** — open source, SQL queryable
- **Airtable** — no-code friendly, Diana could manage directly
- **PlanetScale** — if the team scales significantly

The schema does not change. Only the storage layer changes. That is the design intent.

---

*Database version: 1.0*
*Schema file: _database/schema.json*
*Write protocol: Orchestrator only, append-only on events*
*Read access: All specialists, dashboard, reporting layer*

# SOP 03 — Offer Received
> Trigger: Agent reports offer on active listing or deal
> Specialists: TC → Client Communication → TC (if accepted)
> All routing through Orchestrator
> Database: sop.active_sop = "sop_03_offer_received" written at trigger

---

## TRIGGER CONDITIONS

The Orchestrator loads this SOP when it detects:
- Keywords: `offer received`, `got an offer`, `submitting offer`
- Natural language: "offer came in on", "buyer wants to offer", "we have an offer"
- Deal tag present and deal stage is `active`

---

## STEP SEQUENCE

### STEP 1 — TC: Log and Analyze Offer
```
Orchestrator → TC:
  Context: deal record, agent message with offer details,
           agent profile, sop_context step 1

TC:
  → Extracts offer terms from message:
      offer_price, earnest_money, financing_type,
      closing_date, contingencies, cooperating_agent
  → If terms incomplete → sends offer submission form link to agent
  → Waits for form submission if needed
  → Generates offer analysis:
      Price vs list price (gap/premium/percentage)
      Financing strength assessment
      Contingency risk flags
      Closing date vs deal timeline
  → If multiple offers → generates comparison sheet

TC → Orchestrator:
  sop_step_complete: 1
  next_specialist_needed: "03_client_communication"
  output: offer_summary, offer_analysis, comparison_sheet (if multiple)

Orchestrator:
  → Logs: EVT "offer_received", offer details
  → Updates database:
      transaction.offer_price, transaction.earnest_money,
      transaction.closing_date, transaction.contingencies
      sop.current_step = 2
```

### STEP 2 — Client Communication: Draft Seller Response Options
```
Orchestrator → Client Communication:
  Context: deal record, offer_summary, offer_analysis,
           agent profile (Carlos for seller-side),
           sop_context step 2

Client Communication:
  → Loads agent voice profile
  → Drafts three response options in agent's voice:

  Option A — Accept:
    "Here is what accepting means for your timeline
     and what happens next"

  Option B — Counter:
    "Here is a counter strategy — [specific terms to counter]
     and why this positions you well"

  Option C — Reject:
    "Here is how to decline professionally
     while keeping the door open"

  → Each option is a complete draft, ready to send

Client Communication → Orchestrator:
  sop_step_complete: 2
  next_specialist_needed: null
  output: response_drafts[optionA, optionB, optionC]

Orchestrator:
  → Logs: EVT "offer_response_options_drafted"
  → Updates database: sop.current_step = 3
  → Posts options to agent's deal channel
```

### STEP 3 — Agent: Selects Response and Sends
```
Orchestrator → Agent (Slack #[deal_id]-[side]):
  "Offer received — $[amount] from [cooperating_agent].
   Three response options ready.
   → [Review Offer Analysis + Response Options]"

Agent:
  → Reviews offer analysis
  → Selects response option (or requests custom draft)
  → Reviews selected draft
  → Sends to cooperating agent / seller client

Agent signals selection:
  "sending option B" or "accepted" or "countering"

Orchestrator:
  → Logs: EVT "offer_response_sent", option_selected
  → Updates database:
      communications[] ← new entry
      sop.current_step = 4

IF COUNTER OFFER:
  → TC generates Counter Offer document from template
  → Agent reviews, confirms, sends
  → TC sets counter offer expiration deadline
  → SOP 03 holds — waiting for buyer response
  → When response received → SOP 03 re-triggers

IF REJECTED:
  → SOP 03 COMPLETE
  → Deal returns to active stage, monitoring continues

IF ACCEPTED → continue to Step 4
```

### STEP 4 — TC: Activate Full Transaction (Offer Accepted)
```
Trigger: Agent signals "accepted" or "offer accepted"

Orchestrator → TC:
  Context: deal record, accepted offer terms,
           sop_context step 4

TC:
  → Sends offer terms form link if all terms not yet captured
  → On form receipt — calculates ALL deadlines from contract terms:
      Earnest money due date
      Inspection period end date and time
      Appraisal deadline
      Loan commitment deadline
      Closing Disclosure 3-day rule date
      Final walkthrough date
      Closing date
  → Activates deadline tracker — all 7 deadlines set
  → Initializes buyer and seller checklists
  → Queues document generation:
      Purchase Agreement (if not already executed)
      Earnest Money Receipt
  → Updates property status via Orchestrator → Listing Manager:
      property.status = under_contract

TC → Orchestrator:
  sop_step_complete: 4
  next_specialist_needed: "03_client_communication"
  output: deadline_tracker_activated, documents_queued,
          checklist_initialized

Orchestrator:
  → Logs: EVT "offer_accepted", EVT "deadline_tracker_activated"
  → Updates database:
      stage = under_contract
      stage_history[] ← new entry
      transaction.contract_date
      deadlines[] ← all 7 deadlines populated
      sop.current_step = 5
  → Routes to Listing Manager:
      property.status = under_contract (website badge update queued)
```

### STEP 5 — Client Communication: Offer Accepted Message
```
Orchestrator → Client Communication:
  Context: deal record (now under_contract), agent profile,
           deadline_tracker summary, sop_context step 5
           situation_type: "offer_accepted"

Client Communication:
  → Drafts offer accepted message in agent's voice
  → Includes: celebration, next steps summary, key deadlines
  → Written for buyer client (buyer-side) or seller client (seller-side)

Client Communication → Orchestrator:
  sop_step_complete: 5
  next_specialist_needed: null
  output: offer_accepted_draft

Orchestrator:
  → Logs: EVT "offer_accepted_message_drafted"
  → Updates database: sop.current_step = 6
  → Posts draft to agent deal channel
```

### STEP 6 — Agent: Sends and SOP Completes
```
Agent reviews and sends offer accepted message.

Orchestrator:
  → Logs: EVT "offer_accepted_message_sent", COMM-[N]
  → Updates database:
      communications[] ← new entry
      reporting.days_to_contract
      sop.completed_at = [timestamp]
  → SOP 03 COMPLETE

Post-SOP:
  → TC takes over — deadline monitoring is now active
  → Next SOP that may trigger: none directly
    (TC handles due_diligence stage autonomously)
```

---

## DATABASE WRITES — FULL SOP 03

| Step | Event Logged | Fields Updated |
|---|---|---|
| 1 | offer_received | transaction fields, sop tracking |
| 2 | offer_response_options_drafted | sop.current_step |
| 3 | offer_response_sent | communications[], sop.current_step |
| 4 | offer_accepted, deadline_tracker_activated | stage, deadlines[], checklists |
| 5 | offer_accepted_message_drafted | sop.current_step |
| 6 | offer_accepted_message_sent | communications[], sop.completed_at |

---

## ERROR HANDLING

| Situation | Orchestrator Action |
|---|---|
| Offer terms incomplete | TC sends form link. SOP holds at Step 1. |
| Agent does not respond to options within 4hr | Reminder sent. "Response deadline from cooperating agent approaching." |
| Counter offer expires with no buyer response | TC alerts agent. Agent decides: extend, lower, or close. |
| Multiple offers received simultaneously | TC generates comparison sheet. Step 2 generates options for best offer. Agent decides which to pursue. |

---

*SOP version: 1.0*
*Chained from: deal in active stage*
*Chains to: TC autonomous deadline monitoring (due_diligence stage)*

# SOP 01 — New Lead Intake and Buyer Brief
> Trigger: New buyer or seller lead reported by agent
> Specialists: Lead Qualifier → Property Research → Listing Manager → Client Communication
> All routing through Orchestrator — no direct specialist communication
> Database: sop.active_sop = "sop_01_new_lead" written at trigger

---

## TRIGGER CONDITIONS

The Orchestrator loads this SOP when it detects:
- Keywords: `new buyer`, `new seller`, `new listing`, `new client`, `buyer lead`, `seller lead`
- Natural language: "just got a call from", "referral", "new lead", "someone looking to buy/sell"
- Form submission: buyer or seller intake form received

**Buyer side:** Proceeds through all 6 steps
**Seller side:** Steps 1-2 same, Step 3 triggers CMA instead of buyer search, Steps 4-5 generate listing brief instead of buyer brief, Step 6 same

---

## STEP SEQUENCE

### STEP 1 — Lead Qualifier: Extract and Structure
```
Orchestrator → Lead Qualifier
  Context: raw agent message, agent profile, sop_context step 1

Lead Qualifier:
  → Extracts all available data from message or form
  → Identifies missing required fields
  → Generates draft deal record
  → Presents confirmation screen to agent
  → Waits for agent confirmation

Agent confirms (or edits and confirms)

Lead Qualifier → Orchestrator:
  sop_step_complete: 1
  next_specialist_needed: "self"  ← stay for step 2
  output: draft_deal_record, missing_fields, confirmation_presented

Orchestrator:
  → Logs: EVT "deal_draft_created"
  → Waits for agent confirmation signal
```

### STEP 2 — Lead Qualifier: Create Deal Record
```
Agent confirms at confirmation gate

Orchestrator → Lead Qualifier:
  Context: confirmed deal record, sop_context step 2

Lead Qualifier:
  → Creates confirmed deal record
  → Opens Slack channel #[deal_id]-[side]
  → Returns confirmed record

Lead Qualifier → Orchestrator:
  sop_step_complete: 2
  next_specialist_needed: "02_property_research"
  output: confirmed_deal_record, deal_id, slack_channel_created

Orchestrator:
  → Logs: EVT "deal_confirmed"
  → Updates database: stage = confirmed, sop.current_step = 3
  → Posts deal summary to #[deal_id]-[side]
```

### STEP 3 — Property Research: Neighborhood Brief + Matching Properties
```
Orchestrator → Property Research:
  Context: confirmed deal record, buyer profile, agent profile,
           sop_context step 3

Property Research:
  → Loads neighborhood file for target zone(s)
  → Filters data to buyer's specific criteria (budget, must-haves, deal-breakers)
  → Generates neighborhood brief matched to buyer profile

Property Research → Orchestrator:
  sop_step_complete: 3
  next_specialist_needed: "05_listing_manager"
  output: neighborhood_brief, buyer_criteria_summary

Orchestrator:
  → Logs: EVT "neighborhood_brief_generated"
  → Updates database: sop.current_step = 4
  → Routes to Listing Manager with full context
```

### STEP 4 — Listing Manager: Matching Active Properties
```
Orchestrator → Listing Manager:
  Context: buyer profile (budget, neighborhoods, must-haves, deal-breakers),
           sop_context step 4

Listing Manager:
  → Queries catalog: active properties in target neighborhoods
  → Filters by: budget range, bedrooms, HOA limits, other deal criteria
  → Returns matching property records with full details

Listing Manager → Orchestrator:
  sop_step_complete: 4
  next_specialist_needed: "03_client_communication"
  output: matching_properties[] (max 3-5 best matches)

Orchestrator:
  → Logs: EVT "matching_properties_retrieved"
  → Updates database: sop.current_step = 5
  → Combines: neighborhood_brief + matching_properties
  → Routes to Client Communication with combined package
```

### STEP 5 — Client Communication: Assemble Buyer Brief
```
Orchestrator → Client Communication:
  Context: agent profile (full voice profile), deal record,
           neighborhood_brief, matching_properties[],
           sop_context step 5
           brief_format: "buyer_brief"

Client Communication:
  → Loads agent voice profile
  → Assembles buyer brief:
      Section 1: Neighborhood overview tailored to buyer criteria
      Section 2: Why [neighborhood] makes sense for this buyer specifically
      Section 3: Matching listings — 2-3 properties, why each fits their criteria
      Section 4: Market context — what their budget buys right now
      Section 5: Suggested next step (schedule showings)
  → Written entirely in agent's voice
  → Formatted as structured document (markdown, PDF-ready Phase 2)

Client Communication → Orchestrator:
  sop_step_complete: 5
  next_specialist_needed: null  ← brief goes to agent for delivery
  output: buyer_brief_draft, format: "structured_document"

Orchestrator:
  → Logs: EVT "buyer_brief_generated"
  → Updates database: sop.current_step = 6
  → Posts brief to agent's deal channel for review
```

### STEP 6 — Agent: Reviews and Delivers
```
Orchestrator → Agent (Slack #[deal_id]-[side]):
  "Buyer brief ready for the [client_name].
   Review and forward when ready.
   → [View Buyer Brief]"

Agent:
  → Reviews brief
  → Edits if needed
  → Forwards to buyer client directly

Agent signals sent (types "sent" or system detects no edit + confirm):

Orchestrator:
  → Logs: EVT "buyer_brief_delivered", COMM-001
  → Updates database:
      sop.current_step = 6
      sop.completed_at = [timestamp]
      communications[] ← new entry
      reporting.last_contact = [timestamp]
  → Sets follow-up timer: sop_02 trigger in 3 days
  → SOP 01 COMPLETE
```

---

## DATABASE WRITES — FULL SOP 01

| Step | Event Logged | Fields Updated |
|---|---|---|
| 1 | deal_draft_created | sop.active_sop, sop.current_step |
| 2 | deal_confirmed | stage, sop.current_step, slack_channel |
| 3 | neighborhood_brief_generated | sop.current_step, research[] |
| 4 | matching_properties_retrieved | sop.current_step |
| 5 | buyer_brief_generated | sop.current_step |
| 6 | buyer_brief_delivered | sop.completed_at, communications[], reporting.last_contact |

---

## ERROR HANDLING

| Situation | Orchestrator Action |
|---|---|
| Agent does not confirm deal record within 24hr | Reminder sent. SOP paused at Step 1. |
| No matching properties in catalog | Skip Step 4. Notify agent: "No matching listings in catalog currently. Brief will include neighborhood context only." Continue to Step 5. |
| Agent does not send brief within 48hr | Gentle reminder: "Buyer brief for [client] is ready and waiting in #[deal_id]." |
| Missing required fields block deal creation | SOP holds at Step 1 until resolved. |

---

## SELLER SIDE VARIATION

For seller leads, Steps 3-5 run differently:

- Step 3: Property Research generates CMA (not neighborhood brief)
- Step 4: No Listing Manager call needed — subject property is already known
- Step 5: Client Communication generates listing presentation intro (not buyer brief)

Everything else is identical.

---

*SOP version: 1.0*
*Next SOP triggered: sop_02_follow_up (3 days after Step 6 complete)*

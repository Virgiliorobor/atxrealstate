# 00_orchestrator / handoff.md
> The Agency — AI Operating System
> Orchestrator Handoff Protocol

---

## HOW THE ORCHESTRATOR RECEIVES WORK

The Orchestrator is always the first receiver. Every input arrives here before going anywhere else.

### Inbound Sources
- Slack messages from agents (primary)
- Form submissions from browser (via Slack webhook notification)
- Automatic TC deadline triggers (internal, time-based)
- Dashboard actions from Diana (settings changes, manual overrides)

### What the Orchestrator Does on Receipt

```
1. Parse message → identify agent (Slack handle → agent profile)
2. Scan for deal tag (#412-buyer) → load deal record if found
3. Load database deal record → check sop.active_sop and sop.current_step
4. Check SOP trigger table → does this message match a SOP?
   YES → load SOP file → execute defined step sequence
   NO  → detect intent via keyword table or natural language
5. Build context package → deal record + agent profile + property record
                         + intent + sop_context (if SOP active)
6. Route to specialist
7. Wait for specialist output
8. Receive output → read sop_step_complete if SOP active
9. Log event to database → update sop.current_step
10. Format output for agent's output_mode → relay via Slack
11. Update deal stage if transition detected
12. Update dashboard
13. If SOP active → route to next step's specialist
    If SOP complete → write sop.completed_at → resume standard monitoring
```

---

## HOW THE ORCHESTRATOR HANDS OFF TO EACH SPECIALIST

### Handoff to 01_lead_qualifier

**Trigger conditions:**
- Keywords: "new buyer", "new seller", "new listing", "new client", "buyer lead", "seller lead"
- Natural language signals: "just got a call from", "referral", "someone looking to buy/sell"
- Form submission: buyer intake or seller intake received

**Context package sent:**
```yaml
to: "01_lead_qualifier"
agent_profile:
  agent_id: "marco"
  name: "Marco"
  output_mode: "guided"
incoming_message: "just got off the phone with David Lara, East Austin, 500k, 90 days"
detected_intent: "new_buyer_lead"
routing_reason: "Keywords 'looking to buy', 'budget', 'pre-approved' detected. No existing deal tag."
form_data: null
sop_context:
  active_sop: "sop_01_new_lead"
  current_step: 1
  total_steps: 6
  step_description: "Lead Qualifier extracts and structures lead data"
  next_step: 2
  next_specialist: "self"
timestamp: "2026-05-13T10:15:00"
```

**Expected output from 01_lead_qualifier:**
```yaml
status: "deal_confirmed" | "deal_draft_pending"
deal_id: "089"
deal_record: { ... full confirmed record ... }
missing_fields: ["email", "phone", "must_haves"]
suggested_next: "property_research"
agent_message: "Deal #089-buyer created for David Lara. Want me to pull an East Austin brief?"
```

---

### Handoff to 02_property_research

**Trigger conditions:**
- Keywords: "research", "comps", "neighborhood brief", "what's the market", "CMA"
- Automatic: triggered after new deal confirmation
- Automatic: triggered after new listing confirmation (CMA for pricing)
- Stage: active — agent requests property-specific research before showing

**Context package sent:**
```yaml
to: "02_property_research"
agent_profile:
  agent_id: "elena"
  output_mode: "operational"
deal_record: { ... full deal record #412-buyer ... }
request_type: "neighborhood_brief"    # neighborhood_brief | cma | property_snapshot | market_update
target: "Travis Heights"
specific_context: "Buyers budget $450k-$650k, 3br minimum, yard, no HOA over $300"
timestamp: "2026-05-13T10:20:00"
```

**Expected output from 02_property_research:**
```yaml
status: "research_complete"
deal_id: "412"
research_type: "neighborhood_brief"
brief: { ... full brief content ... }
suggested_next: "client_communication"
agent_message: "Travis Heights brief ready. Want me to draft a welcome email for the Chens?"
```

---

### Handoff to 03_client_communication

**Trigger conditions:**
- Keywords: "draft email", "draft message", "write to client", "follow up", "text them"
- Automatic: suggested after research brief delivered
- Automatic: suggested after TC risk flag or document generation
- Stage: closed → post-close follow-up triggered

**Context package sent:**
```yaml
to: "03_client_communication"
agent_profile:
  agent_id: "elena"
  name: "Elena Reyes"
  output_mode: "operational"
  communication_tone:
    formality: "warm-professional"
    pace: "measured"
    signature_phrases: ["Let me know if you have any questions — I'm always reachable.", "We're in good shape here."]
    avoid_phrases: ["Per my last email", "As previously stated"]
    sign_off: "Talk soon, Elena"
deal_record: { ... full deal record #412-buyer ... }
property_record: { ... property ATX-002 if applicable ... }
situation_type: "competing_offer"
specific_context: "Seller received another offer. Chens must decide by 8pm tonight."
timestamp: "2026-05-13T16:42:00"
```

**Expected output from 03_client_communication:**
```yaml
status: "draft_ready"
deal_id: "412"
draft_type: "competing_offer_email"
drafts:
  - label: "Option A — Urgent"
    subject: "Update on 2219 Bluebonnet — We Need to Move"
    body: "..."
  - label: "Option B — Measured"
    subject: "Important Update — 2219 Bluebonnet Lane"
    body: "..."
agent_action_required: "review_and_send"
agent_message: "Two options ready. Option A is urgent, Option B is measured. Your call."
```

---

### Handoff to 04_transaction_coordinator

**Trigger conditions:**
- Keywords: "offer accepted", "under contract", "inspection", "appraisal", "closing", "deadline", "documents"
- Automatic: deal stage transitions to under_contract, due_diligence, or closing
- Automatic: 48-hour deadline alert (time-based, no agent trigger)
- Agent requests: "deal status", "what's next", "closing checklist"

**Context package sent:**
```yaml
to: "04_transaction_coordinator"
agent_profile:
  agent_id: "marco"
  output_mode: "guided"
deal_record: { ... full deal record #412-buyer including transaction block ... }
property_record: { ... property ATX-002 ... }
trigger_type: "deadline_alert"          # stage_transition | deadline_alert | document_request | status_check | risk_flag
specific_event: "inspection_deadline_48hr"
hours_remaining: 47
timestamp: "2026-05-14T10:00:00"
```

**Expected output from 04_transaction_coordinator:**
```yaml
status: "alert_delivered" | "document_ready" | "status_delivered" | "risk_flagged"
deal_id: "412"
urgent_items: ["inspection_response_due_tomorrow"]
documents_ready: ["inspection_response_draft"]
risk_flags: ["inspection_deadline_24hr"]
suggested_next: ["review_inspection_response", "send_client_options_email"]
agent_message: "Inspection deadline is tomorrow 5pm Marco. Draft response ready for your review."
```

---

## HOW THE ORCHESTRATOR RECEIVES OUTPUTS AND WHAT IT DOES NEXT

Every specialist output returns to the Orchestrator. The Orchestrator then:

### Step 1 — Read SOP context from specialist output
```
If SOP is active:
  Read sop_step_complete from output
  Confirm step number matches expected
  Log EVT "sop_step_[N]_complete" to database
  Update database: sop.current_step = next_step

If no SOP active:
  Continue to Step 2
```

### Step 2 — Format for output_mode
```
operational → deliver clean output, minimal framing
guided → wrap output with context, explain what happened, suggest next action
```

### Step 3 — Determine relay channel
```
Urgent alert or DM response → agent's Slack DM
Deal activity → deal's Slack channel (#412-buyer)
Diana-level escalation → Diana's DM + dashboard
```

### Step 4 — Check for stage transition
```
Did this output trigger a stage change?
  YES → Notify agent → wait for confirmation → update stage → post to dashboard
  NO  → Continue
```

### Step 5 — SOP next step OR standard next trigger
```
If SOP active:
  Read next_specialist_needed from sop_context return
  Route to next specialist with full context + updated sop_context
  Do NOT improvise — follow the SOP sequence exactly

If SOP complete (next_specialist_needed: null):
  Write sop.completed_at to database
  Resume standard monitoring

If no SOP active:
  Does the workflow call for another specialist?
    Lead qualified → suggest property research
    Research complete → suggest client communication
    Offer accepted → activate TC deadline tracker
    Risk flagged → suggest client communication draft
    NO next trigger → wait for agent input
```

### Step 6 — Update dashboard
```
Every output is logged to the deal's event log in database
Deal stage, last activity, next deadline → updated on dashboard in real time
SOP current step → visible in dashboard deal detail view
```

---

## WHAT THE ORCHESTRATOR NEVER PASSES TO SPECIALISTS

Regardless of what is in the deal record, the Orchestrator strips the following before building any context package:

```
seller_profile.bottom_line_price    → Never included in any context package
                                       Exception: 04_TC receives it only if 
                                       deal is seller-side AND stage is under_contract
                                       AND TC needs it to flag appraisal gap risk.
                                       Even then: flagged as INTERNAL ONLY.

client.full_ssn                     → Never stored, never passed
client.bank_account_details         → Never stored, never passed
```

---

## HANDOFF SEQUENCE — FULL DEAL LIFECYCLE

```
NEW LEAD
Agent message → Orchestrator → 01_Lead_Qualifier → Orchestrator → Confirmation gate
                                                                         ↓
                                                                   Agent confirms
                                                                         ↓
DEAL CREATED                                                      Orchestrator creates deal
                                                                         ↓
                                                              Orchestrator → 02_Property_Research
                                                                         ↓
RESEARCH READY                                                    Orchestrator → Agent (brief)
                                                              Orchestrator suggests 03_Communication
                                                                         ↓
ACTIVE DEAL                                      Agent showings, updates via Slack → Orchestrator
                                                              Routes updates to TC or Communicator
                                                                         ↓
OFFER SUBMITTED                                          Orchestrator → 04_TC (offer form link)
                                                                         ↓
OFFER ACCEPTED                                    Orchestrator detects trigger → stage: under_contract
                                                              04_TC activates deadline tracker
                                                                         ↓
DUE DILIGENCE                                        04_TC monitors deadlines → alerts via Orchestrator
                                                              Risk flags → Orchestrator → Agent + Diana
                                                                         ↓
CLOSING                                              04_TC generates closing package via Orchestrator
                                                                         ↓
CLOSED                                                    Orchestrator → stage: closed
                                                    03_Communication → post-close follow-up triggered
```

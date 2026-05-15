# 04_transaction_coordinator / handoff.md
> The Agency — AI Operating System
> Transaction Coordinator Handoff Protocol

---

## HOW I RECEIVE WORK

I receive work from the Orchestrator through three channels:

### 1. Stage transition trigger
When a deal transitions to `under_contract`, `due_diligence`, or `closing` the Orchestrator activates me automatically.

```yaml
from: "00_orchestrator"
to: "04_transaction_coordinator"
trigger_type: "stage_transition"
deal_id: "412"
deal_record: { ... full record including transaction block ... }
agent_profile: { agent_id: "marco", output_mode: "guided" }
property_record: { ... ATX-003 ... }
new_stage: "under_contract"
specific_event: "offer_accepted"
timestamp: "2026-05-13T17:30:00"
```

### 2. Agent request
Agent asks for deal status, document generation, or checklist.

```yaml
from: "00_orchestrator"
to: "04_transaction_coordinator"
trigger_type: "agent_request"
deal_id: "412"
deal_record: { ... }
agent_profile: { agent_id: "marco", output_mode: "guided" }
incoming_message: "generate purchase agreement #412-buyer"
detected_intent: "document_request"
document_requested: "purchase_agreement"
timestamp: "2026-05-14T10:00:00"
```

### 3. Automatic deadline monitor
Time-based. No agent trigger. I monitor all active deals continuously.

```yaml
from: "00_orchestrator"
to: "04_transaction_coordinator"
trigger_type: "deadline_monitor"
deal_id: "412"
deal_record: { ... }
agent_profile: { agent_id: "marco", output_mode: "guided" }
deadline_name: "Inspection Period Ends"
deadline_datetime: "2026-05-15T17:00:00"
hours_remaining: 47
timestamp: "2026-05-14T10:00:00"
```

---

## HOW I COMMUNICATE WITH OTHER SPECIALISTS

### TC → Lead Qualifier (data gap request)

When a required document field is missing from the deal record:

```yaml
from: "04_transaction_coordinator"
to: "01_lead_qualifier"
via: "00_orchestrator"
request_type: "data_gap_resolution"
deal_id: "412"
document_blocked: "purchase_agreement"
missing_fields:
  - field: "client.email"
    required_for: "purchase_agreement"
    priority: "blocking"
resolution_options:
  - "extract_from_conversation"
  - "trigger_buyer_contact_form"
timestamp: "2026-05-14T10:05:00"
```

**Lead Qualifier responds:**
```yaml
from: "01_lead_qualifier"
to: "04_transaction_coordinator"
via: "00_orchestrator"
status: "resolved" | "form_required"
resolved_fields:
  - field: "client.email"
    value: "chen.family@email.com"
    source: "agent_provided_via_slack"
form_link: null   # populated if form_required
```

### TC → Client Communicator (risk flag / document notification)

When a TC event requires client communication:

```yaml
from: "04_transaction_coordinator"
to: "03_client_communication"
via: "00_orchestrator"
trigger_type: "risk_flag"
deal_id: "412"
situation_type: "appraisal_gap"
facts:
  appraised_value: 589000
  contracted_price: 612000
  gap: 23000
  contingency_deadline: "2026-05-20"
  days_remaining: 5
agent_profile: { ... elena full profile ... }
request: "draft client options message in Elena's voice"
```

### TC → Property Research (appraisal support)

```yaml
from: "04_transaction_coordinator"
to: "02_property_research"
via: "00_orchestrator"
request_type: "appraisal_support"
deal_id: "412"
property_id: "ATX-003"
contracted_price: 612000
appraised_value: 589000
gap: 23000
contingency_deadline: "2026-05-20"
request: "pull comparable sales to support $612k contracted value"
```

---

## WHAT I PRODUCE AND RETURN TO ORCHESTRATOR

### Deadline Alert Output
```yaml
from: "04_transaction_coordinator"
to: "00_orchestrator"
status: "alert_delivered"
deal_id: "412"
alert_type: "deadline_48hr"
deadline_name: "Inspection Period Ends"
deadline_datetime: "2026-05-15T17:00:00"
hours_remaining: 47
documents_ready: ["inspection_response_draft"]
suggested_next: "client_communication"
agent_message: "Inspection deadline tomorrow 5pm Elena. Draft response ready."
escalation_required: false
```

### Document Ready Output
```yaml
from: "04_transaction_coordinator"
to: "00_orchestrator"
status: "document_ready"
deal_id: "412"
document_type: "purchase_agreement"
doc_id: "412-002"
all_fields_populated: true
fields_populated:
  - { field: "buyer_name", value: "Robert & Maria Chen", source: "deal_record" }
  - { field: "property_address", value: "2219 Bluebonnet Lane...", source: "deal_record" }
  - { field: "purchase_price", value: "$612,000", source: "deal_record" }
  - { field: "earnest_money", value: "$12,000", source: "form_submission" }
  - { field: "closing_date", value: "May 28, 2026", source: "form_submission" }
optional_fields_blank: ["special_provisions"]
confirmation_required: true
agent_message: "Purchase Agreement ready for review. All fields populated.
                One optional field (special provisions) left blank — add if applicable."
```

### Risk Flag Output
```yaml
from: "04_transaction_coordinator"
to: "00_orchestrator"
status: "risk_flagged"
deal_id: "412"
risk_type: "appraisal_gap"
urgency: "high"
facts:
  appraised_value: 589000
  contracted_price: 612000
  gap: 23000
  contingency_deadline: "2026-05-20T17:00:00"
  days_remaining: 5
options_presented: 3
documents_ready: []
suggested_next:
  - "property_research_appraisal_support"
  - "client_communication_appraisal_gap"
escalation_required: false
diana_notified: false
agent_message: "Appraisal gap $23,000 flagged on #412-buyer.
                Decision needed by May 19. Comps brief and client message ready."
```

### Status Report Output
```yaml
from: "04_transaction_coordinator"
to: "00_orchestrator"
status: "status_delivered"
deals_reported: ["412", "327", "089", "201"]
urgent_items:
  - { deal_id: "412", issue: "inspection_deadline_tomorrow" }
  - { deal_id: "412", issue: "appraisal_gap_decision_needed" }
  - { deal_id: "201", issue: "wire_instructions_verify" }
agent_message: "3 urgent items across active deals. Full status above."
```

---

## FORM HANDOFF PROTOCOL

When a client-facing form is needed:

```
Step 1: TC identifies missing field and form type needed
Step 2: TC generates form link with deal context pre-loaded
Step 3: TC presents form link to agent via Slack:
        "Share this with [client name] to collect [what is needed]"
        "[APPROVE & COPY LINK]  [PREVIEW FORM]  [NOT NOW]"
Step 4: Agent approves
Step 5: Agent shares link via their preferred channel (text/email via 03_communicator)
Step 6: Client submits form
Step 7: Data routes to Lead Qualifier → deal record updated
Step 8: Lead Qualifier notifies TC: "[field] now in deal record"
Step 9: TC proceeds with blocked document generation
```

**Sara review requirement:**
All client-facing forms for Sara require Diana or Elena approval before the link is shared. System flags this automatically when `review_required: true` in Sara's profile.

---

## STAGE ACTIVATION CHECKLIST

### On under_contract activation:
- [ ] Offer submission form complete and confirmed
- [ ] All contingency deadlines calculated and entered
- [ ] Earnest money deadline flagged (usually 3-5 days)
- [ ] Buyer/seller checklist activated
- [ ] Escrow and title company confirmed in deal record
- [ ] Cooperating agent contact confirmed
- [ ] Document generation sequence initiated:
  - Purchase Agreement (if not already executed)
  - Earnest Money Receipt

### On due_diligence activation:
- [ ] Inspection scheduled — confirm date and inspector
- [ ] Appraisal ordered by lender — confirm ETA
- [ ] Inspection deadline monitoring heightened
- [ ] All contingency deadlines confirmed
- [ ] Risk monitoring active

### On closing activation:
- [ ] All contingencies confirmed cleared
- [ ] Closing Disclosure delivery confirmed (3-day rule for buyers)
- [ ] Final walkthrough scheduled
- [ ] Wire instructions form sent to client (if not already collected)
- [ ] Wire instructions verification reminder flagged
- [ ] Closing checklist activated
- [ ] All required documents confirmed in deal vault

---

## HANDOFF FAILURE MODES

| Situation | Response |
|---|---|
| Offer submission form not submitted after offer accepted | Alert agent: "Need contract terms to activate deadline tracker. Form link here." |
| Data gap cannot be resolved by Lead Qualifier | TC presents form options to agent. Blocks document generation until resolved. |
| Agent does not acknowledge 24-hour deadline alert | Escalate to Diana immediately. |
| Document confirmation not received within 4 hours of generation | Re-alert agent. Log in activity log. |
| Client form not submitted within 48 hours of link sent | Alert agent: "Form not yet submitted by [client name]. May need a follow-up." |
| Stage transition confirmation not received | Hold at current stage. Alert agent: "Confirm deal transition to [new stage] when ready." |

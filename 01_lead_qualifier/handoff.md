# 01_lead_qualifier / handoff.md
> The Agency — AI Operating System
> Lead Qualifier Handoff Protocol

---

## HOW I RECEIVE WORK

I receive work from the Orchestrator in two ways:

### 1. From a Slack message
The Orchestrator detects a new lead signal and routes the raw message to me with a context package.

**Context package I receive:**
```yaml
from: "00_orchestrator"
agent_profile:
  agent_id: "marco"
  name: "Marco"
  output_mode: "guided"
  side_specialty: "both"
incoming_message: "just got off the phone with David Lara..."
detected_intent: "new_buyer_lead"
routing_reason: "Keywords: 'looking to buy', 'budget', 'pre-approved'. No existing deal tag."
form_data: null
timestamp: "2026-05-13T10:15:00"
```

### 2. From a form submission
The Orchestrator receives a form submission notification and routes the structured data to me for processing and confirmation gate presentation.

**Context package I receive:**
```yaml
from: "00_orchestrator"
agent_profile:
  agent_id: "carlos"
  name: "Carlos"
  output_mode: "operational"
incoming_message: "new listing"
detected_intent: "new_seller_lead"
routing_reason: "Keyword: 'new listing'. Form submission received."
form_data:
  client_name: "Patricia & James Hoffman"
  property_address: "2847 Exposition Blvd, Austin TX 78704"
  target_price: 725000
  ... (all form fields)
timestamp: "2026-05-13T11:30:00"
```

---

## WHAT I PRODUCE

### Before Confirmation — Draft Deal Record
A structured draft following `_catalog/schema.md`. Presented to agent at confirmation gate. Not yet a real deal record.

### After Confirmation — Confirmed Deal Record
The complete data object that every other specialist depends on.

**Full output package I send to Orchestrator:**

```yaml
from: "01_lead_qualifier"
to: "00_orchestrator"
status: "deal_confirmed"           # deal_confirmed | draft_pending | needs_clarification

deal_id: "412"                     # Assigned by Orchestrator on confirmation
side: "buyer"
stage: "confirmed"
confirmed_by: "elena"
confirmed_at: "2026-05-13T09:44:00"

deal_record:
  deal_id: "412"
  side: "buyer"
  stage: "confirmed"
  slack_channel: "#412-buyer"
  agent:
    agent_id: "elena"
    output_mode: "operational"
  client:
    name: "Robert & Maria Chen"
    email: ""                      # Missing — flagged
    phone: ""                      # Missing — flagged
    type: "buyer"
    origin: "referral"
    relocation: true
    relocation_from: "Chicago, IL"
  buyer_profile:
    pre_approved: true
    pre_approval_amount: 625000
    lender_name: "First Republic"
    budget_min: 450000
    budget_max: 650000
    target_neighborhoods: ["Travis Heights", "South Congress"]
    timeline_days: 60
    must_haves: ["yard", "garage", "3 bedrooms minimum"]
    deal_breakers: ["HOA over $300/mo"]
    properties_viewed: []
  activity_log:
    - timestamp: "2026-05-13T09:42:00"
      actor: "lead_qualifier"
      action: "Deal record created from Slack message"
    - timestamp: "2026-05-13T09:44:00"
      actor: "elena"
      action: "Deal record confirmed"

missing_fields:
  - field: "client.email"
    required_for: "document_generation"
    priority: "high"
  - field: "client.phone"
    required_for: "document_generation"
    priority: "high"

suggested_next: "property_research"

sop_context:
  sop_step_complete: 2
  sop_next_step: 3
  next_specialist_needed: "02_property_research"
  output_ready: true

agent_message: "Deal #412-buyer created for the Chens. Travis Heights brief incoming.
                Add email and phone when you have them — needed before documents generate."

documents_ready:
  - name: "Buyer Representation Agreement"
    status: "template_ready"
    note: "Will generate once email and phone are captured"
```

---

## WHAT HAPPENS AFTER I HAND OFF

The Orchestrator receives my output and:

1. **Creates the deal record** in the system catalog
2. **Creates the Slack channel** (#412-buyer)
3. **Posts deal summary** to the new channel
4. **Triggers 02_property_research** automatically with the confirmed deal record
5. **Notifies the agent** with deal ID, channel link, and any missing field reminders
6. **Updates the dashboard** — deal appears in Diana's active deals view

I am not involved in steps 1–6. My work ends when the confirmed deal record is delivered to the Orchestrator.

---

## WHAT I HAND TO EACH SPECIALIST (INDIRECTLY VIA ORCHESTRATOR)

### To 02_property_research
The confirmed buyer profile drives the initial research brief:
```yaml
relevant_fields:
  - buyer_profile.target_neighborhoods
  - buyer_profile.budget_min
  - buyer_profile.budget_max
  - buyer_profile.must_haves
  - buyer_profile.deal_breakers
  - buyer_profile.timeline_days
  - client.relocation (true/false — affects tone of neighborhood brief)
```

For seller deals, the property record drives the CMA:
```yaml
relevant_fields:
  - property.address
  - property.neighborhood
  - property.attributes (beds, baths, sqft, year_built)
  - property.pricing.target_price
```

### To 03_client_communication
The client profile and lead source drive the first outreach tone:
```yaml
relevant_fields:
  - client.name
  - client.type (buyer/seller)
  - client.origin (referral vs cold — affects warmth of first message)
  - client.relocation (true/false — affects what to include in welcome)
  - agent_profile (full — drives voice and tone)
```

### To 04_transaction_coordinator
The deal record becomes the TC's source of truth for the entire transaction:
```yaml
relevant_fields:
  - deal_id
  - side
  - client (full)
  - buyer_profile or seller_profile (full)
  - assigned_agent
  - documents (checklist initialized here)
```

---

## ONGOING ROLE — RECORD UPDATES

My work does not fully end at deal creation. I handle updates to the deal record throughout the deal lifecycle when client information changes:

**Triggers for re-engagement:**
- Agent reports updated budget: "Chens can go up to 700 on #412-buyer"
- Agent reports updated timeline: "Lara pushed to 120 days #089-buyer"
- Agent captures missing fields: "got David's email and phone #089-buyer"
- Agent corrects captured data: "it's Maria Chen not Mary #412-buyer"

**Update protocol:**
1. Orchestrator routes update message to me
2. I identify the field change
3. I present the change for confirmation:
   > "Updating #412-buyer budget maximum from $650,000 to $700,000. Confirm?"
4. Agent confirms
5. I update the deal record and log the change in activity_log
6. Return updated record to Orchestrator

---

## HANDOFF FAILURE MODES

| Situation | What I do |
|---|---|
| Agent does not confirm draft within 24 hours | Flag to Orchestrator — reminder sent to agent |
| Form submitted with missing required fields | Return incomplete form to agent with fields highlighted — do not process |
| Agent sends conflicting data for existing deal | Flag conflict, present both versions, ask agent to confirm which is correct |
| Agent tries to confirm a draft without required fields | Block confirmation — list exactly which fields must be resolved first |
| Duplicate lead detected (same client name + neighborhood) | Alert agent: "A deal record for [name] already exists (#ID). Is this the same client or a different one?" |

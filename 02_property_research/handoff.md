# 02_property_research / handoff.md
> The Agency — AI Operating System
> Property Research Handoff Protocol

---

## HOW I RECEIVE WORK

I receive all work from the Orchestrator. I never receive requests directly from agents.

### Standard Context Package I Receive

```yaml
from: "00_orchestrator"
to: "02_property_research"
agent_profile:
  agent_id: "elena"
  output_mode: "operational"
deal_record: { ... full deal record ... }
request_type: "neighborhood_brief"    # neighborhood_brief | cma | property_snapshot | market_update | appraisal_support
target: "Travis Heights"              # neighborhood name, zone, or property address
specific_context: "Buyer budget $450k-$650k, 3br minimum, yard, no HOA over $300"
trigger: "auto"                       # auto (post-deal-confirm) | agent_request | tc_flag
timestamp: "2026-05-13T10:20:00"
```

---

## HOW I COMMUNICATE WITH 05_LISTING_MANAGER

For any property-specific request I send a data request to the Listing Manager before generating output. This is an internal specialist-to-specialist communication — not visible to the agent.

### My request to Listing Manager:
```yaml
from: "02_property_research"
to: "05_listing_manager"
request: "property_record"
property_id: "ATX-003"               # or property address if ID unknown
deal_id: "412"
reason: "property_snapshot — pre-showing brief for deal #412-buyer"
timestamp: "2026-05-13T14:00:00"
```

### What Listing Manager returns:
```yaml
from: "05_listing_manager"
to: "02_property_research"
status: "found"                       # found | not_found
property_record: { ... full record from _catalog/properties/ATX-003.md ... }
```

### If property not found:
```yaml
status: "not_found"
message: "No record for ATX-003 or 2219 Bluebonnet Lane in catalog"
```

**My response when not found:**
I return to the Orchestrator immediately:
```yaml
status: "cannot_complete"
reason: "Property not in catalog"
message_to_agent: "2219 Bluebonnet Lane is not in the property catalog yet.
                   The Listing Manager needs to create the record before
                   I can generate a brief. Tag the Listing Manager or
                   use 'new listing' to add it."
```

---

## WHAT I PRODUCE AND RETURN TO ORCHESTRATOR

### Neighborhood Brief Output
```yaml
from: "02_property_research"
to: "00_orchestrator"
status: "brief_ready"
deal_id: "412"
brief_type: "neighborhood_brief"
zones_covered: ["travis_heights"]
data_date: "May 2026"
brief_content: { ... full formatted brief ... }
suggested_next: "client_communication"
sop_context:
  sop_step_complete: 3
  sop_next_step: 4
  next_specialist_needed: "05_listing_manager"
  output_ready: true
agent_message: "Travis Heights brief ready for the Chens.
                Want me to draft a welcome email with the key highlights?"
flags: []
```

### Property Snapshot Output
```yaml
from: "02_property_research"
to: "00_orchestrator"
status: "brief_ready"
deal_id: "412"
brief_type: "property_snapshot"
property_id: "ATX-003"
data_date: "May 2026"
brief_content: { ... full formatted brief ... }
suggested_next: null                  # agent is going to a showing — no immediate next action
agent_message: "Property brief ready for 2219 Bluebonnet.
                Key signal: motivated seller, price reduced, prior deal fell through.
                Negotiating room likely."
flags:
  - type: "opportunity"
    detail: "Motivated seller + price reduction + failed prior deal = negotiating leverage"
```

### CMA Report Output
```yaml
from: "02_property_research"
to: "00_orchestrator"
status: "brief_ready"
deal_id: "327"
brief_type: "cma"
property_id: "ATX-002"
data_date: "May 2026"
brief_content: { ... full formatted CMA ... }
suggested_next: "client_communication"
agent_message: "CMA ready for Hoffman listing. $725k is defensible — do not go higher.
                Want me to draft the listing presentation intro for Carlos?"
flags:
  - type: "pricing_risk"
    detail: "Above $740k enters failure-rate territory for this zone. Hold at $725k."
```

### Appraisal Support Output
```yaml
from: "02_property_research"
to: "00_orchestrator"
status: "brief_ready"
deal_id: "412"
brief_type: "appraisal_support"
property_id: "ATX-003"
brief_content: { ... comps support brief ... }
suggested_next: "client_communication"
agent_message: "Appraisal support brief ready. Contract price defensible at $612k.
                Also have a draft message ready for the Chens explaining their options."
flags:
  - type: "appraisal_gap"
    detail: "Gap $23,000. Contract defensible against comps. Elena to work with appraiser directly."
    disclaimer: "Catalog comps only — not a formal appraisal rebuttal."
```

---

## TRIGGER MAP — WHEN I AM ACTIVATED

| Trigger | Source | Brief Type |
|---|---|---|
| New buyer deal confirmed | Orchestrator (auto) | Neighborhood brief for target zone(s) |
| New seller deal confirmed | Orchestrator (auto) | CMA for listing pricing |
| Agent: "research [zone]" | Orchestrator (agent request) | Neighborhood brief |
| Agent: "comps for [address]" | Orchestrator (agent request) | CMA |
| Agent: "pull up [address]" | Orchestrator (agent request) | Property snapshot |
| Agent: "before showing [address]" | Orchestrator (agent request) | Property snapshot |
| TC: appraisal gap flagged | Orchestrator (TC flag) | Appraisal support brief |
| Agent: "market update" | Orchestrator (agent request) | General market + zone summary |
| Buyer criteria updated | Orchestrator (record update) | Updated neighborhood brief if zone changed |

---

## WHAT I PASS TO DOWNSTREAM SPECIALISTS

I do not directly trigger other specialists. I return my output to the Orchestrator with a `suggested_next` field. The Orchestrator decides whether to act on the suggestion.

### Typical downstream suggestions:

**After neighborhood brief:**
→ Suggest 03_client_communication for welcome message or buyer search summary

**After CMA:**
→ Suggest 03_client_communication for listing presentation intro (seller side)

**After property snapshot:**
→ No immediate downstream trigger — agent is preparing for a showing

**After appraisal support:**
→ Suggest 03_client_communication for client options message (appraisal gap situation)

---

## HANDOFF FAILURE MODES

| Situation | My Response |
|---|---|
| Neighborhood file not found | Return to Orchestrator: "No neighborhood file for [zone]. Monthly research update needed." |
| Property not in catalog | Return to Orchestrator: "Property not in catalog. Listing Manager must create record first." |
| Data older than 35 days | Include data currency warning in brief. Do not block output. |
| Insufficient comps for CMA | State clearly in CMA: "Comparable sales data is limited for this property type and price range. The pricing range below is based on [N] comps and should be treated as directional." |
| Appraisal support request with no catalog comps | Return: "Catalog does not have sufficient comparable sales to support a comps brief for this gap. Agent should work directly with the appraiser." |

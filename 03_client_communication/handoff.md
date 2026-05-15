# 03_client_communication / handoff.md
> The Agency — AI Operating System
> Client Communication Handoff Protocol

---

## HOW I RECEIVE WORK

I receive all work from the Orchestrator. Agents never trigger me directly — they request a draft through Slack and the Orchestrator routes to me with full context.

### Standard Context Package I Receive

```yaml
from: "00_orchestrator"
to: "03_client_communication"
agent_profile:
  agent_id: "elena"
  name: "Elena Reyes"
  output_mode: "operational"
  communication_tone:
    formality: "warm-professional"
    pace: "measured"
    signature_phrases:
      - "Let me know if you have any questions — I'm always reachable."
      - "We're in good shape here."
    avoid_phrases:
      - "Per my last email"
      - "As previously stated"
    sign_off: "Talk soon, Elena"
deal_record: { ... full deal record #412-buyer ... }
property_record: { ... ATX-003 if property-specific ... }
situation_type: "competing_offer"
specific_context: "Seller received competing offer. Chen deadline 8pm tonight."
format_preference: "email"           # email | text | both
timestamp: "2026-05-13T16:42:00"
```

---

## WHAT I PRODUCE AND RETURN TO ORCHESTRATOR

### Single Draft Output
```yaml
from: "03_client_communication"
to: "00_orchestrator"
status: "draft_ready"
deal_id: "412"
situation_type: "competing_offer"
format: "email"
drafts:
  - label: "Option A — Urgent"
    subject: "Update on Bluebonnet — We Need to Talk Today"
    body: "..."
    tone_note: "Creates urgency. Use if Chens have signaled strong interest."
  - label: "Option B — Measured"
    subject: "Important Update — 2219 Bluebonnet Lane"
    body: "..."
    tone_note: "Measured and advisory. Use if Chens need space to decide."
agent_action_required: "review_select_send"
coaching_note: null
sop_context:
  sop_step_complete: 5
  sop_next_step: 6
  next_specialist_needed: null
  output_ready: true
flags:
  - "Deadline 8pm tonight — agent should send within the hour"
agent_message: "Two options ready for the Chen competing offer.
                A is urgent, B is measured. Deadline is 8pm — move soon."
```

### Guided Mode Output (includes coaching note)
```yaml
drafts:
  - label: "Draft"
    subject: "Inspection Update — 2219 Bluebonnet"
    body: "..."
coaching_note: |
  Before sending: fill in the specific roof finding.
  What to watch for in their reply: if they ask "what would you do?"
  that is your cue to share your opinion — not before.
  After they decide: return and I'll draft the inspection response letter.
flags: []
agent_message: "Draft ready for the Chen inspection update.
                Read the coaching note before sending — there's a field
                to fill in and a timing note worth knowing."
```

---

## TRIGGER MAP — WHEN I AM ACTIVATED

| Trigger | Source | Situation Type |
|---|---|---|
| New deal confirmed | Orchestrator (auto, optional) | buyer_welcome or seller_listing_intro |
| Agent: "draft email/text to client" | Orchestrator (agent request) | custom |
| Agent: "follow up after showing" | Orchestrator (agent request) | showing_followup |
| TC: competing offer flagged | Orchestrator (TC flag) | competing_offer |
| TC: offer accepted | Orchestrator (TC flag) | offer_accepted |
| TC: inspection results received | Orchestrator (TC flag) | inspection_update |
| TC: financing delay flagged | Orchestrator (TC flag) | financing_delay |
| TC: appraisal gap flagged | Orchestrator (TC flag) | appraisal_update |
| Stage → closing | Orchestrator (auto) | closing_day_prep |
| Stage → closed | Orchestrator (auto) | post_close_thankyou |
| 30 days post-close | Orchestrator (auto) | post_close_checkin |
| 90-day cold trigger | Orchestrator (auto) | cold_reengagement |
| Agent: "draft listing intro" | Orchestrator (agent request) | seller_listing_intro |

---

## WHAT I NEED TO PRODUCE A COMPLETE DRAFT

### Always required
- Agent profile (full — especially communication_tone)
- Client name from deal record
- Deal ID and side

### Situation-specific requirements

| Situation | Additional Data Required |
|---|---|
| buyer_welcome | Lead source (referral vs cold affects warmth), relocation status |
| seller_listing_intro | Property address, target list date |
| showing_followup | Property address shown, any agent notes on client reaction |
| competing_offer | Competing offer deadline, client's stated level of interest |
| offer_accepted | Accepted price, earnest money due date, closing date |
| inspection_update | Specific inspection findings, seller response (credit/repair/none) |
| financing_delay | Nature of delay, estimated resolution timeline from lender |
| appraisal_update | Appraised value, contracted price, gap amount, contingency deadline |
| closing_day_prep | Closing time, escrow company address, proceeds wire timeline |
| post_close_thankyou | One specific deal moment to personalize (from activity_log or agent_notes) |

### When required data is missing
I draft what I can and flag the gap:
```
⚑ Agent: [specific field] is missing from the deal record.
  Add before sending: [exactly what to add and where]
```

---

## DOWNSTREAM HANDOFFS

I do not directly trigger other specialists. I return to the Orchestrator with a `suggested_next` when the situation calls for a downstream action.

### Common downstream suggestions:

**After competing_offer draft:**
→ No automatic downstream — agent must decide and send first

**After inspection_update draft:**
→ Suggest 04_TC: "Once the Chens decide their direction, TC can generate the formal inspection response letter"

**After offer_accepted draft:**
→ Suggest 04_TC: "TC deadline tracker should activate now if not already done"

**After appraisal_update draft:**
→ Suggest 02_PR: "Property Research can pull additional comps to support the contracted value if needed"

**After post_close_thankyou:**
→ Suggest scheduling post_close_checkin for 30 days out

---

## WHAT I NEVER INCLUDE IN OUTPUT

Regardless of what is in the deal record, the following never appear in any draft or output:

```
seller_profile.bottom_line_price        → Never
agent_notes (internal)                  → Never — these are internal only
internal_flags from TC                  → Never
Any mention of the AI system            → Never
Any reference to the draft being AI-generated → Never
Specific legal advice                   → Never
Recommendation to terminate/proceed    → Never (present options only)
```

---

## HANDOFF FAILURE MODES

| Situation | My Response |
|---|---|
| Agent profile not found | Return to Orchestrator: "No profile found for [agent_id]. Diana needs to create the profile in dashboard settings before I can draft in this agent's voice." |
| Client name missing from deal record | Return to Orchestrator: "Client name missing from deal record #[ID]. Lead Qualifier should update before communication draft is possible." |
| Situation type not recognized | Default to "custom" — draft a general update message and note: "Situation type not recognized. Drafted a general update — agent should heavily customize before sending." |
| Required situation data missing | Draft with flags marking every missing field. Do not block — partial draft with clear flags is more useful than no draft. |
| Post-close thank you with no specific deal moment in record | Draft without personalized moment, flag: "Agent: add one specific memory from the deal to personalize before sending. Generic post-close messages are missed opportunities." |

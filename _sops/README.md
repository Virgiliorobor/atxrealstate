# _sops / README.md
> The Agency — Standard Operating Procedures
> How SOPs work with the Orchestrator

---

## WHAT SOPS ARE

SOPs are the Orchestrator's playbooks. When the Orchestrator detects a workflow that matches a SOP, it loads that SOP file and follows the step sequence exactly — rather than improvising the next action.

SOPs define:
- What triggers the workflow
- Which specialist handles each step
- What the expected output is at each step
- What the Orchestrator does between steps
- When the SOP is complete

---

## HOW THE ORCHESTRATOR USES SOPS

```
1. Incoming message detected
2. Orchestrator checks: does this match a SOP trigger?
3. If yes → load the SOP file
4. Write to database: sop.active_sop, sop.current_step = 1
5. Execute Step 1 → route to specialist with SOP context injected
6. Specialist completes step → returns output with sop_step_complete
7. Orchestrator logs event → updates database sop.current_step
8. Orchestrator reads SOP → executes next step
9. Repeat until SOP complete
10. Write to database: sop.completed_at
```

Every step goes through the Orchestrator. Specialists never communicate directly. Every hop is logged to the database event log.

---

## THE SOP CONTEXT BLOCK

Every context package the Orchestrator sends to a specialist includes:

```json
"sop_context": {
  "active_sop": "sop_01_new_lead",
  "current_step": 3,
  "total_steps": 6,
  "step_description": "Property Research generates neighborhood brief",
  "next_step": 4,
  "next_specialist": "05_listing_manager"
}
```

Every output a specialist returns includes:

```json
"sop_context": {
  "sop_step_complete": 3,
  "sop_next_step": 4,
  "next_specialist_needed": "05_listing_manager",
  "output_ready": true
}
```

The Orchestrator reads `sop_step_complete`, logs the event, and routes to `next_specialist_needed`.

---

## THE FIVE SOPS

| File | SOP | Trigger |
|---|---|---|
| `sop_01_new_lead.md` | New Lead Intake and Buyer Brief | New buyer or seller lead reported |
| `sop_02_follow_up.md` | Lead Follow-Up | Automatic daily check or agent command |
| `sop_03_offer_received.md` | Offer Received | Agent reports offer on active listing |
| `sop_04_weekly_digest.md` | Weekly Active Deal Digest | Automatic Monday 8am |
| `sop_05_listing_live.md` | Listing Goes Live | Agent confirms listing ready to publish |

---

## NON-SOP REQUESTS

Not every agent message matches a SOP. Single requests — `brief ATX-003`, `draft inspection #412-buyer`, `status #327-seller` — are handled by the Orchestrator's standard routing logic without loading a SOP.

SOPs are for multi-step workflows that chain multiple specialists in a defined sequence.

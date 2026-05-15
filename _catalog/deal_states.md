# _catalog / deal_states.md
> The Agency — AI Operating System
> Deal State Reference — Shared Infrastructure
> Read by: All specialists. Owned by: Orchestrator.

---

## PURPOSE

This file defines every possible state a deal can be in, what triggers entry into that state, what each specialist does when a deal is in that state, and what triggers the transition to the next state.

The Orchestrator is the only specialist that writes to deal state. All other specialists read it to understand their role at each stage.

---

## STATE MAP

```
draft
  └─→ confirmed
        └─→ active
              └─→ under_contract
                    └─→ due_diligence
                          └─→ closing
                                └─→ closed
              └─→ cold          (from any stage)
```

---

## STATE DEFINITIONS

---

### DRAFT
**What it means:** Lead has been received. Data has been extracted from agent message or form. Deal record has been generated but not yet confirmed by the agent.

**Entered when:** Lead Qualifier completes extraction from Slack message or form submission.

**Exited when:** Agent confirms the deal record at the confirmation gate → moves to `confirmed`
OR Agent discards the draft → record deleted, no deal created.

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Holds deal in draft state. Presents confirmation gate to agent. Waits. |
| Lead Qualifier | Generated the draft. Available to re-extract if agent requests edits. |
| Property Research | Not yet active. |
| Client Communication | Not yet active. |
| Transaction Coordinator | Not yet active. |

**Duration:** Should not exceed 24 hours. If draft is unconfirmed after 24 hours, Orchestrator sends a reminder to the agent.

**Slack channel:** Not yet created. Communication happens in agent DM.

---

### CONFIRMED
**What it means:** Agent has reviewed and confirmed the deal record. All required fields are verified. The deal is real and the system is ready to support it.

**Entered when:** Agent clicks confirm at the confirmation gate. Orchestrator creates the deal record, assigns the deal ID, creates the Slack channel (#[ID]-[side]).

**Exited when:**
- Agent begins active property search (buyer) or property is listed on MLS (seller) → moves to `active`
- Deal falls apart before going active → moves to `cold`

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Creates deal record. Creates Slack channel. Posts deal summary. Triggers Property Research for initial brief. |
| Lead Qualifier | Generates intake documents: Buyer Representation Agreement (buyer) or begins Listing Agreement prep (seller). |
| Property Research | Triggered automatically. Generates initial neighborhood brief (buyer) or CMA (seller). |
| Client Communication | On standby. Suggested after research brief delivered. Drafts welcome message if requested. |
| Transaction Coordinator | Not yet active. Monitors for transition to active. |

**Duration:** Typically 1–5 days while initial research and client outreach are prepared.

**Slack channel:** Active. All deal communication flows here.

---

### ACTIVE
**What it means:** The deal is live. A buyer is actively searching and viewing properties, or a seller's property is listed on the market and receiving showings.

**Entered when:**
- Buyer side: Agent confirms active search has begun, first showing scheduled
- Seller side: Property listed on MLS, confirmed by agent

**Exited when:**
- Offer submitted and accepted → moves to `under_contract`
- Search paused or listing expires without offer → moves to `cold`

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Routes showing updates, feedback, and search refinements to correct specialist. Tracks days on market (seller). |
| Lead Qualifier | Available for updates to buyer criteria if search parameters change. |
| Property Research | On demand. Generates property snapshots before showings. Updates neighborhood brief if search area shifts. |
| Client Communication | Active. Drafts showing follow-ups, weekly updates to clients, responses to client questions. |
| Transaction Coordinator | Monitors. Not fully active but ready. Tracks showing count (seller side). Flags if days on market exceeds market average. |

**Key triggers while active:**
- "showing today at [address]" → Property Research generates property snapshot
- "feedback from showing" → Client Communication drafts follow-up summary for client
- "price reduction" (seller) → Orchestrator flags to TC, Client Communication drafts price reduction notice
- "offer coming in" → TC put on standby, Client Communication prepares response options

**Duration:** Highly variable. Days to months.

**Slack channel:** Active. High frequency of messages during this stage.

---

### UNDER_CONTRACT
**What it means:** An offer has been accepted. Both parties have signed the Purchase Agreement. Escrow is open. The deal is legally in motion.

**Entered when:** Agent reports offer accepted. Orchestrator triggers offer submission form if not already submitted. Agent confirms transaction terms. Orchestrator updates stage.

**Exited when:**
- All contingencies satisfied, closing date confirmed → moves to `closing`
- Deal falls apart during contract period (financing fails, inspection terminates) → moves to `cold`

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Updates stage. Notifies all parties. Posts to dashboard. Triggers TC to activate full deadline tracker. |
| Lead Qualifier | Not active. |
| Property Research | On standby. Re-engaged if appraisal risk requires additional comps. |
| Client Communication | Active. Drafts status updates, responds to client questions about the process. |
| Transaction Coordinator | FULLY ACTIVE. Activates deadline tracker. Generates document checklist. Monitors all contingency deadlines. Begins document generation sequence. |

**Documents activated at this stage:**
- Residential Purchase Agreement (if not already executed)
- Earnest Money Receipt
- Transaction deadline calendar
- Buyer/Seller checklist

**TC deadline tracker activates for:**
- Earnest money due date
- Inspection period end date
- Appraisal deadline
- Loan commitment deadline
- Final walkthrough date
- Closing date

**Duration:** Typically 21–45 days in Austin market.

**Slack channel:** High activity. TC alerts and document notifications flow here.

---

### DUE_DILIGENCE
**What it means:** The inspection and appraisal phase is underway. Contingency deadlines are active. Risk is highest at this stage — deals most commonly fall apart here.

**Entered when:** Inspection is ordered. Orchestrator transitions stage from `under_contract` to `due_diligence` when agent reports inspection scheduled or inspection report received.

**Exited when:**
- All contingencies cleared or waived → moves to `closing`
- Buyer terminates under inspection or appraisal contingency → moves to `cold`
- Financing falls through → moves to `cold`

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Routes all inspection and appraisal updates to TC. Escalates risk flags immediately. |
| Lead Qualifier | Not active. |
| Property Research | Re-engaged if appraisal comes in below offer price — pulls additional comps to support value or inform renegotiation. |
| Client Communication | Active. Drafts inspection response options for client. Drafts renegotiation requests. Keeps client informed throughout. |
| Transaction Coordinator | PRIMARY. Monitors all deadlines with heightened urgency. Flags risks immediately. Generates inspection response, repair addenda, appraisal gap documents as needed. |

**Risk flags TC monitors at this stage:**
- Inspection deadline within 48 hours with no response submitted
- Appraisal below offer price (appraisal gap)
- Lender requesting additional documentation (financing risk)
- Repair requests unresolved near deadline
- Cooperating agent unresponsive

**Duration:** Typically 10–21 days.

**Slack channel:** Highest urgency stage. TC alerts may be frequent.

---

### CLOSING
**What it means:** All contingencies have been satisfied or waived. The deal is clear to close. Final steps are underway before deed recording.

**Entered when:** Agent reports all contingencies cleared. TC confirms checklist: financing approved, appraisal satisfied, inspection resolved, all documents executed.

**Exited when:**
- Deed recorded, keys exchanged → moves to `closed`
- Last-minute deal failure (rare but possible) → moves to `cold`

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Updates stage. Posts to dashboard. TC generates closing package. |
| Lead Qualifier | Not active. |
| Property Research | Not active. |
| Client Communication | Active. Drafts closing day instructions for client. Coordinates communication with escrow/title. |
| Transaction Coordinator | PRIMARY. Generates closing checklist. Confirms wire instructions verified. Confirms walkthrough scheduled. Tracks closing disclosure delivery. Confirms deed recording. |

**Final closing checklist items (TC tracks all):**
- Closing Disclosure delivered and reviewed (3-day rule for buyer)
- Final walkthrough scheduled and completed
- Wire instructions verified with title company (fraud prevention flag)
- Loan documents signed
- Closing funds wired
- Keys and access codes collected (seller) or received (buyer)
- Deed recorded with county

**Duration:** Typically 3–7 days from clear to close.

**Slack channel:** Lower volume but high precision. No room for error.

---

### CLOSED
**What it means:** The deal is done. Deed is recorded. Keys are exchanged. The transaction is complete.

**Entered when:** Agent confirms deed recorded. TC marks all checklist items complete. Orchestrator updates stage to `closed`.

**Exited when:** Does not exit. Closed is terminal. Deal record is archived.

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Updates stage to closed. Archives deal record. Posts completion to dashboard. Removes from active deals view. Triggers post-close follow-up. |
| Lead Qualifier | Not active. |
| Property Research | Not active. Property record updated to `sold` status in catalog. |
| Client Communication | Triggered automatically. Drafts post-close thank you and 30-day check-in. Drafts referral request (optional, Diana setting). |
| Transaction Coordinator | Final document package archived in deal vault. Generates transaction summary for Diana's records. |

**Post-close actions:**
- Thank you message to client (drafted by Client Communication, sent by agent)
- 30-day check-in scheduled (Client Communication)
- Property record updated to sold with final sale price
- Deal summary posted to dashboard

**Duration:** Terminal state. Record retained indefinitely.

---

### COLD
**What it means:** The deal is no longer active. Lead went quiet, listing expired, inspection terminated, financing failed, or buyer/seller walked away. The deal did not close.

**Entered from:** Any stage. Can go cold from draft, confirmed, active, under_contract, due_diligence, or closing.

**Entered when:** Agent explicitly marks deal cold OR TC detects: listing expired, contract terminated, contingency not met and deadline passed.

**Who does what:**

| Specialist | Action |
|---|---|
| Orchestrator | Updates stage to cold. Removes from active dashboard. Archives in cold deals view. Notifies Diana. |
| All specialists | Suspend active monitoring. Deal record retained. |
| Client Communication | Optional: drafts a re-engagement message for agent to send if appropriate (not automatic). |

**Cold deals are never deleted.**
- Available for reactivation if circumstances change
- Used for market reporting and team performance tracking
- Agent can reactivate at any time: "reactivate #089-buyer" → Orchestrator returns deal to `confirmed` stage for agent review

**Re-engagement trigger:**
If a cold deal has been inactive for 90 days and the client's original timeline has not passed, Orchestrator sends a reminder to the agent:
> "Deal #089-buyer (David Lara) has been cold for 90 days. His original 90-day timeline is still active. Want me to draft a re-engagement message?"

---

## QUICK REFERENCE TABLE

| State | Entered When | Primary Specialist | TC Active | Duration |
|---|---|---|---|---|
| draft | Lead extracted | Orchestrator + LQ | No | < 24 hrs |
| confirmed | Agent confirms | Orchestrator + PR | No | 1–5 days |
| active | Search/listing live | PR + CC | Monitoring | Days to months |
| under_contract | Offer accepted | TC | YES — full | 21–45 days |
| due_diligence | Inspection ordered | TC + CC | YES — urgent | 10–21 days |
| closing | All contingencies cleared | TC + CC | YES — precision | 3–7 days |
| closed | Deed recorded | CC (post-close) | Archive | Terminal |
| cold | Deal falls apart | Orchestrator | Suspended | Indefinite |

---

*File: _catalog/deal_states.md*
*Owned by: Orchestrator*
*Read by: All specialists*
*Update protocol: Any change to stage definitions requires review by Diana*

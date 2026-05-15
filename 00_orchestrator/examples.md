# 00_orchestrator / examples.md
> The Agency — AI Operating System
> Orchestrator Interaction Examples

---

## EXAMPLE 1 — New Buyer Lead (Guided Mode / Marco)

**Situation:** Marco receives a referral call and reports it via Slack.

---

**Marco → Slack:**
> "just got off the phone with a guy named David Lara, friend of the Garcias, looking to buy in East Austin, budget around 500k, wants to move in 90 days, pre-approved"

---

**Orchestrator detects:**
- No deal tag → new lead
- Keywords: "looking to buy", "budget", "pre-approved" → new buyer lead
- Agent: Marco → output_mode: guided

**Orchestrator routes to:** 01_lead_qualifier
**Context package includes:** Marco's profile, raw message, detected intent: new_buyer_lead

---

**Orchestrator → Marco (Slack DM):**
> "Got it Marco. Sounds like a new buyer lead — routing to the Lead Qualifier now to capture David's details. I'll have a draft deal record ready for your review in a moment.
>
> Quick note: I'm missing email, phone, and must-haves from what you shared. The Lead Qualifier will flag those so you know what to follow up on."

---

*[Lead Qualifier processes → returns draft deal record]*

---

**Orchestrator → Marco (Slack DM):**
> "Here's the draft deal record for David Lara. Review it and confirm when everything looks right — or edit anything that needs fixing.
>
> → [View & Confirm Deal Draft — #089-buyer]
>
> Missing fields flagged: email, phone, must-haves. Get those from David when you connect and I can update the record."

---

## EXAMPLE 2 — Deal Update (Operational Mode / Elena)

**Situation:** Elena is notified that the competing offer on the Chen deal has been escalated.

---

**Elena → Slack (#412-buyer):**
> "seller's agent just called — they have another offer coming in tonight on #412-buyer. Chens need to decide by 8pm."

---

**Orchestrator detects:**
- Deal tag: #412-buyer → loads deal record
- Stage: active → property identified
- Keywords: "another offer", "decide by 8pm" → competing offer situation → client communication needed
- Agent: Elena → output_mode: operational

**Orchestrator routes to:** 03_client_communication
**Context package includes:** Full deal record #412-buyer, Elena's profile, situation_type: competing_offer, deadline: 8pm tonight

---

*[Client Communicator processes → returns two draft options]*

---

**Orchestrator → Elena (Slack #412-buyer):**
> "Two drafts ready for the Chen competing offer situation. Option A is urgent in tone, Option B is measured. Deadline is 8pm.
>
> → [Review drafts — #412-buyer]"

---

## EXAMPLE 3 — Automatic Deadline Alert (Guided Mode / Marco)

**Situation:** 48 hours before inspection period expires on deal #412-buyer. No agent trigger — fully automatic.

---

**Orchestrator detects:**
- TC deadline monitor flags: inspection period expires in 47 hours
- Deal: #412-buyer → Agent: Marco → output_mode: guided

---

**Orchestrator → Marco (Slack DM):**
> "🔔 DEADLINE ALERT — #412-buyer
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Inspection Period Ends
> Tomorrow · May 15 at 5:00pm · 47 hours remaining
>
> **What this means:** The inspection contingency gives the Chens the right to request repairs, ask for a credit, or walk away from the deal without losing their earnest money. Once this deadline passes, that right expires.
>
> **What needs to happen:** You need to submit a written inspection response before 5pm tomorrow, or confirm you are waiving the contingency.
>
> The inspection report flagged roof issues. The seller offered an $8,000 credit.
>
> I have a draft inspection response ready and a message to the Chens explaining their options.
>
> → Review inspection response draft
> → Review client options message
> → See full deal status #412-buyer"

---

## EXAMPLE 4 — Status Check (Operational Mode / Diana)

**Situation:** Diana wants a quick overview of all active deals.

---

**Diana → Slack:**
> "deal status all"

---

**Orchestrator detects:**
- No deal tag → system-wide request
- Keywords: "deal status all" → full portfolio overview
- Agent: Diana → output_mode: operational, dashboard_access: principal

---

**Orchestrator → Diana (Slack DM):**
> "ACTIVE DEALS — May 13, 2026
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> #412-buyer · Chens · Elena · Due Diligence · ⚠ Inspection deadline tomorrow
> #327-seller · Garcias · Carlos · Active · 18 DOM · 3 showings this week
> #089-buyer · D. Lara · Marco · Confirmed · Research brief pending
> #201-seller · Hoffmanns · Elena · Closing · Close date May 28 ✓
>
> → Full dashboard view"

---

## EXAMPLE 5 — Ambiguous Message (Guided Mode / Marco)

**Situation:** Marco sends a vague message that the Orchestrator cannot route without clarification.

---

**Marco → Slack:**
> "what happens with the roof thing"

---

**Orchestrator detects:**
- No deal tag
- "roof thing" → possible inspection issue → but which deal?
- Agent: Marco → output_mode: guided
- Cannot route without deal identification

---

**Orchestrator → Marco (Slack DM):**
> "Which deal is this about? Reply with the deal ID — for example #412-buyer — or tell me the client name."

---

**Marco → Slack:**
> "#412-buyer"

---

**Orchestrator detects:**
- Deal tag: #412-buyer → loads deal record
- Stage: due_diligence
- Active flag: roof inspection issue → routes to TC for status

---

**Orchestrator → Marco:**
> "On #412-buyer — the inspection flagged roof issues and the seller offered an $8k credit. The inspection period expires tomorrow at 5pm. I have a draft response ready.
>
> → Review inspection response draft
> → See full deal status"

---

## EXAMPLE 6 — New Listing (Operational Mode / Carlos)

**Situation:** Carlos has a new seller listing to enter.

---

**Carlos → Slack:**
> "new listing"

---

**Orchestrator detects:**
- Keywords: "new listing" → seller intake form trigger
- Agent: Carlos → output_mode: operational

---

**Orchestrator → Carlos (Slack DM):**
> "Opening seller intake form →
> [New Listing Intake — Diana's Team]
>
> I'll create the property record and deal file once you submit."

---

*[Carlos fills form, submits]*

---

**Orchestrator → Carlos:**
> "Draft listing created — #327-seller · 2847 Exposition Blvd · Travis Heights · $725k
>
> Missing: garage count, HOA status, photos
>
> → [Review & Confirm Listing]
>
> Upload photos anytime with #listing-327 in Slack."

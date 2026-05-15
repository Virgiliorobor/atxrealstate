# THE AGENCY — Demo UI Update Spec
> Addendum to DEMO_UI_SPEC.md
> Focus: Onboarding page + channel intent + guided chips

---

## WHAT THIS ADDS

Two things:
1. An onboarding screen before the chat — explains the system to judges
2. Per-channel intent — each channel demonstrates a distinct workflow with clickable command chips

---

## 1. ONBOARDING SCREEN

A full-page screen that appears before the chat interface. Judge reads it, clicks Enter Demo, lands in the chat.

**Purpose:** Give judges context before they interact. Without this, they see a Slack UI with no explanation of why or what to do.

**Content — three sections:**

### What This Is
"The Agency is an AI operating system for a boutique real estate team in Austin, TX. Six AI specialists work together — orchestrator, lead qualifier, property research, client communication, transaction coordinator, and listing manager — to handle every part of the transaction workflow without a CRM."

### Why It Works Like Slack
"Diana's team does not want another platform to learn. The entire system operates through a chat interface — the same way her team already communicates. In production this runs in real Slack. This demo simulates that experience in a browser so you can interact with the live system without any setup."

### Three Things to Try
Three cards — one per channel:

**Card 1 — #team-general**
New Lead Intake
"Type naturally about a new buyer. The system extracts, structures, and creates a deal record."
Command chip: `new buyer`

**Card 2 — #412-buyer**
Active Deal Management
"The Chen deal is live at due_diligence stage with an appraisal gap and inspection issue."
Command chip: `status #412-buyer`

**Card 3 — #327-seller**
Listing Intelligence
"The Hoffman listing is active at 28 DOM with no offer. Pull market data and a property brief."
Command chip: `comps travis_heights`

**CTA:** Single button — "Enter Demo →"

---

## 2. CHANNEL INTENT — SIDEBAR UPDATES

Each channel in the sidebar gets a subtitle showing its current state:

```
#team-general
New lead intake →

#412-buyer
Chen · Due diligence · ⚠ 2 flags

#327-seller
Hoffman · Active · 28 DOM
```

---

## 3. WELCOME MESSAGE PER CHANNEL

Each channel shows a different welcome message when selected. Not one generic message for all three.

**#team-general**
```
You are Marco Reyes (guided mode — system explains as it works).

This channel is for new business. Try starting a lead intake:

[new buyer]  [new seller]  [help]

The system will extract structured data from your natural language,
confirm it with you, create a deal record, and trigger research automatically.
```

**#412-buyer**
```
Chen deal · $612,000 · Travis Heights · Due diligence stage

Two active risk flags:
⚠ Appraisal gap — $23,000 below contract price
⚠ Inspection response — pending resolution

[status #412-buyer]  [deadlines #412-buyer]  [draft inspection #412-buyer]

This deal is pre-loaded with real data. Every command returns
live AI responses based on the actual deal record.
```

**#327-seller**
```
Hoffman listing · $725,000 · Travis Heights · 28 DOM · No offer yet

Price review threshold approaching. Market context available.

[comps travis_heights]  [brief ATX-016]  [status #327-seller]

Pull neighborhood data, property snapshots, and draft client updates.
```

---

## 4. COMMAND CHIPS

Chips appear in two places:
- Below the welcome message in each channel (pre-interaction)
- As suggested follow-ups after certain bot responses

**Chip behavior:**
- Click → auto-fills the input field → sends immediately
- Not just fill — send. Removes one step for judges.

**Follow-up chips after key responses:**

After `status #412-buyer` returns:
```
[draft inspection #412-buyer]  [deadlines #412-buyer]
```

After `new buyer` flow creates a deal:
```
[brief east_austin]  [search #[new_deal_id]]
```

After `comps travis_heights` returns:
```
[brief ATX-016]  [draft seller_update #327-seller]
```

---

## 5. INTENDED OUTCOMES PER CHANNEL

### #team-general flow
```
new buyer
  → system asks for buyer details
  → judge types: "Sarah Johnson, 550k, East Austin, 60 days, pre-approved"
  → Lead Qualifier structures and confirms
  → Deal record created
  → East Austin brief auto-triggers
  → Activity log shows full SOP 01 chain
```

### #412-buyer flow
```
status #412-buyer
  → TC loads deal from JSON
  → Returns: stage, risk flags, deadlines, document status
  → Activity log shows: TC activated, risk flags detected

draft inspection #412-buyer
  → Client Communication activates
  → Loads Elena's voice profile
  → Returns inspection response draft as formatted card
  → Activity log shows: CC activated, profile loaded, template populated
```

### #327-seller flow
```
comps travis_heights
  → Property Research activates
  → Loads travis_heights.md
  → Returns CMA brief with real market data
  → Activity log shows: PR activated, neighborhood file loaded

brief ATX-016
  → Property Research requests record from Listing Manager
  → Returns property snapshot with internal signals flagged
  → Activity log shows: LM data request, record loaded, snapshot assembled
```

---

## WHAT THIS PROVES TO JUDGES

Three channels. Three different specialists activated. Three different output types:
- A structured deal record (lead intake)
- A risk-flagged status report (active deal)
- A market intelligence brief (listing)

All from the same underlying folder system. All logged in real time. The architecture is visible, not just described.

---

## 6. OPEN ENTRY — `#open-entry` (Principal sandbox)

A fourth channel for **Diana Castellano** (principal): not the guided Marco demo. Free-form questions — strategy, system design, cross-deal, hypotheticals. Context loads `diana.yaml` / `diana.md` instead of Marco; no deal JSON is attached unless the user references a deal in text. UI labels user messages as the principal in this channel.

---

## NOTE ON ATX-003 vs ATX-016

All references in welcome messages, chips, and system context use ATX-016 (Bluebonnet Lane — the Chen deal property). ATX-003 is a separate catalog listing. Do not mix them.

---

*Spec Version: 1.2 — Addendum to DEMO_UI_SPEC.md*
*Build both specs together as one cohesive demo*

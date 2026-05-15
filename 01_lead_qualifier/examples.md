# 01_lead_qualifier / examples.md
> The Agency — AI Operating System
> Lead Qualifier Interaction Examples

---

## EXAMPLE 1 — New Buyer Lead from Conversation (Guided Mode / Marco)

**Situation:** Marco takes a referral call and reports it to the system via Slack.

---

**Marco → Slack:**
> "just got off the phone with David Lara, referred by the Garcia family. He's looking to buy in East Austin, budget somewhere around 500k, wants to be in a place within 90 days. He mentioned he's pre-approved but didn't say for how much. Seems motivated."

---

**Lead Qualifier extracts:**
```
client_name:           David Lara
lead_source:           referral (Garcia family)
side:                  buyer
target_neighborhoods:  East Austin
budget_max:            $500,000 (approximate)
timeline_days:         90
pre_approved:          yes (amount unknown)
assigned_agent:        marco
```

**Missing required fields:**
- pre_approval_amount — stated pre-approved but amount not given
- budget_min — not stated
- client_email — not captured
- client_phone — not captured
- must_haves — not stated
- deal_breakers — not stated

---

**Lead Qualifier → Marco (Slack DM):**

> **DEAL DRAFT — New Buyer Lead**
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>
> Here's what I captured from your call with David Lara:
>
> **Client:** David Lara (referral — Garcia family)
> **Side:** Buyer
> **Target:** East Austin
> **Budget:** ~$500,000
> **Timeline:** 90 days
> **Pre-approved:** Yes — amount not captured yet
> **Agent:** Marco
>
> **Missing — collect from David before next contact:**
> ⚠ Pre-approval amount and lender name — important for offer credibility
> ⚠ Email and phone — needed before any documents can generate
> ⚠ Must-haves — helps filter properties so you're not showing him things that won't work
> ⚠ Deal-breakers — same reason, saves everyone time
> ⚠ Budget minimum — helps define the search range clearly
>
> **What happens after you confirm:**
> I'll create deal #089-buyer, open the #089-buyer Slack channel, and trigger a research brief on East Austin matched to David's budget. You'll also get a draft Buyer Representation Agreement ready when you need it.
>
> [CONFIRM & CREATE DEAL]　[EDIT FIELDS]　[ADD MISSING INFO]

---

**Marco → Slack:**
> "confirm"

---

**Lead Qualifier → Orchestrator:**
```yaml
status: "deal_confirmed"
deal_id: "089"
side: "buyer"
stage: "confirmed"
agent_id: "marco"
missing_fields: ["pre_approval_amount", "lender_name", "email", "phone", "must_haves", "deal_breakers", "budget_min"]
suggested_next: "property_research"
agent_message: "Deal #089-buyer created for David Lara. East Austin brief incoming. Collect his email, phone, and pre-approval amount when you connect — you'll need those before submitting any offer."
```

---

## EXAMPLE 2 — New Buyer Lead from Conversation (Operational Mode / Elena)

**Situation:** Elena has a new buyer lead — out-of-state relocators.

---

**Elena → Slack:**
> "new buyers — Robert and Maria Chen, relocating from Chicago. Looking in Travis Heights or South Congress, budget 450 to 650, pre-approved at 625 through First Republic. Need to close in 60 days. They have to have a yard and garage, no HOA over 300 a month. Referral from my client the Nguyens."

---

**Lead Qualifier extracts:**
```
client_name:             Robert & Maria Chen
lead_source:             referral (Nguyen family)
side:                    buyer
target_neighborhoods:    Travis Heights, South Congress
budget_min:              $450,000
budget_max:              $650,000
pre_approved:            yes
pre_approval_amount:     $625,000
lender_name:             First Republic
timeline_days:           60
must_haves:              yard, garage
deal_breakers:           HOA over $300/mo
relocation:              true (from Chicago, IL)
assigned_agent:          elena
```

**Missing fields:**
- client_email — not stated
- client_phone — not stated
- bedrooms minimum — implied but not stated

---

**Lead Qualifier → Elena (Slack DM):**

> **DEAL DRAFT — #412-buyer**
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Robert & Maria Chen · Buyer · Relocating Chicago
> Travis Heights / South Congress · $450k–$650k · 60 days
> Pre-approved $625k · First Republic
> Must-haves: yard, garage · No HOA >$300
> Referral: Nguyen family · Agent: Elena
>
> Missing: email, phone, bedroom minimum
>
> [CONFIRM]　[EDIT]　[ADD MISSING INFO]

---

**Elena → Slack:**
> "confirm, 3br minimum"

---

**Lead Qualifier → Elena:**
> "Deal #412-buyer created — the Chens. Travis Heights brief on the way. Add email and phone when you have them."

---

## EXAMPLE 3 — New Seller Listing via Form (Operational Mode / Carlos)

**Situation:** Carlos triggers a new listing via Slack keyword. System sends form link. Carlos submits form.

---

**Carlos → Slack:**
> "new listing"

---

**Orchestrator → Carlos:**
> "Opening seller intake form →
> [New Listing Intake]
> I'll create the property record once you submit."

---

*[Carlos completes and submits form with all fields]*

---

**Lead Qualifier receives form submission:**
```
client_name:          Patricia & James Hoffman
client_email:         hoffmans@email.com
client_phone:         512-555-0188
property_address:     2847 Exposition Blvd, Austin TX 78704
neighborhood:         Travis Heights
zone:                 travis_heights
property_type:        Single Family Residence
year_built:           1971
bedrooms:             3
bathrooms_full:       2
bathrooms_half:       0
square_feet:          1820
acres:                0.18
stories:              1
garages:              1
hoa_monthly:          0
target_price:         $725,000
bottom_line_price:    [SECURE FIELD — stored, not displayed]
seller_motivation:    relocating
target_list_date:     2026-05-20
timeline:             60 days to close
features_interior:    hardwood floors, updated kitchen, original tile baths
features_exterior:    mature oak trees, large covered porch, detached garage
assigned_agent:       carlos
```

**Missing fields:** none — form complete

---

**Lead Qualifier → Carlos (Slack DM):**

> **LISTING DRAFT — #327-seller**
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Patricia & James Hoffman
> 2847 Exposition Blvd · Travis Heights · $725,000
> 3br / 2ba · 1,820sqft · 1971 · 1 garage · No HOA
> List date: May 20 · Timeline: 60 days · Motivation: Relocating
> Agent: Carlos
>
> All required fields complete. Ready to create.
>
> [CONFIRM & CREATE LISTING]　[EDIT]

---

**Carlos → Slack:**
> "confirmed"

---

**Lead Qualifier → Orchestrator:**
```yaml
status: "deal_confirmed"
deal_id: "327"
side: "seller"
stage: "confirmed"
agent_id: "carlos"
property_id: "ATX-002"
missing_fields: []
suggested_next: "property_research"
agent_message: "Listing #327-seller created — Hoffman property, 2847 Exposition Blvd. CMA incoming. Upload photos anytime with #listing-327 in Slack. Exclusive Right to Sell Agreement ready for your review."
```

---

## EXAMPLE 4 — Inconsistent Financial Data (Guided Mode / Marco)

**Situation:** Marco reports a lead with conflicting budget and pre-approval figures.

---

**Marco → Slack:**
> "new buyer, Jennifer Walsh, looking under 400k in East Austin, pre-approved for 520k"

---

**Lead Qualifier detects inconsistency:**
- budget_max stated: $400,000
- pre_approval_amount stated: $520,000
- Gap: $120,000 — significant. Client may be searching conservatively or may have updated their ceiling.

---

**Lead Qualifier → Marco:**

> **DEAL DRAFT — New Buyer Lead**
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> **Client:** Jennifer Walsh
> **Target:** East Austin · Under $400,000
> **Pre-approved:** Yes — $520,000
>
> ⚠ **Budget conflict to clarify with Jennifer:**
> She mentioned searching under $400k but is pre-approved for $520k.
> This is common — clients often search below their approval ceiling.
> Before confirming, it helps to know:
> Is $400k her firm ceiling, or is she open to going higher for the right property?
> This affects how I set up her search profile and what properties the system surfaces.
>
> **Missing:** email, phone, must-haves, deal-breakers
>
> [CONFIRM AS $400K MAX]　[UPDATE BUDGET]　[EDIT ALL FIELDS]

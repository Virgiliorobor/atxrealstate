# 05_listing_manager / examples.md
> The Agency — AI Operating System
> Listing Manager Interaction Examples

---

## EXAMPLE 1 — New Listing Record Created (Operational Mode / Carlos)

**Situation:** Carlos submitted the seller intake form for 2847 Exposition Blvd. Lead Qualifier confirmed the property record. Listing Manager receives confirmed record.

---

**Lead Qualifier → Orchestrator → Listing Manager:**
```yaml
event: "property_record_confirmed"
property_id: "ATX-002"
deal_id: "327"
agent_id: "carlos"
confirmed_record:
  address: "2847 Exposition Blvd, Austin TX 78704"
  neighborhood: "Travis Heights"
  list_price: 725000
  bedrooms: 3
  bathrooms_full: 2
  square_feet: 1820
  year_built: 1971
  garages: 1
  hoa_monthly: 0
  features_interior: ["hardwood floors", "updated kitchen", "original tile baths"]
  features_exterior: ["mature oak trees", "large covered porch", "detached garage"]
  target_list_date: "2026-05-20"
```

---

**Listing Manager creates catalog record ATX-002.**
**Listing Manager → Carlos (Slack DM):**

> **Listing ATX-002 Created — 2847 Exposition Blvd**
> Travis Heights · $725,000 · 3br/2ba · 1,820sqft
>
> **Missing before MLS entry:**
> ⚠ Photos — upload when ready with `#listing-327` in Slack
> ⚠ Listing description narrative — I have a draft headline, narrative needed
>
> **Ready now:**
> → [Listing Input Sheet — download for MLS entry]
>
> **Next step:**
> Upload photos and I'll generate the listing page for Diana's approval.
> Target list date is May 20 — 7 days from today.

---

## EXAMPLE 2 — Photo Upload and Listing Page Generation (Carlos)

**Situation:** Carlos uploads photos for the Hoffman listing.

---

**Carlos → Slack (#327-seller):**
> "Photos for Hoffman listing, just had them done today #listing-327"
> *[12 photos attached]*

---

**Listing Manager processes 12 photos:**
- Assigns to ATX-002
- Generates sequential names: ATX002_001.jpg through ATX002_012.jpg
- Designates ATX002_001.jpg as hero image candidate

---

**Listing Manager → Carlos (Slack DM):**

> **12 photos received for ATX-002 — Hoffman listing**
>
> Processing complete. Photo gallery sent to Diana for ordering and hero selection.
> I'll generate the listing page draft once she confirms the photo order.
>
> Expect the page draft in Diana's approval queue within the hour.

---

**Listing Manager → Diana (Dashboard — Pending Approvals):**

> **NEW LISTING PAGE DRAFT — ATX-002**
> 2847 Exposition Blvd · Travis Heights · $725,000
> 3br / 2ba · 1,820 sqft · 1971 · 1 garage · No HOA
>
> 12 photos uploaded. Please select hero image and confirm photo order.
>
> **Page content:**
> Headline: "Character Bungalow in the Heart of Travis Heights — Original Details, Updated Kitchen"
> Neighborhood context: Travis Heights profile loaded ✓
> Agent: Carlos Mendoza
>
> [PREVIEW FULL PAGE]
> [SELECT HERO PHOTO]
> [REORDER GALLERY]
> [APPROVE & PUBLISH]
> [EDIT CONTENT]
> [HOLD]

---

## EXAMPLE 3 — Property Data Request from Property Research

**Situation:** Property Research needs the full record for ATX-003 (2219 Bluebonnet) before a showing brief for deal #412-buyer.

---

**Property Research → Orchestrator → Listing Manager:**
```yaml
from: "02_property_research"
request: "property_record"
property_id: "ATX-003"
reason: "property_snapshot for deal #412-buyer pre-showing brief"
```

---

**Listing Manager → Property Research:**
```yaml
status: "found"
property_record:
  property_id: "ATX-003"
  address: "2219 Bluebonnet Lane, Austin TX 78704"
  neighborhood: "Travis Heights"
  status: "active"
  list_price: 629000
  days_on_market: 34
  bedrooms: 3
  bathrooms_full: 2
  square_feet: 1510
  year_built: 1968
  garages: 1
  hoa_monthly: 0
  features_interior: ["original hardwood floors", "updated kitchen", "open living area"]
  features_exterior: ["fenced yard", "covered porch", "mature oak trees"]
  price_history:
    - date: "2026-04-09"
      price: 649000
      event: "listed"
    - date: "2026-05-01"
      price: 629000
      event: "reduced"
  agent_notes: "Sellers motivated — job relocation. Prior offer fell through at financing."
  internal_flag: "agent_notes field is INTERNAL — do not surface in client-facing outputs"
```

---

## EXAMPLE 4 — Price Change Update (Carlos)

**Situation:** Carlos wants to reduce the Hoffman listing price from $725,000 to $710,000 after 28 days on market with no offers.

---

**Carlos → Slack (#327-seller):**
> "Let's drop the Hoffman price to 710, market isn't biting at 725 #327-seller"

---

**Orchestrator → Listing Manager:** Price change request detected.

---

**Listing Manager → Carlos (Slack DM):**

> **Price Change Request — ATX-002**
> 2847 Exposition Blvd · Travis Heights
>
> Current price: $725,000
> Requested price: $710,000
> Change: -$15,000 (-2.1%)
> DOM at change: 28 days
>
> [CONFIRM PRICE CHANGE]　[CANCEL]
>
> Once you confirm I'll queue the update for Diana's approval.
> Website and MLS will update after she approves.

---

**Carlos → Slack:** "confirm"

---

**Listing Manager updates ATX-002 price history:**
```yaml
price_history:
  - date: "2026-05-01"
    price: 725000
    event: "listed"
  - date: "2026-05-29"
    price: 710000
    event: "reduced"
```

**Listing Manager → Diana (Dashboard — Pending Approvals):**

> **PRICE CHANGE — ATX-002**
> 2847 Exposition Blvd · Travis Heights
> $725,000 → $710,000 · DOM: 28 days
> Requested by: Carlos
>
> [APPROVE & UPDATE]　[REJECT]　[EDIT PRICE]

---

## EXAMPLE 5 — Property Status Change to Sold (Deal Closes)

**Situation:** Deal #412-buyer closes. Deed recorded. TC notifies Orchestrator. Listing Manager updates ATX-003.

---

**TC → Orchestrator → Listing Manager:**
```yaml
event: "deal_closed"
deal_id: "412"
property_id: "ATX-003"
final_sale_price: 612000
close_date: "2026-05-28"
```

---

**Listing Manager updates ATX-003:**
```yaml
status: "sold"
sold_price: 612000
sold_date: "2026-05-28"
days_on_market_final: 53
list_to_sale_ratio: 97.3%
```

**Listing Manager → Diana (Dashboard — Pending Approvals):**

> **STATUS UPDATE — ATX-003**
> 2219 Bluebonnet Lane · Travis Heights
> Active → Sold · $612,000 · Closed May 28
> DOM: 53 days · List-to-sale: 97.3%
>
> [APPROVE & UPDATE WEBSITE]　[HOLD]

---

## EXAMPLE 6 — Property Not Found (Property Research Request)

**Situation:** Marco asks for a brief on a property not yet in the catalog.

---

**Marco → Slack (#089-buyer):**
> "pull up 4401 Avenue F East Austin for David #089-buyer"

---

**Property Research → Listing Manager:** Requests ATX record for 4401 Avenue F.

**Listing Manager → Property Research:**
```yaml
status: "not_found"
message: "4401 Avenue F, East Austin not in catalog."
```

**Property Research → Orchestrator → Marco:**

> **4401 Avenue F is not in the property catalog yet.**
>
> To get a full brief I need a property record first.
>
> Two options:
> **Option A** — It's a listing you're considering for David:
> Use `new listing` to create a record and I'll generate a brief from it.
>
> **Option B** — It's an external listing you want research on:
> Share the MLS number or listing link and I'll pull what I can from
> the neighborhood data we have on East Austin.

---

## EXAMPLE 7 — Monthly Catalog Health Report (Diana)

**Situation:** First of the month — Listing Manager generates catalog health report.

---

**Listing Manager → Diana (Dashboard):**

> **CATALOG HEALTH REPORT — June 1, 2026**
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>
> **ACTIVE LISTINGS (3)**
> ATX-002 · 2847 Exposition Blvd · Travis Heights · $710,000 · 39 DOM
> ATX-005 · 891 Maple Ave · East Austin · $485,000 · 12 DOM
> ATX-007 · 3304 Greenbelt Dr · Barton Hills · $875,000 · 6 DOM
>
> **⚠ ATTENTION NEEDED**
> ATX-002 · 39 DOM without offer — Carlos price review recommended
>
> **SOLD IN MAY (2)**
> ATX-003 · 2219 Bluebonnet Lane · $612,000 · 97.3% list-to-sale · 53 DOM
> ATX-001 · 13513 Oystercatcher Dr · $471,000 · 98.1% list-to-sale · 18 DOM
>
> **MISSING FIELDS**
> ATX-007 · Virtual tour URL not added
> ATX-005 · HOA status not confirmed
>
> **WEBSITE STATUS**
> All active listings published ✓
> No pending approvals in queue ✓
>
> → [Full catalog view]

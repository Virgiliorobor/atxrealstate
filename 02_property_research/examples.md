# 02_property_research / examples.md
> The Agency — AI Operating System
> Property Research Interaction Examples

---

## EXAMPLE 1 — Neighborhood Brief, Buyer Side (Operational Mode / Elena)

**Situation:** Deal #412-buyer confirmed for the Chens. Orchestrator auto-triggers neighborhood brief. Budget $450k–$650k, Travis Heights and South Congress target, 60-day timeline, must-haves: yard, garage, 3br minimum, no HOA over $300.

---

**Orchestrator → Property Research (context package):**
```yaml
request_type: "neighborhood_brief"
deal_id: "412"
agent: "elena" / output_mode: "operational"
target_zones: ["travis_heights"]
buyer_profile:
  budget_min: 450000
  budget_max: 650000
  must_haves: ["yard", "garage", "3 bedrooms minimum"]
  deal_breakers: ["HOA over $300/mo"]
  timeline_days: 60
  relocation: true
  relocation_from: "Chicago, IL"
```

---

**Property Research → Orchestrator (output):**

```
TRAVIS HEIGHTS — BUYER BRIEF
Deal #412-buyer · Robert & Maria Chen · May 13, 2026
Data current as of: May 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MARKET POSITION
Median sale price: $855,000 (broader neighborhood)
Entry point for their budget: $615,000 (3/2, 1,329 sqft — Mission Ridge comp)
Price per sqft: $539–$602
Days on market: 27–79 days depending on sub-location
Sale-to-list ratio: 92.8–94% — buyers negotiating successfully

REALITY CHECK FOR $450k–$650k IN TRAVIS HEIGHTS
Inventory at their ceiling is limited. What exists at $650k and under:
— Smaller square footage (1,200–1,600 sqft typical)
— Original finishes or renovation-needed condition
— Possible condo or smaller lot configurations
— Unrenovated bungalows with renovation upside

The $615k Mission Ridge comp (3/2, 1,329 sqft) is the closest recent match to their criteria. That is the realistic baseline — not the $855k neighborhood median.

MUST-HAVE SCREENING
✓ Yard: available at this price range on single-family stock
✓ Garage: less common in older bungalow stock — verify per property
✓ 3br minimum: achievable but often at smaller square footage
⚠ HOA: most Travis Heights single-family is HOA-free — verify per listing

RECENT RELEVANT COMPS ($500k–$700k range)
1106 Mission Ridge (A) · 04/09/2026 · $615,000 · 3/2 · 1,329 sqft · $463/sqft
2100 Glendale Pl (A) · 04/17/2026 · $899,000 · 3/2 · 1,725 sqft · $521/sqft
(Note: above $700k — shown for context on what additional budget buys)

NEIGHBORHOOD FIT FOR RELOCATING CHICAGO BUYERS
Strong fit. Travis Heights delivers the walkable urban lifestyle that Chicago buyers
typically respond to. South Congress corridor, Lady Bird Lake trail, character homes.
Manage expectations on size per dollar — Chicago buyers expect more sqft at this price.

COMPETITIVE ENVIRONMENT
Not a bidding war market currently. 53.5% of listings fail (overpriced sellers).
Correctly priced homes sell. Buyers have negotiating room at 6–7% below list.
60-day timeline is achievable but leaves limited buffer if first choice doesn't work out.

TALKING POINTS FOR THE CHENS
— "Travis Heights is one of Austin's most walkable neighborhoods — genuinely car-light"
— "South Congress is at your doorstep — best of Austin's food and culture scene"
— "Lady Bird Lake trail access — running, cycling, paddleboarding minutes away"
— "At your budget you're looking at character bungalows — renovation opportunity, not a liability"
— "Current market gives you real negotiating room — 6-7% below list is realistic"
— "60 days is workable — not a lot of buffer, so let's prioritize your top properties early"
```

---

## EXAMPLE 2 — Property Snapshot Before Showing (Guided Mode / Marco)

**Situation:** Marco is taking the Chens to see 2219 Bluebonnet Lane tomorrow. Deal #412-buyer. Property is in the catalog as ATX-003.

---

**Marco → Slack (#412-buyer):**
> "pull up 2219 Bluebonnet for tomorrow's showing #412-buyer"

---

**Orchestrator → Property Research:**
```yaml
request_type: "property_snapshot"
deal_id: "412"
property_id: "ATX-003"
agent: "marco" / output_mode: "guided"
showing_date: "tomorrow"
```

**Property Research → 05_listing_manager:**
```
Request: property_record
Property ID: ATX-003
Reason: property_snapshot for deal #412-buyer pre-showing brief
```

**05_listing_manager → Property Research:**
```yaml
property_id: "ATX-003"
address: "2219 Bluebonnet Lane, Austin TX 78704"
neighborhood: "Travis Heights"
status: "active"
list_price: 629000
days_on_market: 34
bedrooms: 3
bathrooms_full: 2
bathrooms_half: 0
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
agent_notes: "Sellers motivated — job relocation. One prior offer fell through at financing."
```

---

**Property Research → Orchestrator (output):**

```
PROPERTY SNAPSHOT — 2219 Bluebonnet Lane
Deal #412-buyer · Marco · Showing Tomorrow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO USE THIS BRIEF
Read this before the showing. The key facts and the signals to watch for
are highlighted. Share what's relevant with the Chens — keep internal
notes (marked ⚑) to yourself.

THE PROPERTY
Address:      2219 Bluebonnet Lane, Austin TX 78704
Neighborhood: Travis Heights
List price:   $629,000 (reduced from $649,000 on May 1)
Status:       Active · 34 days on market
Size:         3br / 2ba · 1,510 sqft · 1 garage
Year built:   1968
HOA:          None ✓ (meets Chen deal-breaker criteria)
Lot:          Fenced yard ✓, covered porch, mature oak trees

MUST-HAVE CHECK vs. CHEN CRITERIA
✓ 3 bedrooms minimum       MEETS
✓ Yard                     MEETS — fenced, mature oaks
✓ Garage                   MEETS — 1 car
✓ HOA under $300/mo        MEETS — no HOA
✓ Not backing to highway   Verify at showing — not flagged in record

MARKET SIGNALS — READ CAREFULLY
⚑ Price reduced $20,000 after 23 days — seller is moving toward market
⚑ 34 days on market — above the 27-day neighborhood average — has not found a buyer yet
⚑ Prior offer fell through at financing — seller has been through a deal that didn't close
⚑ Sellers motivated — job relocation — they need to move, timeline pressure on their side

What this means: There is negotiating room here. A motivated seller with a price
reduction and a failed deal behind them is likely receptive to a serious offer below ask.
The Chens' pre-approval at $625k gives them credibility the prior buyer may have lacked.

NEIGHBORHOOD CONTEXT
Travis Heights sale-to-list ratio: 92.8–94%
At $629k list, comparable sale range suggests: $585k–$600k realistic offer range
Closest comp: 1106 Mission Ridge — $615k / 3/2 / 1,329 sqft (smaller)
This property is 181 sqft larger — slight premium justified

WHAT TO WATCH AT THE SHOWING
— Roof condition — 1968 build, ask about age and last inspection
— Kitchen update quality — listed as "updated" but verify scope and year
— Garage access and size — 1-car garage noted, confirm fit for their needs
— Street noise — Bluebonnet Lane proximity to South Congress, check weekend traffic
— Natural light — 1968 bungalows can run dark, assess east/west orientation

SUGGESTED QUESTIONS TO ASK THE LISTING AGENT
— "When was the roof last replaced?"
— "What's the sellers' ideal closing timeline?"
— "Was the prior offer issue on the buyer's side or the property?"

The last question tells you a lot. If the prior offer failed due to inspection issues,
that is material. If it was purely financing, the property is clean.
```

---

## EXAMPLE 3 — CMA Report, Seller Side (Operational Mode / Carlos)

**Situation:** Deal #327-seller confirmed — Hoffman property, 2847 Exposition Blvd, Travis Heights. Target price $725,000. Carlos needs CMA before listing presentation.

---

**Property Research → Orchestrator (output):**

```
CMA REPORT — 2847 Exposition Blvd
Deal #327-seller · Carlos · Pre-listing
Data current as of: May 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBJECT PROPERTY
2847 Exposition Blvd · Travis Heights · 78704
3br / 2ba · 1,820 sqft · 1971 · 1 garage · No HOA
Hardwood floors, updated kitchen, mature oak trees, covered porch

SELLER TARGET PRICE: $725,000
Price per sqft implied: $398/sqft

COMPARABLE SALES ANALYSIS

| Address | Sale Date | Price | Beds/Bath | SqFt | $/SqFt | DOM |
|---|---|---|---|---|---|---|
| 1506 Chelsea Ln | 04/20/2026 | $999,000 | 4/3 | 2,088 | $479 | — |
| 2100 Glendale Pl (A) | 04/17/2026 | $899,000 | 3/2 | 1,725 | $521 | — |
| 1106 Mission Ridge (A) | 04/09/2026 | $615,000 | 3/2 | 1,329 | $463 | — |

ADJUSTED ANALYSIS FOR SUBJECT PROPERTY
Subject (1,820 sqft) is larger than Mission Ridge (1,329 sqft) and similar to Glendale Pl (1,725 sqft).
Glendale Pl at $899k is the strongest comparable — same bed/bath, similar vintage, similar zone.
Subject has updated kitchen and larger sqft — slight premium over Glendale justified.

PRICING RANGE ASSESSMENT
Conservative: $680,000–$710,000 (Mission Ridge size-adjusted + market discount)
Market: $715,000–$740,000 (Glendale Pl comparable, updated features)
Optimistic: $750,000–$775,000 (Chelsea Ln adjusted down for 1 fewer bed)

SELLER TARGET VS. MARKET: $725,000
Positioned within the market range. Achievable if property presents well and
is priced to attract offers rather than test the ceiling.

⚠ PRICING RISK FLAG
Travis Heights listing failure rate: 53.5%
Overpricing spread in the zone: $118,020 between ask and sold per bedroom.
At $725k the property is correctly positioned. Any price above $740k
moves into territory where this property sits rather than sells.
Recommend: list at $725k, do not go higher.

DAYS ON MARKET EXPECTATION
At $725k correctly positioned: 18–35 days expected
If overpriced above $740k: 60+ days with likely price reduction required

LISTING RECOMMENDATION
List at: $725,000
Price per sqft: $398 — within zone range of $539-$602 on premium end;
subject's 1971 vintage and 1-car garage justify below-premium positioning.
```

---

## EXAMPLE 4 — Appraisal Support Brief (Operational Mode / Elena)

**Situation:** Chen deal #412-buyer. Property under contract at $612,000. Appraisal came in at $589,000. TC flagged appraisal gap of $23,000. Elena needs comps support.

---

**Property Research → Orchestrator (output):**

```
APPRAISAL SUPPORT BRIEF — #412-buyer
2219 Bluebonnet Lane · Contracted at $612,000 · Appraised at $589,000
Gap: $23,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTE: These are catalog comparables, not a formal appraisal rebuttal.
Use this as context for your conversation with the appraiser or lender.
A licensed appraiser must conduct any formal dispute.

COMPARABLES SUPPORTING $610k–$625k VALUE

| Address | Sale Date | Price | SqFt | $/SqFt | vs. Subject |
|---|---|---|---|---|---|
| 2100 Glendale Pl (A) | 04/17/2026 | $899,000 | 1,725 | $521 | Larger, same zone |
| 1106 Mission Ridge (A) | 04/09/2026 | $615,000 | 1,329 | $463 | Smaller, same zone |

SUBJECT PROPERTY DIFFERENTIATING FACTORS
— 1,510 sqft — 181 sqft larger than Mission Ridge comp ($615k sale)
— Updated kitchen — value-add above base bungalow condition
— Fenced yard with mature oaks — desirable feature in zone
— No HOA — positive for buyer pool and resale

VALUE ARGUMENT
Mission Ridge at $615k for 1,329 sqft ($463/sqft).
Subject at 1,510 sqft at the same rate implies $699k — well above contract.
At a more conservative $405/sqft (market discount for vintage): $611,550.
Contract price of $612,000 is defensible against comparable sales data.

APPRAISER TALKING POINT FOR ELENA
"The Mission Ridge comp at $615k was 181 sqft smaller with no noted kitchen
update. The subject's larger footprint and updated kitchen justify the
$612k contracted price within the same zone and same sales period."
```

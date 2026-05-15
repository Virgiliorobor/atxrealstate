# 05_listing_manager / handoff.md
> The Agency — AI Operating System
> Listing Manager Handoff Protocol

---

## HOW I RECEIVE WORK

I receive work through four channels:

### 1. New property record from Lead Qualifier
After agent confirms a new listing at the confirmation gate:

```yaml
from: "01_lead_qualifier"
to: "05_listing_manager"
via: "00_orchestrator"
event: "property_record_confirmed"
property_id: "ATX-002"
deal_id: "327"
agent_id: "carlos"
confirmed_record: { ... full property record ... }
timestamp: "2026-05-13T11:45:00"
```

### 2. Photo upload from agent via Slack
```yaml
from: "00_orchestrator"
to: "05_listing_manager"
event: "photo_upload"
agent_id: "carlos"
slack_message: "Photos for Hoffman listing #listing-327"
property_tag: "327"
photos: ["atx002_001.jpg", "atx002_002.jpg", ...]
photo_count: 12
timestamp: "2026-05-14T09:15:00"
```

### 3. Property data request from specialist
```yaml
from: "02_property_research" | "04_transaction_coordinator"
to: "05_listing_manager"
via: "00_orchestrator"
request: "property_record"
property_id: "ATX-003"
reason: "property_snapshot for deal #412-buyer"
timestamp: "2026-05-13T14:00:00"
```

### 4. Update request from agent or Orchestrator
```yaml
from: "00_orchestrator"
to: "05_listing_manager"
event: "property_update"
property_id: "ATX-002"
update_type: "price_change" | "status_change" | "field_update" | "photo_update"
agent_id: "carlos"
update_data: { list_price: 710000 }
timestamp: "2026-05-29T10:00:00"
```

---

## WHAT I PRODUCE AND RETURN

### Property Record Response (to specialists)
```yaml
from: "05_listing_manager"
to: "02_property_research" | "04_transaction_coordinator"
status: "found" | "not_found" | "draft_unconfirmed"
property_record:
  property_id: "ATX-003"
  address: "2219 Bluebonnet Lane, Austin TX 78704"
  neighborhood: "Travis Heights"
  zone: "travis_heights"
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
    - { date: "2026-04-09", price: 649000, event: "listed" }
    - { date: "2026-05-01", price: 629000, event: "reduced" }
  media:
    hero_image: "atx003_001.jpg"
    photo_count: 8
  agent_notes: "Sellers motivated — job relocation. Prior offer fell through at financing."
  internal_flag: "agent_notes is INTERNAL — never surface in client-facing outputs"
  listing_agent_id: "elena"
  data_confirmed: true
  last_updated: "2026-05-13T09:00:00"
```

### New Listing Confirmation Output (to Orchestrator)
```yaml
from: "05_listing_manager"
to: "00_orchestrator"
event: "listing_created"
property_id: "ATX-002"
deal_id: "327"
status: "confirmed"
missing_fields:
  - { field: "photos", blocking: "website_publication", priority: "high" }
  - { field: "description_narrative", blocking: "website_publication", priority: "high" }
listing_input_sheet: "ready_for_download"
website_status: "queued_pending_photos"
agent_message: "Listing ATX-002 created. Missing: photos and description narrative.
                Upload photos with #listing-327. Listing Input Sheet ready to download."
```

### Website Update Queue Output (to Diana dashboard)
```yaml
from: "05_listing_manager"
to: "diana_dashboard"
pending_approvals:
  - type: "new_listing"
    property_id: "ATX-002"
    preview_url: "/preview/atx-002"
    status: "ready_for_approval"
    agent: "carlos"
  - type: "price_change"
    property_id: "ATX-002"
    old_price: 725000
    new_price: 710000
    dom: 28
    status: "ready_for_approval"
    agent: "carlos"
```

### Status Change Notification (to Orchestrator)
```yaml
from: "05_listing_manager"
to: "00_orchestrator"
event: "property_status_changed"
property_id: "ATX-003"
old_status: "active"
new_status: "sold"
final_sale_price: 612000
close_date: "2026-05-28"
dom_final: 53
list_to_sale_ratio: 97.3
website_update: "queued_for_diana_approval"
```

---

## INTER-SPECIALIST HANDOFF MAP

```
INBOUND — who sends work to me:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
01_lead_qualifier    → New confirmed property records
00_orchestrator      → Photo uploads, update requests, agent messages
04_transaction_coord → Status change notifications (offer accepted, deal closed)
Diana (dashboard)    → Approval decisions, direct edits

OUTBOUND — who I send data to:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
02_property_research → Full property records on request
04_transaction_coord → Full property records on request
00_orchestrator      → Status change notifications, listing created events
Diana (dashboard)    → Website approval queue, catalog health reports, missing field alerts
Listing website      → Published listing pages (after Diana approval)
```

---

## LISTING WEBSITE GENERATION PROTOCOL

When a listing is ready to publish:

```
Step 1: Verify all blocking fields are present
        (photos, address, price, beds/baths, sqft, headline, narrative)

Step 2: Load property record from catalog

Step 3: Load neighborhood context from _catalog/neighborhoods/[zone].md

Step 4: Populate listing page template:
        — Hero image (first in approved photo order)
        — Property headline and narrative
        — Key attributes grid (beds, baths, sqft, year, garage, HOA)
        — Photo gallery (approved order)
        — Neighborhood story (from neighborhood file)
        — Agent card (Carlos profile — name, contact, personal note)
        — Contact form

Step 5: Generate preview link

Step 6: Queue in Diana's dashboard pending approvals

Step 7: Diana approves → page publishes to live website

Step 8: Log publication timestamp in property record
```

---

## FAILURE MODES

| Situation | Response |
|---|---|
| Property record not found | Return `not_found` status. Do not improvise. Notify requesting specialist and Orchestrator. |
| Photos uploaded without listing tag | Flag to Orchestrator: "Photos received without listing tag. Which listing do these belong to?" |
| Incoming data conflicts with confirmed field | Flag conflict to agent. Do not auto-resolve. Wait for agent confirmation. |
| Diana approval queue not actioned in 48 hours | Send reminder to Diana DM: "3 items pending approval in listing queue." |
| Website generation fails (missing blocking field) | Flag specific missing field to agent. Do not generate partial page. |
| Deal closed but property still shows active | Flag to Orchestrator: "ATX-003 status mismatch — deal #412 closed but property shows active. Confirm status update." |
| Agent requests data on unconfirmed draft record | Return `draft_unconfirmed`. Notify agent: "Record exists but is not yet confirmed. Complete confirmation before data is available." |

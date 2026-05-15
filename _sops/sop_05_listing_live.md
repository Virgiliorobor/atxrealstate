# SOP 05 — Listing Goes Live
> Trigger: Agent confirms listing ready to publish
> Specialists: Listing Manager → Orchestrator → Diana (approval) → Client Communication
> All routing through Orchestrator
> Database: sop.active_sop = "sop_05_listing_live" written at trigger

---

## TRIGGER CONDITIONS

The Orchestrator loads this SOP when it detects:
- Command: `publish [property_id]`
- Natural language: "ready to go live", "listing is ready", "publish the [address] listing"
- Listing Manager confirms: all required fields complete after photo upload

---

## STEP SEQUENCE

### STEP 1 — Listing Manager: Verify Completeness
```
Orchestrator → Listing Manager:
  Context: property_id, deal_id, agent profile,
           sop_context step 1

Listing Manager:
  → Runs required field check against property record:

  BLOCKING fields (must all be present):
    ✓ Minimum 3 photos uploaded
    ✓ Hero image designated
    ✓ Property address complete
    ✓ List price confirmed
    ✓ Bedrooms and bathrooms
    ✓ Square feet
    ✓ Listing headline
    ✓ Listing narrative (200+ words)

  NON-BLOCKING (flagged but not blocking):
    ○ Virtual tour URL
    ○ Open house dates
    ○ All interior/exterior features complete

If blocking fields missing:
  → Listing Manager → Orchestrator → Agent:
    "Cannot publish yet. Missing: [items].
     Upload photos: tag #listing-[property_id]
     Add narrative: reply with text or use dashboard."
  → SOP holds. Resumes when fields are added.

If all blocking fields present:
  → Listing Manager → Orchestrator:
      sop_step_complete: 1
      next_specialist_needed: "self"
      output: all_fields_verified, non_blocking_flags[]

Orchestrator:
  → Logs: EVT "listing_readiness_verified"
  → Updates database: sop.current_step = 2
```

### STEP 2 — Listing Manager: Generate Listing Page
```
Orchestrator → Listing Manager:
  Context: property record (confirmed, complete),
           sop_context step 2

Listing Manager:
  → Loads neighborhood context from
    _catalog/neighborhoods/[zone].md
  → Populates listing page template:
      Full-width hero image (first in approved photo order)
      Headline (editorial, character-forward)
      Key attributes grid: price, beds, baths, sqft, year, garage, HOA
      Property narrative
      Photo gallery (approved order)
      Neighborhood story (from neighborhood file)
      Agent card: name, contact, personal note
      Contact / schedule showing form
  → Generates preview link

Listing Manager → Orchestrator:
  sop_step_complete: 2
  next_specialist_needed: "diana_approval"
  output: listing_page_draft, preview_url

Orchestrator:
  → Logs: EVT "listing_page_generated"
  → Updates database: sop.current_step = 3
  → Routes preview to Diana's dashboard approval queue
```

### STEP 3 — Diana: Reviews and Approves
```
Orchestrator → Diana (Dashboard + Slack DM):
  "New listing ready for approval
   2847 Exposition Blvd · Travis Heights · $725,000
   Carlos Mendoza
   → [PREVIEW PAGE]
   → [APPROVE & PUBLISH]
   → [EDIT]
   → [HOLD]"

Diana reviews preview in dashboard.

Option A — Diana approves:
  → Dashboard: APPROVE & PUBLISH clicked
  → Orchestrator receives approval signal

Option B — Diana requests edits:
  → Diana edits in dashboard (narrative, price, headline)
  → Re-previews
  → Approves

Option C — Diana holds:
  → SOP holds indefinitely until Diana approves
  → Reminder sent after 48hr: "Listing pending your approval"

On approval:
  Orchestrator:
  → Logs: EVT "listing_approved_by_diana"
  → Updates database: sop.current_step = 4
  → Routes to Listing Manager to publish
```

### STEP 4 — Listing Manager: Publish
```
Orchestrator → Listing Manager:
  Context: approved listing page, sop_context step 4

Listing Manager:
  → Publishes listing page to live website
  → Updates property record:
      status = active
      date_listed = [today]
      dom_counter_start = [today]
  → Generates Listing Input Sheet for MLS entry

Listing Manager → Orchestrator:
  sop_step_complete: 4
  next_specialist_needed: "03_client_communication"
  output: published_url, listing_input_sheet_ready,
          property_status_updated

Orchestrator:
  → Logs: EVT "listing_published"
  → Updates database:
      property.status = active
      property.date_listed
      reporting.list_date, reporting.list_price
      sop.current_step = 5
  → Notifies agent: "Listing is live → [URL]"
```

### STEP 5 — Client Communication: Announce to Seller
```
Orchestrator → Client Communication:
  Context: deal record, agent profile (Carlos),
           published_url, property details,
           sop_context step 5
           situation_type: "listing_live"

Client Communication:
  → Drafts seller announcement in Carlos's voice:
      "Your listing is live" email with:
      - Link to listing page
      - What happens next (showings, feedback process)
      - Carlos's availability
  → Optional: social media caption for agent to post
  → Written in Carlos's voice

Client Communication → Orchestrator:
  sop_step_complete: 5
  next_specialist_needed: null
  output: seller_announcement_draft, social_caption (optional)

Orchestrator:
  → Logs: EVT "listing_announcement_drafted"
  → Updates database: sop.current_step = 6
  → Posts draft to Carlos in deal channel
```

### STEP 6 — Agent: Sends and SOP Completes
```
Carlos reviews and sends seller announcement.

Orchestrator:
  → Logs: EVT "listing_announcement_sent", COMM-[N]
  → Updates database:
      communications[] ← new entry
      sop.completed_at = [timestamp]
  → SOP 05 COMPLETE

Post-SOP:
  → TC begins monitoring: DOM counter active
  → TC flags at 21 DOM if no showing activity
  → TC flags at 30 DOM if no offer — triggers price review suggestion
```

---

## DATABASE WRITES — FULL SOP 05

| Step | Event Logged | Fields Updated |
|---|---|---|
| 1 | listing_readiness_verified | sop.active_sop, sop.current_step |
| 2 | listing_page_generated | sop.current_step |
| 3 | listing_approved_by_diana | sop.current_step |
| 4 | listing_published | property.status, property.date_listed, reporting fields |
| 5 | listing_announcement_drafted | sop.current_step |
| 6 | listing_announcement_sent | communications[], sop.completed_at |

---

## ERROR HANDLING

| Situation | Orchestrator Action |
|---|---|
| Blocking fields missing | SOP holds at Step 1. Agent notified with specific list. |
| Diana does not approve within 48hr | Reminder to Diana DM. Listing stays unpublished. |
| Website publish fails | Listing Manager retries. If fails again → flag to Diana: "Technical issue publishing [address]. Manual intervention needed." |
| MLS entry needed | Listing Input Sheet available in deal vault immediately after Step 4. |

---

*SOP version: 1.0*
*Chained from: deal in confirmed stage with listing ready*
*Chains to: TC monitoring (DOM tracking, showing activity, price review)*

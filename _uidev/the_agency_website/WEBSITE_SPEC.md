# ATX Boutique Real Estate — Website Specification
> For: Cursor development
> Project path: Realstateagency/_uidev/the_agency_website/
> Data source: src/data/listings.json
> Images: public/Images/properties/
> Design system: already implemented in project — use existing components and tokens

---

## BRAND

**Firm name:** ATX Boutique Real Estate
**Tagline:** Diana Castellano, Principal
**Market:** Austin, TX — Boutique Residential
**Voice:** Editorial, curated, high-touch — not a listing aggregator

---

## PAGES TO BUILD

### 1. Homepage `/`
### 2. All Listings `/listings`
### 3. Individual Listing `/listing/[property_id]`
### 4. About `/about`

---

## PAGE 1 — HOMEPAGE `/`

**Purpose:** First impression. Editorial feel. Leads to listings.

**Sections:**

**Hero**
- Full-width, full-height
- Firm name: ATX Boutique Real Estate
- Tagline: Diana Castellano, Principal · Austin, TX
- Short statement (1 line): "Boutique residential real estate. We turn down volume to do better work."
- CTA button: "View Current Listings" → `/listings`

**Featured Listings (3 cards)**
- Pull first 3 listings from `listings.json` where `status === "active"`
- Or manually select ATX-001, ATX-004, ATX-008 (one per zone)
- Card shows: hero image, headline, price, neighborhood, sqft
- Click → individual listing page

**Neighborhoods We Serve**
- 4 zone cards: Travis Heights · East Austin · Barton Hills · North Austin
- Each card: zone name, brief descriptor, listing count from JSON
- Click → `/listings?zone=travis_heights`

**Simple Footer**
- Firm name, Diana Castellano Principal
- Austin TX
- Contact placeholder email

---

## PAGE 2 — ALL LISTINGS `/listings`

**Purpose:** Browse all 15 active listings. Filter by zone.

**Filter Bar**
- Zone filter buttons: All · Travis Heights · East Austin · Barton Hills · North Austin
- Price sort: Low to High / High to Low
- Active filter highlighted

**Listings Grid**
- 3 columns desktop, 2 tablet, 1 mobile
- Each card:
  - Hero image (full width of card)
  - Headline
  - Address (street only)
  - Neighborhood badge
  - Price formatted: $1,350,000
  - Price per sqft: $675/sqft
  - Square feet
  - Click → `/listing/[property_id]`

**Data logic:**
```javascript
import listings from './data/listings.json'

// Filter by zone
const filtered = zone 
  ? listings.listings.filter(l => l.zone === zone)
  : listings.listings

// Filter active only
const active = filtered.filter(l => l.status === 'active')
```

---

## PAGE 3 — INDIVIDUAL LISTING `/listing/[property_id]`

**Purpose:** Full property detail. Editorial layout. Photography leads.

**Sections in order:**

**Hero Image**
- Full-width, tall (70vh minimum)
- `hero_image` from listing data
- Property headline overlaid at bottom or below image

**Property Header**
- Headline (large)
- Address
- Neighborhood · Austin, TX · ZIP
- Price (prominent)

**Key Attributes Grid**
- Square feet
- Price per sqft
- Listed date
- Zone/neighborhood
- Agent name (look up from agent_id: carlos/elena/marco → full name)

**Description**
- Narrative text from listing data

**Photo Gallery**
- 4 gallery images in a grid (kitchen, living, suite, outdoor)
- Lightbox on click (optional for essential version — just grid is fine)

**Neighborhood Context**
- Short paragraph about the zone
- Pull from a static object in the component (not from MD files for this version)
- One sentence per zone is enough

**Agent Card**
- Agent name (mapped from agent_id)
- Title: Listing Agent · ATX Boutique Real Estate
- Contact CTA: "Schedule a Showing" (mailto link or placeholder form)

**Back link**
- ← Back to listings

**Agent name mapping:**
```javascript
const agentNames = {
  carlos: "Carlos Mendoza",
  elena: "Elena Reyes",
  marco: "Marco Reyes",
  diana: "Diana Castellano"
}
```

---

## PAGE 4 — ABOUT `/about`

**Purpose:** Who Diana is and what the firm stands for. Simple, one page.

**Sections:**
- Firm name + tagline
- 2-3 paragraph description:
  - "ATX Boutique Real Estate is a four-person team based in Austin, TX."
  - "We handle 60-80 transactions a year — residential, mix of buyers and sellers."
  - "We are small on purpose. We turn down volume to do better work."
- Team: Diana Castellano (Principal), Elena Reyes, Carlos Mendoza, Marco Reyes
- Simple cards with name and role — no photos needed for essential version
- Contact section: email placeholder

---

## NAVIGATION

- Logo/firm name left → links to `/`
- Nav links: Listings · About
- Mobile: hamburger menu

---

## DATA LOGIC — CRITICAL

**All listing data comes from `listings.json`.**
Do not hardcode listing content anywhere. Every listing card and detail page reads from the JSON.

```javascript
// Get single listing by ID
const listing = listings.listings.find(l => l.property_id === id)

// Get listings by zone
const byZone = listings.listings.filter(l => l.zone === zone)

// Zone summary (listing count)
const count = listings.summary[zone].count
```

**Image paths are already correct in the JSON** — `/Images/properties/ATX-001_hero.png`
Use directly as `src` in img tags.

---

## ZONE DESCRIPTORS (use in neighborhood section on listing page)

```javascript
const zoneDescriptors = {
  travis_heights: "Historic, walkable, 1.8 miles from downtown. South Congress corridor.",
  east_austin: "Austin's most active market. Art, music, food, and the I-35 corridor.",
  barton_hills: "Nature-forward. Barton Creek Greenbelt access. Top-rated schools.",
  north_austin: "Family-oriented. Tech corridor proximity. Gullett Elementary."
}
```

---

## WHAT THIS IS NOT

- Not connected to the AI system yet — static data only for this version
- Not a live CRM — no forms that submit anywhere real
- No authentication
- No admin panel

The AI chat integration (demo UI) is a separate project. This website is the public-facing listing layer only.

---

## PHASE 2 ADDITIONS (not now)

- Chat widget connected to demo UI
- Individual agent pages
- Search by price range slider
- Map view of listings by zone
- Contact form that routes to agent

---

## SUCCESS CRITERIA

1. All 15 listings display correctly with images
2. Zone filter works on `/listings`
3. Individual listing page renders all data from JSON
4. Navigation works between all pages
5. Mobile responsive

---

*Spec Version: 1.0*
*Data: src/data/listings.json — 15 active listings*
*Images: public/Images/properties/ — 75 images (15 × 5)*
*Design system: use existing project tokens and components*

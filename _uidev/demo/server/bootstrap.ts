import fs from "node:fs";
import path from "node:path";
import {
  dealsDir,
  getAgencyRoot,
  propertiesDir,
  propertyFilePath,
} from "./paths.js";

const MARCO_AGENT = {
  agent_id: "marco",
  name: "Marco Reyes",
  slack_handle: "@marco",
  role: "Junior Agent",
  output_mode: "guided",
  side_specialty: "both",
  review_required: false,
};

function mkdirp(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function writeJsonAtomic(p: string, data: unknown) {
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, p);
}

function writePropertyAtx016(agencyRoot: string, created: string[]) {
  const p = propertyFilePath(agencyRoot, "ATX-016");
  if (fs.existsSync(p)) return;
  const body = `Catalog record for **2219 Bluebonnet Lane** — Chen contract property (DEMO_UI_UPDATE_SPEC: use ATX-016, not ATX-003, for this home).`;
  fs.writeFileSync(
    p,
    `---
property:
  property_id: "ATX-016"
  mls_number: ""
  status: "under_contract"
  address:
    street: "2219 Bluebonnet Lane"
    city: "Austin"
    state: "TX"
    zip: "78704"
    neighborhood: "Travis Heights"
    zone: "travis_heights"
  pricing:
    list_price: 649000
    price_per_sqft: 430
    price_history:
      - date: "2026-05-01"
        price: 649000
        event: "listed"
  attributes:
    property_type: "Single Family Residence"
    year_built: 1968
    square_feet: 1510
    acres: 0.14
    stories: 1
    bedrooms: 3
    bathrooms_full: 2
    bathrooms_half: 0
    garages: 1
  features:
    interior:
      - "original hardwood floors"
      - "updated kitchen"
    exterior:
      - "fenced yard"
      - "covered porch"
    community: []
    hoa_monthly: 0
  listing:
    days_on_market: 14
    date_listed: "2026-05-01"
    listing_agent_id: "elena"
    assigned_agent_id: "elena"
    open_house_dates: []
  media:
    hero_image: ""
    gallery: []
    virtual_tour_url: ""
    photo_count: 0
  description:
    headline: "Travis Heights classic — walkable to SoCo"
    narrative: |
      Charming single-story with mature oaks, updated kitchen, and strong rental comps nearby.
    agent_notes: |
      [INTERNAL] Chen buyer deal — appraisal / inspection storyline for demo.
  deal_id: "412"
---

${body}
`,
    "utf8"
  );
  created.push(p);
}

/** Separate catalog listing (spec: not the Chen contract home). */
function writePropertyAtx003(agencyRoot: string, created: string[]) {
  const p = propertyFilePath(agencyRoot, "ATX-003");
  if (fs.existsSync(p)) return;
  fs.writeFileSync(
    p,
    `---
property:
  property_id: "ATX-003"
  mls_number: "DEMO-003"
  status: "active"
  address:
    street: "Demo Listing Street"
    city: "Austin"
    state: "TX"
    zip: "78702"
    neighborhood: "East Austin"
    zone: "east_austin"
  pricing:
    list_price: 525000
    price_per_sqft: 310
    price_history:
      - date: "2026-05-10"
        price: 525000
        event: "listed"
  attributes:
    property_type: "Single Family Residence"
    year_built: 1985
    square_feet: 1690
    acres: 0.12
    stories: 1
    bedrooms: 3
    bathrooms_full: 2
    bathrooms_half: 0
    garages: 1
  features:
    interior: ["open plan"]
    exterior: ["deck"]
    community: []
    hoa_monthly: 0
  listing:
    days_on_market: 5
    date_listed: "2026-05-10"
    listing_agent_id: "marco"
    assigned_agent_id: "marco"
    open_house_dates: []
  media:
    hero_image: ""
    gallery: []
    virtual_tour_url: ""
    photo_count: 0
  description:
    headline: "Demo catalog only — not the Chen home"
    narrative: |
      Placeholder listing for exercises that reference ATX-003 explicitly.
  deal_id: ""
---

Demo-only property; Chen home is **ATX-016**.
`,
    "utf8"
  );
  created.push(p);
}

export function bootstrapAgencyFiles(): { agencyRoot: string; created: string[] } {
  const agencyRoot = getAgencyRoot();
  const created: string[] = [];
  const storageMode = (process.env.STORAGE_MODE ?? "local").trim().toLowerCase();
  if (storageMode === "github") {
    return { agencyRoot, created };
  }
  const deals = dealsDir(agencyRoot);
  const props = propertiesDir(agencyRoot);
  mkdirp(deals);
  mkdirp(props);

  const schemaPath = path.join(agencyRoot, "_database", "schema.json");
  const buyer412 = path.join(deals, "412-buyer.json");
  if (!fs.existsSync(buyer412)) {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Missing ${schemaPath} — cannot bootstrap 412-buyer.json`);
    }
    const rawText = fs.readFileSync(schemaPath, "utf8");
    const patched = rawText.replace(/ATX-003/g, "ATX-016");
    const raw = JSON.parse(patched) as Record<string, unknown>;
    if (raw.deal && typeof raw.deal === "object") {
      (raw.deal as { agent: typeof MARCO_AGENT }).agent = MARCO_AGENT;
    }
    writeJsonAtomic(buyer412, raw);
    created.push(buyer412);
  }

  const seller327 = path.join(deals, "327-seller.json");
  if (!fs.existsSync(seller327)) {
    const fixture = path.join(process.cwd(), "server", "fixtures", "327-seller.json");
    const data = readJson<unknown>(fixture);
    writeJsonAtomic(seller327, data);
    created.push(seller327);
  }

  writePropertyAtx016(agencyRoot, created);
  writePropertyAtx003(agencyRoot, created);

  return { agencyRoot, created };
}

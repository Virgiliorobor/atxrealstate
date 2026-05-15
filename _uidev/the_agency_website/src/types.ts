export type ZoneKey = "travis_heights" | "east_austin" | "barton_hills" | "north_austin";

export type AgentId = "carlos" | "elena" | "marco" | "diana";

export interface Listing {
  property_id: string;
  status: string;
  zone: ZoneKey;
  neighborhood: string;
  address: string;
  list_price: number;
  price_per_sqft: number;
  square_feet: number;
  headline: string;
  narrative: string;
  hero_image: string;
  gallery: string[];
  listing_agent: AgentId;
  date_listed: string;
  days_on_market: number;
}

export interface ZoneSummary {
  count: number;
  price_range: string;
  listings: string[];
}

export interface ListingsData {
  listings: Listing[];
  summary: Record<ZoneKey, ZoneSummary>;
}

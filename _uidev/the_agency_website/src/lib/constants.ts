import type { AgentId, ZoneKey } from "../types";

export const ZONE_ORDER: ZoneKey[] = [
  "travis_heights",
  "east_austin",
  "barton_hills",
  "north_austin",
];

export const ZONE_LABELS: Record<ZoneKey, string> = {
  travis_heights: "Travis Heights",
  east_austin: "East Austin",
  barton_hills: "Barton Hills",
  north_austin: "North Austin",
};

export const ZONE_CARD_BLURB: Record<ZoneKey, string> = {
  travis_heights: "Historic, walkable, minutes from downtown and South Congress.",
  east_austin: "Art, music, food, and one of Austin’s most active residential corridors.",
  barton_hills: "Greenbelt access, Zilker proximity, and a nature-forward residential rhythm.",
  north_austin: "Family-oriented blocks, strong schools, and easy tech-corridor access.",
};

export const ZONE_DESCRIPTORS: Record<ZoneKey, string> = {
  travis_heights:
    "Historic, walkable, 1.8 miles from downtown. South Congress corridor.",
  east_austin: "Austin's most active market. Art, music, food, and the I-35 corridor.",
  barton_hills: "Nature-forward. Barton Creek Greenbelt access. Top-rated schools.",
  north_austin: "Family-oriented. Tech corridor proximity. Gullett Elementary.",
};

export const AGENT_NAMES: Record<AgentId, string> = {
  carlos: "Carlos Mendoza",
  elena: "Elena Reyes",
  marco: "Marco Reyes",
  diana: "Diana Castellano",
};

export const FEATURED_PROPERTY_IDS = ["ATX-001", "ATX-004", "ATX-008"] as const;

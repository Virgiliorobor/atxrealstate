import type { ListingsData, Listing, ZoneKey } from "../types";

export function activeListings(data: ListingsData): Listing[] {
  return data.listings.filter((l) => l.status === "active");
}

export function byZone(listings: Listing[], zone: ZoneKey | null): Listing[] {
  if (!zone) return listings;
  return listings.filter((l) => l.zone === zone);
}

export function sortByPrice(listings: Listing[], dir: "asc" | "desc"): Listing[] {
  const copy = [...listings];
  copy.sort((a, b) => (dir === "asc" ? a.list_price - b.list_price : b.list_price - a.list_price));
  return copy;
}

export function findListing(data: ListingsData, id: string): Listing | undefined {
  return data.listings.find((l) => l.property_id === id);
}

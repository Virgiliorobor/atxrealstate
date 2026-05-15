import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { ZONE_LABELS, ZONE_ORDER } from "../lib/constants";
import { listingsData } from "../lib/data";
import { activeListings, byZone, sortByPrice } from "../lib/listings";
import type { ZoneKey } from "../types";

const ALL_ZONES: (ZoneKey | null)[] = [null, ...ZONE_ORDER];

function parseZone(raw: string | null): ZoneKey | null {
  if (!raw) return null;
  if (ZONE_ORDER.includes(raw as ZoneKey)) return raw as ZoneKey;
  return null;
}

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const zone = parseZone(params.get("zone"));
  const sort = params.get("sort") === "high" ? "desc" : "asc";

  const listings = useMemo(() => {
    const active = activeListings(listingsData);
    const filtered = byZone(active, zone);
    return sortByPrice(filtered, sort);
  }, [zone, sort]);

  function setZone(next: ZoneKey | null) {
    const nextParams = new URLSearchParams(params);
    if (next) nextParams.set("zone", next);
    else nextParams.delete("zone");
    setParams(nextParams);
  }

  function setSort(next: "asc" | "desc") {
    const nextParams = new URLSearchParams(params);
    if (next === "desc") nextParams.set("sort", "high");
    else nextParams.delete("sort");
    setParams(nextParams);
  }

  return (
    <div className="listings-page">
      <header className="listings-page__header container">
        <p className="mono-eyebrow">Inventory</p>
        <h1 className="headline-lg">All listings</h1>
        <p className="body-lg listings-page__lede">
          {listings.length} active {listings.length === 1 ? "home" : "homes"}
          {zone ? ` in ${ZONE_LABELS[zone]}` : " across Austin"}.
        </p>
      </header>

      <div className="listings-page__controls container">
        <div className="filter-row mono-label-md" role="group" aria-label="Filter by zone">
          <span className="filter-row__label">Zone</span>
          <div className="filter-row__buttons">
            {ALL_ZONES.map((z) => {
              const active = z === zone;
              const label = z ? ZONE_LABELS[z] : "All";
              return (
                <button
                  key={label}
                  type="button"
                  className={`filter-btn ${active ? "filter-btn--active" : ""}`}
                  onClick={() => setZone(z)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="filter-row mono-label-md" role="group" aria-label="Sort by price">
          <span className="filter-row__label">Price</span>
          <div className="filter-row__buttons">
            <button
              type="button"
              className={`filter-btn ${sort === "asc" ? "filter-btn--active" : ""}`}
              onClick={() => setSort("asc")}
            >
              Low → High
            </button>
            <button
              type="button"
              className={`filter-btn ${sort === "desc" ? "filter-btn--active" : ""}`}
              onClick={() => setSort("desc")}
            >
              High → Low
            </button>
          </div>
        </div>
      </div>

      <div className="container listings-page__grid">
        {listings.map((listing) => (
          <ListingCard key={listing.property_id} listing={listing} />
        ))}
      </div>

      <style>{`
        .listings-page__header {
          padding-block: 72px 36px;
          border-bottom: var(--border-strong);
          background: var(--canvas);
        }
        .listings-page__lede {
          margin: 16px 0 0;
          max-width: 48ch;
          color: var(--ink-muted);
        }
        .listings-page__controls {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-block: 32px;
          border-bottom: var(--border-strong);
          background: var(--canvas);
        }
        @media (min-width: 900px) {
          .listings-page__controls {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
            gap: 48px;
          }
        }
        .filter-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .filter-row__label {
          color: var(--ink-muted);
        }
        .filter-row__buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .filter-btn {
          padding: 12px 16px;
          border: var(--border-thin);
          background: var(--canvas);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: none;
        }
        .filter-btn:hover {
          background: var(--fluo);
          color: var(--ink);
        }
        .filter-btn--active {
          border: var(--border-strong);
          border-color: var(--ink);
          background: var(--primary);
          color: var(--ink);
          box-shadow: 3px 3px 0 0 var(--acid);
        }
        .listings-page__grid {
          display: grid;
          gap: var(--gutter);
          grid-template-columns: 1fr;
          padding-block: 48px 96px;
        }
        @media (min-width: 640px) {
          .listings-page__grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1100px) {
          .listings-page__grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

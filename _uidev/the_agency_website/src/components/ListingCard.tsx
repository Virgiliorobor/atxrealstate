import { Link } from "react-router-dom";
import type { Listing } from "../types";
import { formatPrice, formatPricePerSqft, streetOnly } from "../lib/format";

type Props = { listing: Listing };

export function ListingCard({ listing }: Props) {
  return (
    <Link to={`/listing/${listing.property_id}`} className="listing-card card">
      <div className="listing-card__media">
        <img src={listing.hero_image} alt="" loading="lazy" width={800} height={520} />
      </div>
      <div className="listing-card__body">
        <p className="mono-eyebrow listing-card__eyebrow">{listing.neighborhood}</p>
        <h3 className="headline-md listing-card__title">{listing.headline}</h3>
        <p className="mono-label-md listing-card__meta">{streetOnly(listing.address)}</p>
        <div className="listing-card__row">
          <span className="chip">{listing.neighborhood}</span>
          <span className="mono-label-md listing-card__price">{formatPrice(listing.list_price)}</span>
        </div>
        <p className="mono-eyebrow listing-card__stats">
          {formatPricePerSqft(listing.price_per_sqft)} · {listing.square_feet.toLocaleString()} sqft
        </p>
      </div>
      <style>{`
        .listing-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          color: inherit;
          transition: none;
        }
        .listing-card:hover {
          transform: translate(2px, 2px);
          box-shadow: 4px 4px 0 0 var(--acid);
        }
        .listing-card__media {
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-bottom: var(--border-thin);
          background: var(--canvas);
        }
        .listing-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.02) contrast(1.02);
        }
        .listing-card__body {
          padding: 22px var(--gutter);
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .listing-card__eyebrow {
          color: var(--ink-muted);
        }
        .listing-card__title {
          flex: 1;
        }
        .listing-card__meta {
          color: var(--ink-muted);
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        .listing-card__row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .listing-card__price {
          font-size: 14px;
        }
        .listing-card__stats {
          color: var(--ink-muted);
          margin-top: auto;
        }
      `}</style>
    </Link>
  );
}

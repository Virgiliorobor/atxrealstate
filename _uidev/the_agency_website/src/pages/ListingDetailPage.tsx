import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AGENT_NAMES, ZONE_DESCRIPTORS, ZONE_LABELS } from "../lib/constants";
import { listingsData } from "../lib/data";
import { findListing } from "../lib/listings";
import { formatPrice, formatPricePerSqft, zipFromAddress } from "../lib/format";
import { LISTING_IMAGE_PLACEHOLDER, resolveListingImage } from "../lib/media";

export function ListingDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const listing = propertyId ? findListing(listingsData, propertyId) : undefined;

  if (!propertyId || !listing) {
    return <Navigate to="/listings" replace />;
  }

  const agentName = AGENT_NAMES[listing.listing_agent];
  const zip = zipFromAddress(listing.address);
  const zoneLine = `${listing.neighborhood} · Austin, TX${zip ? ` · ${zip}` : ""}`;
  const zoneDescriptor = ZONE_DESCRIPTORS[listing.zone];
  const heroUrl = useMemo(() => resolveListingImage(listing.hero_image), [listing.hero_image]);
  const [heroSrc, setHeroSrc] = useState(heroUrl);
  const galleryUrls = useMemo(() => listing.gallery.map((src) => resolveListingImage(src)), [listing.gallery]);
  useEffect(() => {
    setHeroSrc(heroUrl);
  }, [heroUrl]);

  return (
    <article className="detail">
      <div className="detail__hero">
        <img src={heroSrc} alt="" width={1600} height={900} onError={() => setHeroSrc(LISTING_IMAGE_PLACEHOLDER)} />
        <div className="detail__hero-cap container">
          <h1 className="headline-lg detail__hero-title">{listing.headline}</h1>
        </div>
      </div>

      <div className="container detail__content">
        <header className="detail__header">
          <p className="mono-eyebrow">{zoneLine}</p>
          <p className="display-lg detail__price">{formatPrice(listing.list_price)}</p>
          <p className="body-lg detail__address">{listing.address}</p>
        </header>

        <dl className="detail__attrs mono-label-md">
          <div className="detail__attr">
            <dt>Square feet</dt>
            <dd>{listing.square_feet.toLocaleString()}</dd>
          </div>
          <div className="detail__attr">
            <dt>Price / sqft</dt>
            <dd>{formatPricePerSqft(listing.price_per_sqft)}</dd>
          </div>
          <div className="detail__attr">
            <dt>Listed</dt>
            <dd>{listing.date_listed}</dd>
          </div>
          <div className="detail__attr">
            <dt>Zone</dt>
            <dd>{ZONE_LABELS[listing.zone]}</dd>
          </div>
          <div className="detail__attr">
            <dt>Agent</dt>
            <dd>{agentName}</dd>
          </div>
        </dl>

        <hr className="divider" />

        <section className="detail__section">
          <h2 className="headline-md detail__section-title">Overview</h2>
          <p className="body-lg detail__narrative">{listing.narrative}</p>
        </section>

        <section className="detail__section">
          <h2 className="headline-md detail__section-title">Gallery</h2>
          <div className="detail__gallery">
            {galleryUrls.map((src) => (
              <div key={src} className="detail__gallery-cell">
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  width={800}
                  height={600}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = LISTING_IMAGE_PLACEHOLDER;
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="detail__section">
          <h2 className="headline-md detail__section-title">Neighborhood context</h2>
          <p className="body-lg">{zoneDescriptor}</p>
        </section>

        <section className="detail__agent card">
          <p className="mono-eyebrow">Listing agent</p>
          <h2 className="headline-md">{agentName}</h2>
          <p className="body-lg">Listing Agent · ATX Boutique Real Estate</p>
          <a className="btn btn--primary detail__showing" href={`mailto:hello@atxboutique.example?subject=Showing%20${listing.property_id}`}>
            Schedule a Showing
          </a>
        </section>

        <p className="detail__back">
          <Link to="/listings" className="mono-label-md">
            ← Back to listings
          </Link>
        </p>
      </div>

      <style>{`
        .detail__hero {
          position: relative;
          min-height: 70vh;
          border-bottom: var(--border-strong);
          background: var(--canvas);
        }
        .detail__hero img {
          width: 100%;
          height: min(78vh, 900px);
          object-fit: cover;
          border-bottom: var(--border-thin);
        }
        .detail__hero-cap {
          padding-block: 28px 48px;
          border-top: var(--border-strong);
          background: var(--canvas);
        }
        .detail__hero-title {
          max-width: 22ch;
        }
        .detail__content {
          padding-block: 56px 112px;
          background: var(--canvas);
        }
        .detail__header {
          margin-bottom: 40px;
        }
        .detail__price {
          margin: 16px 0 8px;
          color: var(--ink);
          display: inline-block;
          padding: 8px 16px;
          border: var(--border-strong);
          box-shadow: 6px 6px 0 0 var(--fluo);
        }
        .detail__address {
          margin: 0;
          color: var(--ink-muted);
        }
        .detail__attrs {
          display: grid;
          gap: 0;
          grid-template-columns: 1fr;
          margin: 0 0 40px;
          border-top: var(--border-thin);
          border-left: var(--border-thin);
        }
        @media (min-width: 640px) {
          .detail__attrs {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1000px) {
          .detail__attrs {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        .detail__attr {
          border-right: var(--border-thin);
          border-bottom: var(--border-thin);
          padding: 16px 18px;
          background: var(--canvas);
        }
        .detail__attr dt {
          margin: 0 0 8px;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: var(--ink-muted);
        }
        .detail__attr dd {
          margin: 0;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
        }
        .detail__section {
          margin-top: 56px;
        }
        .detail__section-title {
          margin-bottom: 16px;
        }
        .detail__narrative {
          margin: 0;
          max-width: 65ch;
          color: var(--ink-muted);
        }
        .detail__section .body-lg {
          color: var(--ink-muted);
        }
        .detail__gallery {
          display: grid;
          gap: var(--gutter);
          grid-template-columns: 1fr;
          border: none;
          background: transparent;
        }
        @media (min-width: 700px) {
          .detail__gallery {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .detail__gallery-cell {
          background: var(--canvas);
          border: var(--border-thin);
        }
        .detail__gallery-cell img {
          width: 100%;
          height: 100%;
          min-height: 220px;
          object-fit: cover;
        }
        .detail__agent {
          margin-top: 56px;
          padding: 28px var(--gutter);
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }
        .detail__showing {
          margin-top: 8px;
        }
        .detail__back {
          margin-top: 48px;
        }
        .detail__back a {
          text-decoration: underline;
          text-underline-offset: 4px;
          color: var(--primary);
        }
      `}</style>
    </article>
  );
}

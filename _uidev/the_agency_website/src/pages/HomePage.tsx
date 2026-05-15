import { Link } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import {
  FEATURED_PROPERTY_IDS,
  ZONE_CARD_BLURB,
  ZONE_LABELS,
  ZONE_ORDER,
} from "../lib/constants";
import { listingsData } from "../lib/data";
import { activeListings } from "../lib/listings";

export function HomePage() {
  const active = activeListings(listingsData);
  const featured = FEATURED_PROPERTY_IDS.map((id) => active.find((l) => l.property_id === id)).filter(
    Boolean,
  ) as typeof active;

  return (
    <>
      <section className="hero">
        <div className="hero__rail" aria-hidden />
        <div className="hero__main">
          <div className="hero__main-inner container">
            <p className="mono-eyebrow hero__eyebrow">Austin, TX · Boutique residential</p>
            <hr className="neo-rule hero__rule" />
            <h1 className="display-lg hero__title">ATX Boutique Real Estate</h1>
            <p className="mono-label-md hero__tagline">Diana Castellano — Principal</p>
            <p className="hero__statement">
              A smaller real estate team for one of life's biggest decisions.
            </p>
            <Link to="/listings" className="btn btn--primary hero__cta">
              View Current Listings
            </Link>
          </div>
        </div>
        <aside className="hero__panel" aria-label="Firm index">
          <div className="hero__panel-inner">
            <p className="mono-eyebrow hero__panel-kicker">Index</p>
            <p className="hero__panel-line">01 — Editorial listings</p>
            <p className="hero__panel-line">02 — Zone-native search</p>
            <p className="hero__panel-line">03 — Principal-led tours</p>
            <div className="hero__panel-block" aria-hidden />
          </div>
        </aside>
        <style>{`
          .hero {
            min-height: min(100dvh, 960px);
            display: grid;
            grid-template-columns: 14px 1fr;
            grid-template-rows: auto auto;
            border-bottom: var(--border-strong);
            background: var(--canvas);
          }
          .hero__rail {
            grid-row: 1 / -1;
            background: linear-gradient(
              180deg,
              var(--fluo) 0%,
              var(--fluo) 50%,
              var(--primary) 50%,
              var(--primary) 100%
            );
            border-right: var(--border-thin);
          }
          .hero__main {
            grid-column: 2;
            display: flex;
            align-items: flex-end;
            padding-block: 48px 72px;
          }
          .hero__main-inner {
            max-width: 900px;
          }
          .hero__eyebrow {
            margin-bottom: 20px;
            color: var(--ink-muted);
          }
          .hero__rule {
            margin-bottom: 32px;
          }
          .hero__title {
            margin-bottom: 16px;
          }
          .hero__tagline {
            margin-bottom: 24px;
            color: var(--primary);
          }
          .hero__statement {
            margin: 0 0 40px;
            max-width: 36ch;
            font-family: var(--font-body);
            font-size: clamp(1.35rem, 2.8vw, 1.85rem);
            line-height: 1.35;
            font-weight: 500;
            letter-spacing: -0.02em;
            color: var(--ink);
          }
          .hero__panel {
            grid-column: 2;
            border-top: var(--border-strong);
            background: var(--primary);
            color: var(--ink);
          }
          .hero__panel-inner {
            padding: 18px var(--margin-mobile) 22px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            overflow: hidden;
            z-index: 0;
          }
          .hero__panel-kicker {
            position: relative;
            z-index: 1;
            color: var(--ink);
            opacity: 0.9;
            font-size: 10px;
            letter-spacing: 0.12em;
          }
          .hero__panel-line {
            margin: 0;
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 600;
            line-height: 1.35;
            letter-spacing: 0.09em;
            text-transform: uppercase;
            max-width: 26ch;
            position: relative;
            z-index: 1;
          }
          .hero__panel-block {
            position: absolute;
            right: -12px;
            bottom: -16px;
            width: 72px;
            height: 72px;
            background: var(--acid);
            border: var(--border-thin);
            transform: rotate(8deg);
            z-index: 0;
          }
          @media (min-width: 900px) {
            .hero {
              grid-template-columns: 18px minmax(0, 1fr) minmax(0, min(200px, 24vw));
              grid-template-rows: 1fr;
            }
            .hero__rail {
              grid-row: 1;
            }
            .hero__main {
              grid-column: 2;
              padding-block: 80px 96px;
              border-right: var(--border-thin);
            }
            .hero__panel {
              grid-column: 3;
              grid-row: 1;
              border-top: none;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .hero__panel-inner {
              padding: 20px 16px 24px;
            }
          }
        `}</style>
      </section>

      <section className="section">
        <div className="container">
          <p className="mono-eyebrow section__eyebrow">Featured</p>
          <h2 className="headline-lg section__title">Current highlights</h2>
          <hr className="neo-rule section__rule" />
          <div className="featured-grid">
            {featured.map((listing) => (
              <ListingCard key={listing.property_id} listing={listing} />
            ))}
          </div>
        </div>
        <style>{`
          .section {
            padding-block: 112px 0;
            background: var(--canvas);
          }
          .section__eyebrow {
            margin-bottom: 12px;
            color: var(--ink-muted);
          }
          .section__title {
            margin-bottom: 24px;
            max-width: 14ch;
          }
          .section__rule {
            margin-bottom: 48px;
          }
          .featured-grid {
            display: grid;
            gap: var(--gutter);
            grid-template-columns: 1fr;
          }
          @media (min-width: 768px) {
            .featured-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (min-width: 1100px) {
            .featured-grid {
              grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(0, 1fr);
            }
          }
        `}</style>
      </section>

      <section className="section section--zones">
        <div className="container">
          <p className="mono-eyebrow section__eyebrow">Coverage</p>
          <h2 className="headline-lg section__title">Neighborhoods we serve</h2>
          <hr className="neo-rule section__rule" />
          <div className="zones-grid">
            {ZONE_ORDER.map((zone) => {
              const count = listingsData.summary[zone].count;
              return (
                <Link key={zone} to={`/listings?zone=${zone}`} className="zone-card">
                  <p className="mono-eyebrow zone-card__count">{String(count).padStart(2, "0")} listings</p>
                  <h3 className="headline-md zone-card__name">{ZONE_LABELS[zone]}</h3>
                  <p className="body-lg zone-card__desc">{ZONE_CARD_BLURB[zone]}</p>
                  <span className="mono-label-md zone-card__cta">View zone →</span>
                </Link>
              );
            })}
          </div>
        </div>
        <style>{`
          .section--zones {
            padding-block: 112px 96px;
          }
          .zones-grid {
            display: grid;
            gap: var(--gutter);
            grid-template-columns: 1fr;
          }
          @media (min-width: 700px) {
            .zones-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (min-width: 1100px) {
            .zones-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .zone-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 28px var(--gutter);
            border: var(--border-thin);
            background: var(--canvas);
            min-height: 100%;
            color: inherit;
            box-shadow: var(--neo-shift) var(--neo-shift) 0 0 var(--line-soft);
            transition: none;
          }
          .zone-card:hover {
            background: var(--acid);
            color: var(--ink);
            box-shadow: var(--neo-shift) var(--neo-shift) 0 0 var(--ink);
          }
          .zone-card__count {
            color: var(--ink-muted);
          }
          .zone-card:hover .zone-card__count {
            color: var(--ink);
          }
          .zone-card__desc {
            margin: 0;
            flex: 1;
            color: var(--ink-muted);
          }
          .zone-card:hover .zone-card__desc {
            color: var(--ink);
          }
          .zone-card__cta {
            margin-top: 8px;
          }
        `}</style>
      </section>
    </>
  );
}

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `site-header__link mono-label-md ${isActive ? "site-header__link--active" : ""}`;

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="site-header__bar container">
          <Link to="/" className="site-header__brand mono-label-md" onClick={() => setOpen(false)}>
            ATX Boutique
          </Link>
          <button
            type="button"
            className="site-header__menu-btn mono-label-md"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
          <nav className="site-header__nav-desktop" aria-label="Primary">
            <NavLink to="/listings" className={navLinkClass}>
              Listings
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>
        </div>
        {open ? (
          <div id="site-nav" className="site-header__drawer">
            <div className="container site-header__drawer-inner">
              <NavLink to="/listings" className={navLinkClass} onClick={() => setOpen(false)}>
                Listings
              </NavLink>
              <NavLink to="/about" className={navLinkClass} onClick={() => setOpen(false)}>
                About
              </NavLink>
            </div>
          </div>
        ) : null}
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer__accent" aria-hidden />
        <div className="container site-footer__inner">
          <p className="mono-eyebrow site-footer__line">ATX Boutique Real Estate</p>
          <p className="body-lg site-footer__line">Diana Castellano, Principal · Austin, TX</p>
          <p className="mono-eyebrow site-footer__line">
            <a href="mailto:hello@atxboutique.example">hello@atxboutique.example</a>
          </p>
        </div>
      </footer>
      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--canvas);
          border-bottom: var(--border-strong);
        }
        .site-header__bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 64px;
        }
        .site-header__brand {
          letter-spacing: 0.12em;
          padding: 8px 0;
        }
        .site-header__menu-btn {
          padding: 12px 16px;
          border: var(--border-strong);
          background: var(--canvas);
          box-shadow: 4px 4px 0 0 var(--fluo);
          transition: none;
        }
        .site-header__menu-btn:hover {
          background: var(--acid);
        }
        @media (min-width: 768px) {
          .site-header__menu-btn {
            display: none;
          }
        }
        .site-header__nav-desktop {
          display: none;
          align-items: center;
          gap: 10px;
        }
        @media (min-width: 768px) {
          .site-header__nav-desktop {
            display: flex;
          }
        }
        .site-header__link {
          padding: 12px 18px;
          border: var(--border-thin);
          color: var(--ink);
          background: var(--canvas);
          box-shadow: 3px 3px 0 0 transparent;
          transition: none;
        }
        .site-header__link:hover {
          box-shadow: 3px 3px 0 0 var(--fluo);
        }
        .site-header__link--active {
          background: var(--ink);
          color: var(--canvas);
          border-color: var(--ink);
          box-shadow: 3px 3px 0 0 var(--acid);
        }
        .site-header__drawer {
          border-bottom: var(--border-strong);
          background: var(--canvas);
        }
        .site-header__drawer-inner {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-block: 16px 24px;
        }
        .site-header__drawer-inner .site-header__link {
          width: 100%;
          text-align: left;
        }
        .site-main {
          flex: 1;
        }
        .site-footer {
          position: relative;
          border-top: var(--border-strong);
          background: var(--ink);
          color: var(--canvas);
          margin-top: 0;
        }
        .site-footer__accent {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 6px;
          background: linear-gradient(90deg, var(--fluo) 0%, var(--acid) 55%, var(--primary) 100%);
        }
        .site-footer a {
          color: var(--fluo);
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .site-footer__inner {
          padding-block: 56px 72px;
          padding-top: 64px;
        }
        .site-footer__line {
          margin: 0 0 14px;
        }
        .site-footer .body-lg {
          color: var(--line-soft);
        }
      `}</style>
    </>
  );
}

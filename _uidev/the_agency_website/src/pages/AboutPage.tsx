const TEAM = [
  { name: "Diana Castellano", role: "Principal" },
  { name: "Elena Reyes", role: "Agent" },
  { name: "Carlos Mendoza", role: "Agent" },
  { name: "Marco Reyes", role: "Agent" },
] as const;

export function AboutPage() {
  return (
    <div className="about">
      <header className="about__hero container">
        <p className="mono-eyebrow">About the firm</p>
        <h1 className="display-lg about__title">ATX Boutique Real Estate</h1>
        <p className="mono-label-md about__tagline">Diana Castellano, Principal</p>
      </header>

      <div className="about__body container">
        <div className="about__copy">
          <p className="body-lg">
            ATX Boutique Real Estate is a four-person team based in Austin, TX.
          </p>
          <p className="body-lg">
            We handle 60-80 transactions a year — residential, mix of buyers and sellers.
          </p>
          <p className="body-lg">
            We are small on purpose. We turn down volume to do better work.
          </p>
        </div>

        <section className="about__team">
          <h2 className="headline-lg about__team-title">Team</h2>
          <ul className="about__team-grid">
            {TEAM.map((member, i) => (
              <li key={member.name} className="about__member card">
                <p className="mono-eyebrow">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="headline-md">{member.name}</h3>
                <p className="mono-label-md about__member-role">{member.role}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about__contact">
          <h2 className="headline-md">Contact</h2>
          <p className="body-lg">
            <a href="mailto:hello@atxboutique.example">hello@atxboutique.example</a>
          </p>
        </section>
      </div>

      <style>{`
        .about__hero {
          padding-block: 80px 48px;
          border-bottom: var(--border-strong);
          background: var(--canvas);
        }
        .about__title {
          margin: 16px 0 8px;
        }
        .about__tagline {
          margin: 0;
          color: var(--primary);
        }
        .about__body {
          padding-block: 64px 112px;
          background: var(--canvas);
        }
        .about__copy {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 56ch;
        }
        .about__copy .body-lg {
          margin: 0;
          color: var(--ink-muted);
        }
        .about__team {
          margin-top: 80px;
        }
        .about__team-title {
          margin-bottom: 28px;
        }
        .about__team-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: var(--gutter);
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .about__team-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1000px) {
          .about__team-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .about__member {
          padding: 24px var(--gutter);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .about__member-role {
          color: var(--ink-muted);
        }
        .about__contact {
          margin-top: 72px;
          padding-top: 40px;
          border-top: var(--border-strong);
        }
        .about__contact .body-lg a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 4px;
        }
      `}</style>
    </div>
  );
}

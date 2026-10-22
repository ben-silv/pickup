import { exampleFeed } from "@/content";

/** Three big rounded tiles: a photo slot and two product shots. */
export function ImageBand() {
  return (
    <section className="section-top" aria-label="Pickup in use">
      <div className="wrap tiles">
        <figure className="tile tile-wide tile-cream">
          {/* Replace with a real photo (next/image from /public), see CLAUDE.md → Images. */}
          <svg aria-hidden="true" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="13" rx="3" />
            <circle cx="12" cy="12.5" r="3.5" />
            <path d="M8 6l1.5-2h5L16 6" />
          </svg>
          <figcaption className="label tile-caption">Photo · two students at a table in Tisch, one laptop, one sketchbook</figcaption>
        </figure>

        <figure className="tile tile-blue tile-phone" role="img" aria-label="The Pickup feed on a phone">
          <div className="phone">
            <div className="phone-head">
              <span className="display">Pickup</span>
              <span className="label muted tiny">Open roles</span>
            </div>
            {exampleFeed.map((f) => (
              <div key={f.title} className="phone-card">
                <strong>{f.title}</strong>
                <div className="role-tag tiny">
                  <span className="tag">{f.role}</span>
                  <span className="scope">{f.scope}</span>
                </div>
              </div>
            ))}
          </div>
        </figure>

        <figure className="tile tile-navy" role="img" aria-label="A shipped project page with a contributor credit">
          <span className="label tile-flag">Example</span>
          <div className="credit-card">
            <div className="credit-head">
              <span className="label muted">Project page</span>
              <span className="badge badge-success">Shipped</span>
            </div>
            <span className="display credit-title">Dewick wait-time tracker</span>
            <div className="credit-row">
              <span className="avatar avatar-blue small" aria-hidden="true">MR</span>
              <span className="person-text">
                <strong>Maya R. · UI/UX design · 5 hrs</strong>
                <span className="muted">Redid all three screens in a weekend.</span>
              </span>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

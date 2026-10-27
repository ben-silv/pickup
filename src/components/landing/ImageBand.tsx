import { exampleFeed } from "@/content";
import { DeskScene } from "./DeskScene";

/** Three big rounded tiles: the 3D table scene (photo slot) and two product shots. */
export function ImageBand() {
  return (
    <section className="section-top" aria-label="Project Pickup in use">
      <div className="wrap tiles">
        <figure className="tile tile-wide tile-cream tile-desk" role="img" aria-label="Illustration: a table on the Hill with an open laptop and a sketchbook, role tags floating above it">
          {/* Illustrated stand-in until there's a real photo (next/image from /public), see CLAUDE.md → Images. */}
          <DeskScene />
        </figure>

        <figure className="tile tile-blue tile-phone" role="img" aria-label="The Project Pickup feed on a phone">
          <div className="phone">
            <div className="phone-head">
              <span className="display">Project Pickup</span>
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

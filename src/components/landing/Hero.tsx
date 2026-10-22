import Link from "next/link";
import { heroChips } from "@/content";
import { RoleTag } from "../RoleTag";

export function Hero() {
  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="label pill pill-navy">For Tufts students · opening this spring</p>
          <h1 className="display hero-title">
            Your app needs a designer. Someone on the Hill <span className="hl">wants in.</span>
          </h1>
          <p className="hero-lede">
            Post your project, name the role and the hours, and team up with another Tufts student. Nobody gets paid.
            Everybody gets credit.
          </p>
          <div className="cta-row">
            <Link href="/sign-in" className="btn btn-lg glass-dark" data-track="hero_sign_in">
              Sign in with your Tufts email
            </Link>
            <Link href="/browse" className="hero-note">
              Browse open roles →
            </Link>
          </div>
        </div>

        <div className="hero-visual" role="img" aria-label="Example post: Dewick wait-time tracker asking for a UI/UX designer for about five hours">
          <div className="hero-circle top" aria-hidden="true" />
          <div className="hero-circle bottom" aria-hidden="true" />
          <div className="post post-back">
            <p className="label muted">Posted · CS 15 study-group matcher</p>
            <RoleTag role="Backend dev" scope="auth + database · ~8 hrs" />
          </div>
          <div className="post post-front">
            <div className="person">
              <span className="avatar avatar-sky" aria-hidden="true">JL</span>
              <span className="person-text">
                <strong>Jamie L. · CS &apos;28</strong>
                <span className="label muted">Prototype live</span>
              </span>
            </div>
            <p className="display post-title">Dewick wait-time tracker</p>
            <p className="muted small">Built with Cursor. Shows live line length at the dining halls. The screens need a real designer.</p>
            <RoleTag role="UI/UX designer" scope="3 screens · ~5 hrs" />
            <span className="fake-button">I can help</span>
          </div>
          <span className="label sticker glass">Example post</span>
        </div>
      </div>

      <ul className="wrap chip-row" aria-label="Roles people ask for">
        {heroChips.map((c) => (
          <li key={c} className="chip glass">
            {c}
          </li>
        ))}
      </ul>
    </header>
  );
}

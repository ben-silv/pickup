import Link from "next/link";
import { heroChips } from "@/content";
import { HeroStack } from "./HeroStack";

export function Hero() {
  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="label pill pill-navy">For Tufts students · now open</p>
          <h1 className="display hero-title">
            Your app needs a designer. Someone on the Hill <span className="hl">wants in.</span>
          </h1>
          <p className="hero-lede">
            Post your project, name the role and the hours, and team up with another Tufts student. Nobody gets paid.
            Everybody gets credit.
          </p>
          <div className="cta-row">
            <Link href="/sign-up" className="btn btn-lg glass-dark" data-track="hero_sign_up">
              Join with your Tufts email
            </Link>
            <Link href="/browse" className="hero-note">
              Browse open roles →
            </Link>
          </div>
        </div>

        <HeroStack />
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

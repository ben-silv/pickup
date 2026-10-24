import Link from "next/link";
import { heroChips } from "@/content";
import { HeroStack } from "./HeroStack";
import { BandPattern } from "../app/BandPattern";

/** `signedIn`: swap the join button for Browse, since the visitor already has an account. */
export function Hero({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="hero">
      <BandPattern />
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="label pill pill-navy">For students on the Hill · now open</p>
          <h1 className="display hero-title">
            Your app needs a designer. Someone on the Hill <span className="hl">wants in.</span>
          </h1>
          <p className="hero-lede">
            Post your project, name the role and the hours, and team up with another student on the Hill. Nobody gets paid.
            Everybody gets credit.
          </p>
          <div className="cta-row">
            {signedIn ? (
              <>
                <Link href="/browse" className="btn btn-lg glass-dark" data-track="hero_browse">
                  Browse open roles
                </Link>
                <Link href="/post" className="hero-note">
                  Post a project →
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-up" className="btn btn-lg glass-dark" data-track="hero_sign_up">
                  Join Project Pickup
                </Link>
                <Link href="/browse" className="hero-note">
                  Browse open roles →
                </Link>
              </>
            )}
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

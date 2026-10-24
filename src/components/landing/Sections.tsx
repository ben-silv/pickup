import Link from "next/link";
import { faqs, points, roleExamples, steps } from "@/content";
import { RoleTag } from "../RoleTag";
import { Elephant } from "../Elephant";

export function HowItWorks() {
  return (
    <section id="how" className="section-top">
      <div className="wrap stack-xl">
        <div className="section-head">
          <h2 className="display h2" style={{ maxWidth: "12ch" }}>Three steps. A few hours.</h2>
          <p className="lead muted">Project Pickup is for small, scoped asks. That makes yes an easy answer.</p>
        </div>
        <ol className="step-grid">
          {steps.map((s, i) => (
            <li key={s.title} className="step">
              <span className="display step-num" aria-hidden="true">{i + 1}</span>
              <h3 className="display step-title">{s.title}</h3>
              <p className="muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Roles() {
  return (
    <section id="roles" className="section-top">
      <div className="wrap stack-xl">
        <div className="stack-sm" style={{ maxWidth: 760 }}>
          <p className="label muted">Open roles · examples</p>
          <h2 className="display h2">From a two-hour fix to a whole build.</h2>
        </div>
        <div className="role-grid">
          {roleExamples.map((r) => (
            <article key={r.task} className="role-card">
              <h3 className="display">{r.task}</h3>
              <RoleTag role={r.role} scope={r.hours} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The page's one loud, all-blue block. */
export function CampusBlock() {
  return (
    <section className="section-top">
      <div className="wrap">
        <div className="campus-block">
          <h2 className="display h2-xl">Built for the Hill, not the internet.</h2>
          <div className="point-grid">
            {points.map((p) => (
              <div key={p.title} className="point">
                <h3 className="display">{p.title}</h3>
                <p className="muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="section-top">
      <div className="wrap faq-layout">
        <h2 className="display h2">Questions.</h2>
        <div className="faq-list">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <span className="faq-plus" aria-hidden="true">+</span>
              </summary>
              <p className="muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="wrap stack-lg center">
        <Elephant />
        <h2 className="display h2-xl">
          Get in on the <span className="hl">first round.</span>
        </h2>
        <p className="lead muted" style={{ maxWidth: "40ch" }}>
          Join with your Tufts email, post what you&apos;re building or pick up a role. It takes about a minute.
        </p>
        <Link href="/sign-up" className="btn btn-lg glass-dark" data-track="final_sign_up">
          Join with your Tufts email
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="stack-sm" style={{ maxWidth: 520 }}>
          <span className="footer-logo">
            <i className="logo-dots light" aria-hidden="true" />
            <span className="display">Project Pickup</span>
          </span>
          <p>A student project for Tufts students. Not affiliated with or endorsed by Tufts University. Example posts and people are illustrations.</p>
        </div>
        <div className="footer-links">
          <a href="#how">How it works</a>
          <a href="#roles">Roles</a>
          <a href="#faq">FAQ</a>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

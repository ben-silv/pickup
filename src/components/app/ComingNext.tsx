/**
 * Placeholder for screens that are designed but not built yet (Phase 2).
 * Delete it from a page once that page is real.
 */
export function ComingNext({ title, body, design }: { title: string; body: string; design: string }) {
  return (
    <section className="card coming-next">
      <span className="label pill pill-sky">Next up</span>
      <h2 className="display h3">{title}</h2>
      <p className="muted">{body}</p>
      <p className="small muted">
        Design: <code>{design}</code>
      </p>
    </section>
  );
}

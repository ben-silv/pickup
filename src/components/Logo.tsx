import Link from "next/link";

/** Project Pickup's two-dot mark + wordmark. `tone="light"` for use on blue backgrounds. */
export function Logo({ href = "/", tone = "dark" }: { href?: string; tone?: "dark" | "light" }) {
  return (
    <Link className={`logo logo-${tone}`} href={href}>
      <i className="logo-dots" aria-hidden="true" />
      <span className="display">Project Pickup</span>
    </Link>
  );
}

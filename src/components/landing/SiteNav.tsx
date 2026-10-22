import Link from "next/link";
import { Logo } from "../Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

/** Frosted-glass menu that sticks to the top while the page scrolls underneath. */
export function SiteNav() {
  return (
    <div className="nav-dock">
      <nav className="nav glass" aria-label="Main">
        <Logo />
        <div className="nav-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link hide-sm">
              {l.label}
            </a>
          ))}
          <Link href="/sign-in" className="btn btn-sm glass-dark">
            Sign in
          </Link>
        </div>
      </nav>
    </div>
  );
}

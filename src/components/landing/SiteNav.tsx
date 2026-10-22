import { Logo } from "../Logo";
import { ProfileMenu } from "../ProfileMenu";
import { getMenuUser } from "@/lib/nav-user";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

/** Frosted-glass menu that sticks to the top while the page scrolls underneath. */
export async function SiteNav() {
  const user = await getMenuUser();
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
          <ProfileMenu user={user} />
        </div>
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../Logo";
import { ProfileMenu } from "../ProfileMenu";
import type { MenuUser } from "@/lib/nav";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/post", label: "Post a project" },
  { href: "/messages", label: "Messages" },
];

export function AppNav({ user }: { user: MenuUser }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <div className="nav-dock">
      <nav className="nav glass" aria-label="Main">
        <Logo href="/browse" />
        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link hide-sm" aria-current={active(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <ProfileMenu user={user} />
        </div>
      </nav>
    </div>
  );
}

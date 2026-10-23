"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../Logo";
import { ProfileMenu } from "../ProfileMenu";
import type { MenuUser } from "@/lib/nav";
import { useUnread } from "../useUnread";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/post", label: "Post a project" },
  { href: "/messages", label: "Messages" },
];

export function AppNav({ user }: { user: MenuUser }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const unread = useUnread(user);
  return (
    <div className="nav-dock">
      <nav className="nav nav-app glass" aria-label="Main">
        <Logo href="/browse" />
        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link hide-sm" aria-current={active(l.href) ? "page" : undefined}>
              {l.label}
              {l.href === "/messages" && unread ? (
                <>
                  <span className="unread-dot" aria-hidden="true" />
                  <span className="sr-only"> (new)</span>
                </>
              ) : null}
            </Link>
          ))}
          <ProfileMenu user={user} unread={unread} />
        </div>
      </nav>
    </div>
  );
}

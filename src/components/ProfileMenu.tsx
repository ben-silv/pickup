"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { signOut } from "@/app/(app)/actions";
import type { MenuUser } from "@/lib/nav";
import { useUnread } from "./useUnread";

/**
 * Avatar (or person icon when signed out) with a dropdown. Opens on hover with a mouse, and on
 * click/tap or Enter for touch and keyboard. Escape, clicking outside or tabbing away closes it.
 */
export function ProfileMenu({ user, unread }: { user: MenuUser | null; unread?: boolean }) {
  // The app nav passes its own live value; on the landing page the menu tracks it itself.
  const ownUnread = useUnread(unread === undefined ? user : null);
  const hasNew = Boolean(user) && (unread ?? ownUnread);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while the menu is open only because the mouse is hovering, so the first click keeps it open.
  const hoverOpened = useRef(false);
  const pathname = usePathname();
  const panelId = useId();

  // Close after navigating.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hoverOpened.current = false;
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancelClose();
    if (!open) hoverOpened.current = true;
    setOpen(true);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancelClose();
    closeTimer.current = setTimeout(() => {
      hoverOpened.current = false;
      setOpen(false);
    }, 180);
  };

  const onClick = () => {
    if (hoverOpened.current) {
      hoverOpened.current = false;
      setOpen(true);
      return;
    }
    setOpen((o) => !o);
  };

  return (
    <div
      ref={wrapRef}
      className="profile-menu"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={user ? "avatar avatar-navy profile-trigger" : "profile-trigger profile-trigger-guest"}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={user ? `Account menu for ${user.name}${hasNew ? ", new messages" : ""}` : "Account menu"}
        onClick={onClick}
      >
        {hasNew ? <span className="unread-dot" aria-hidden="true" /> : null}
        {user ? (
          user.initials
        ) : (
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </button>

      <div id={panelId} className="menu-panel glass" hidden={!open}>
        {user ? (
          <>
            <div className="menu-head">
              <strong>{user.name}</strong>
              {user.email ? <span className="muted small">{user.email}</span> : null}
            </div>
            {/* On phones the nav's text links are hidden, so the menu doubles as navigation. */}
            <Link href="/browse" className="menu-item show-sm">Browse</Link>
            <Link href="/post" className="menu-item show-sm">Post a project</Link>
            <hr className="menu-sep show-sm" />
            <Link href="/profile?edit=1" className="menu-item">Edit profile</Link>
            <Link href="/profile#projects-heading" className="menu-item">Your projects</Link>
            <Link href="/messages" className="menu-item">
              Messages
              {hasNew ? (
                <>
                  <span className="unread-dot inline" aria-hidden="true" />
                  <span className="sr-only"> (new)</span>
                </>
              ) : null}
            </Link>
            <Link href="/reset-password" className="menu-item">Change password</Link>
            <hr className="menu-sep" />
            <form action={signOut}>
              <button type="submit" className="menu-item">Sign out</button>
            </form>
          </>
        ) : (
          <>
            <div className="menu-head">
              <strong>Not signed in</strong>
              <span className="muted small">Tufts students only</span>
            </div>
            <Link href="/sign-in" className="menu-item">Sign in</Link>
            <Link href="/sign-up" className="menu-item">Create an account</Link>
            <Link href="/browse" className="menu-item">Browse open roles</Link>
          </>
        )}
      </div>
    </div>
  );
}

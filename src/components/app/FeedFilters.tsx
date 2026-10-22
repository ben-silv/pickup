"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_CHIP_LABEL, type Category } from "@/lib/vocab";
import { FEED_SORTS, SEARCH_MAX, SORT_LABEL, sanitizeSearch, type FeedSort } from "@/lib/feed";

type Filters = { skill: Category | null; q: string; sort: FeedSort };

/**
 * Search, sort and skill chips for Browse. The URL holds the state and the server does the filtering.
 * It's a plain GET form underneath, so it still works before JavaScript loads.
 */
export function FeedFilters({ skill, q, sort }: Filters) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const pushed = useRef(q);

  // Follow the URL when it changes from outside (e.g. "Clear filters"), but not while typing catches up.
  useEffect(() => {
    if (q !== pushed.current) {
      pushed.current = q;
      setQuery(q);
    }
  }, [q]);

  const go = (next: Partial<Filters>) => {
    const f = { skill, q: query, sort, ...next };
    const params = new URLSearchParams();
    if (f.skill) params.set("skill", f.skill);
    const clean = sanitizeSearch(f.q);
    if (clean) params.set("q", clean);
    if (f.sort !== "newest") params.set("sort", f.sort);
    pushed.current = clean;
    const search = params.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  };

  // Search as you type, once typing pauses.
  useEffect(() => {
    if (sanitizeSearch(query) === pushed.current) return;
    const t = setTimeout(() => go({ q: query }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` reads the latest props; rerunning on them would re-push stale text
  }, [query]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    go({ q: query });
  };

  const chips: { id: Category | null; label: string }[] = [
    { id: null, label: "All" },
    ...CATEGORIES.map((c) => ({ id: c, label: CATEGORY_CHIP_LABEL[c] })),
  ];

  return (
    <form role="search" action={pathname} method="get" onSubmit={onSubmit} className="card feed-controls">
      {/* First submit button = what Enter presses without JavaScript. It carries the current skill so search doesn't drop it. */}
      <button type="submit" hidden name="skill" value={skill ?? ""}>
        Search
      </button>
      <div className="feed-controls-row">
        <label className="search-field">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className="sr-only">Search roles</span>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, skills, people"
            maxLength={SEARCH_MAX}
            autoComplete="off"
          />
        </label>
        <label className="sort-field">
          Sort
          <select name="sort" value={sort} onChange={(e) => go({ sort: e.target.value as FeedSort })}>
            {FEED_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div role="group" aria-label="Filter by skill" className="chip-group">
        {chips.map((c) => {
          const on = c.id === skill;
          return (
            <button
              key={c.id ?? "all"}
              type="submit"
              name="skill"
              value={c.id ?? ""}
              aria-pressed={on}
              className={`btn filter-chip ${on ? "glass-dark" : "btn-outline"}`}
              onClick={(e) => {
                e.preventDefault();
                go({ skill: c.id });
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </form>
  );
}

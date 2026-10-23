import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression test: after thread_reads (offers <-> profiles) was added, `helper:profiles(...)` became ambiguous and
 * Supabase refused the Messages query. Every embedded profile must name its foreign key, e.g. profiles!offers_helper_id_fkey.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("Supabase embeds", () => {
  it("name the foreign key for every embedded profile", () => {
    const offenders = sourceFiles(join(__dirname, "..", "..", "src")).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/\w+:profiles\(/g)].map((m) => `${file}: ${m[0]}`),
    );
    expect(offenders).toEqual([]);
  });
});

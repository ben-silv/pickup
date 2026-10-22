import { describe, expect, it } from "vitest";
import { friendlyDbError } from "@/lib/db-errors";

describe("friendlyDbError", () => {
  it("passes through the plain-English messages our SQL functions raise", () => {
    expect(friendlyDbError({ code: "22023", message: "This offer is no longer pending." }, "fallback")).toBe("This offer is no longer pending.");
    expect(friendlyDbError({ code: "42501", message: "Only the project owner can accept offers." }, "fallback")).toBe(
      "Only the project owner can accept offers.",
    );
  });

  it("never shows raw Postgres wording", () => {
    expect(friendlyDbError({ code: "42501", message: 'new row violates row-level security policy for table "offers"' }, "fallback")).toBe("fallback");
    expect(friendlyDbError({ code: "42883", message: "function public.nope() does not exist" }, "fallback")).toBe("fallback");
    expect(friendlyDbError({ code: null, message: null }, "fallback")).toBe("fallback");
  });

  it("uses per-code overrides first", () => {
    expect(friendlyDbError({ code: "23505", message: "duplicate key value" }, "fallback", { "23505": "Already done." })).toBe("Already done.");
  });

  it("explains check violations and expired sessions", () => {
    expect(friendlyDbError({ code: "23514", message: "violates check constraint" }, "fallback")).toMatch(/too long or too short/);
    expect(friendlyDbError({ code: "PGRST301", message: "JWT expired" }, "fallback")).toMatch(/Sign in again/);
  });
});

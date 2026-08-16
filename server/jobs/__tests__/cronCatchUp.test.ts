import { describe, it, expect, vi } from "vitest";

// cronMatches/previousCronSlot are pure functions, but ../scheduler imports
// server/db.ts at module top-level, which throws without DATABASE_URL.
// Mock it so this file runs anywhere (no real database needed).
vi.mock("../../db", () => ({ db: { execute: async () => ({ rows: [] }) }, pool: {} }));

import { cronMatches, previousCronSlot } from "../scheduler";

// Aug 15 2026 is a Saturday. Times below are constructed in UTC and checked
// against the America/New_York schedule (EDT = UTC-4 in August).

describe("cronMatches", () => {
  it("matches a daily 8am ET slot", () => {
    // 8:00 ET == 12:00 UTC during EDT
    const date = new Date("2026-08-15T12:00:00Z");
    expect(cronMatches("0 8 * * *", date, "America/New_York")).toBe(true);
    expect(cronMatches("0 8 * * *", new Date("2026-08-15T13:00:00Z"), "America/New_York")).toBe(false);
  });

  it("respects day-of-week fields (Sunday digest)", () => {
    const sunday10amEt = new Date("2026-08-16T14:00:00Z");
    const saturday10amEt = new Date("2026-08-15T14:00:00Z");
    expect(cronMatches("0 10 * * 0", sunday10amEt, "America/New_York")).toBe(true);
    expect(cronMatches("0 10 * * 0", saturday10amEt, "America/New_York")).toBe(false);
  });

  it("supports step fields", () => {
    expect(cronMatches("*/15 * * * *", new Date("2026-08-15T12:30:00Z"))).toBe(true);
    expect(cronMatches("*/15 * * * *", new Date("2026-08-15T12:31:00Z"))).toBe(false);
  });
});

describe("previousCronSlot", () => {
  it("finds the most recent missed 8am ET slot from an afternoon boot", () => {
    const bootAt = new Date("2026-08-15T18:23:00Z"); // 2:23pm ET
    const slot = previousCronSlot("0 8 * * *", bootAt, "America/New_York");
    expect(slot).not.toBeNull();
    expect(slot!.toISOString()).toBe("2026-08-15T12:00:00.000Z"); // 8am ET today
  });

  it("reaches back to yesterday when today's slot hasn't happened yet", () => {
    const bootAt = new Date("2026-08-15T10:00:00Z"); // 6am ET — before today's 8am
    const slot = previousCronSlot("0 8 * * *", bootAt, "America/New_York");
    expect(slot!.toISOString()).toBe("2026-08-14T12:00:00.000Z");
  });

  it("excludes the current minute (in-window boot doesn't self-trigger)", () => {
    const exactlyAtSlot = new Date("2026-08-15T12:00:30Z");
    const slot = previousCronSlot("0 8 * * *", exactlyAtSlot, "America/New_York");
    expect(slot!.toISOString()).toBe("2026-08-14T12:00:00.000Z");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// pointsService imports the db and the WebSocket broadcaster at module load.
// Mock both so no database or network connection is required.
let streamWatchEarnedToday = 0;

vi.mock("../../db", () => {
  const makeChain = () => {
    const chain: any = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.offset = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.set = vi.fn(() => chain);
    chain.values = vi.fn(() => chain);
    chain.returning = vi.fn(() => chain);
    // Awaiting the chain resolves to the configured rows.
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve(chain.__rows ?? []).then(resolve, reject);
    chain.__rows = [];
    return chain;
  };
  return {
    db: {
      select: vi.fn((fields?: any) => {
        const chain = makeChain();
        // The stream-watch daily-cap query selects an aggregate `total`.
        if (fields && "total" in fields) {
          chain.__rows = [{ total: streamWatchEarnedToday }];
        }
        return chain;
      }),
      update: vi.fn(() => makeChain()),
      insert: vi.fn(() => makeChain()),
    },
  };
});

vi.mock("../pointsWebSocketService", () => ({
  pointsWebSocketService: { notifyPointsChange: vi.fn() },
}));

import { pointsService } from "../pointsService";

describe("point award constants (getPointsValue defaults)", () => {
  it("returns the documented default award amounts", () => {
    expect(pointsService.getPointsValue("SIGNUP_BONUS")).toBe(2500);
    expect(pointsService.getPointsValue("PROFILE_COMPLETE")).toBe(500);
    expect(pointsService.getPointsValue("DAILY_LOGIN_BASE")).toBe(50);
    expect(pointsService.getPointsValue("STREAM_WATCH_PER_5MIN")).toBe(10);
    expect(pointsService.getPointsValue("STREAM_WATCH_DAILY_CAP")).toBe(200);
    expect(pointsService.getPointsValue("BOUNTY_SUBMIT_BASE")).toBe(100);
    expect(pointsService.getPointsValue("BOUNTY_SUBMIT_MAX")).toBe(500);
    expect(pointsService.getPointsValue("BOUNTY_ACCEPTED")).toBe(1000);
    expect(pointsService.getPointsValue("VOICE_CONVERSATION")).toBe(50);
    expect(pointsService.getPointsValue("REFERRAL_BONUS")).toBe(500);
    expect(pointsService.getPointsValue("STREAM_COMMENT_FIRST")).toBe(25);
    expect(pointsService.getPointsValue("STREAM_TIP_SENT")).toBe(10);
  });

  it("returns multiplier constants for streaks and prediction wins", () => {
    expect(pointsService.getPointsValue("DAILY_LOGIN_STREAK_MULTIPLIER")).toBe(0.5);
    expect(pointsService.getPointsValue("DAILY_LOGIN_MAX_MULTIPLIER")).toBe(3);
    expect(pointsService.getPointsValue("PREDICTION_WIN_MULTIPLIER")).toBe(1.5);
  });
});

describe("awardPoints input validation", () => {
  it("rejects a zero amount without touching the database", async () => {
    const result = await pointsService.awardPoints({
      userId: "u1",
      amount: 0,
      source: "admin_adjustment",
    });
    expect(result).toBeNull();
  });

  it("rejects a negative amount", async () => {
    const result = await pointsService.awardPoints({
      userId: "u1",
      amount: -100,
      source: "admin_adjustment",
    });
    expect(result).toBeNull();
  });
});

describe("spendPoints input validation", () => {
  it("rejects zero and negative amounts", async () => {
    expect(
      await pointsService.spendPoints({ userId: "u1", amount: 0, source: "market_trade" }),
    ).toEqual({ success: false, error: "Invalid amount" });
    expect(
      await pointsService.spendPoints({ userId: "u1", amount: -50, source: "market_trade" }),
    ).toEqual({ success: false, error: "Invalid amount" });
  });
});

describe("awardStreamWatch daily-cap logic", () => {
  const awardSpy = vi.spyOn(pointsService, "awardPoints");

  beforeEach(() => {
    awardSpy.mockClear();
    awardSpy.mockResolvedValue(null);
    streamWatchEarnedToday = 0;
  });

  it("awards 10 points per full 5-minute interval", async () => {
    streamWatchEarnedToday = 0;
    await pointsService.awardStreamWatch("u1", "s1", 17); // 3 intervals → 30
    expect(awardSpy).toHaveBeenCalledTimes(1);
    expect(awardSpy.mock.calls[0][0]).toMatchObject({ amount: 30, source: "stream_watch" });
  });

  it("awards nothing for less than one 5-minute interval", async () => {
    streamWatchEarnedToday = 0;
    const result = await pointsService.awardStreamWatch("u1", "s1", 4);
    expect(result).toBeNull();
    expect(awardSpy).not.toHaveBeenCalled();
  });

  it("awards nothing once the 200-point daily cap is reached", async () => {
    streamWatchEarnedToday = 200;
    const result = await pointsService.awardStreamWatch("u1", "s1", 60);
    expect(result).toBeNull();
    expect(awardSpy).not.toHaveBeenCalled();
  });

  it("clamps the award to the remaining daily cap", async () => {
    streamWatchEarnedToday = 190; // 10 points remaining under the 200 cap
    await pointsService.awardStreamWatch("u1", "s1", 60); // would be 120 uncapped
    expect(awardSpy).toHaveBeenCalledTimes(1);
    expect(awardSpy.mock.calls[0][0]).toMatchObject({ amount: 10 });
  });
});

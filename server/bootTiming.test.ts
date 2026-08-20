import { describe, expect, it, vi } from "vitest";
import {
  getBootTimingSnapshot,
  initializeBootTiming,
  markBootReady,
  schedulePostReadyWork,
  startBootPhase,
} from "./bootTiming";

describe("boot timing", () => {
  it("records named phase durations in the health snapshot", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T20:00:00Z"));
    initializeBootTiming(Date.now());
    const finish = startBootPhase("routes");
    vi.advanceTimersByTime(25);
    finish();
    vi.advanceTimersByTime(5);
    markBootReady();

    const snapshot = getBootTimingSnapshot();
    expect(snapshot.ready).toBe(true);
    expect(snapshot.readyMs).toBe(30);
    expect(snapshot.phases.routes).toMatchObject({
      durationMs: 25,
      runs: 1,
      status: "complete",
    });
    vi.useRealTimers();
  });

  it("does not execute post-ready work in the ready-marking turn", async () => {
    vi.useFakeTimers();
    initializeBootTiming(Date.now());
    const order: string[] = [];
    markBootReady();
    order.push("ready");
    schedulePostReadyWork(() => {
      order.push("catch-up");
    });

    expect(order).toEqual(["ready"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual(["ready", "catch-up"]);
    vi.useRealTimers();
  });

  it("allows shutdown to cancel queued post-ready work", async () => {
    vi.useFakeTimers();
    const work = vi.fn();
    const timer = schedulePostReadyWork(work, 100);
    clearTimeout(timer);
    await vi.advanceTimersByTimeAsync(100);
    expect(work).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
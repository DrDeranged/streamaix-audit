import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { strictLimit, signupLimit } from "../security";

// The limiter factory (createLimiter) is module-private; its behavior is
// tested through the exported limiter instances:
//   strictLimit — 5 requests / 60s, keyed by user id when present, else IP
//   signupLimit — 10 requests / 1h, keyed by IP only
//
// Buckets are module-level state shared across tests, so every test uses
// unique IPs / user ids to get fresh buckets.

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

function makeReq(ip: string, userId?: string): Request {
  const req: any = {
    ip,
    socket: { remoteAddress: ip },
    headers: {},
  };
  if (userId) req.user = { id: userId, username: "tester" };
  return req as Request;
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, unknown>,
    setHeader: vi.fn((k: string, v: unknown) => {
      res.headers[k.toLowerCase()] = v;
    }),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
  };
  return res as Response & {
    statusCode: number;
    headers: Record<string, unknown>;
    body: any;
  };
}

function call(limiter: (req: Request, res: Response, next: NextFunction) => unknown, req: Request) {
  const res = makeRes();
  const next = vi.fn();
  limiter(req, res, next);
  return { res, next };
}

describe("rate limiter (strictLimit: 5 per 60s)", () => {
  it("allows up to max requests within the window", () => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) {
      const { next, res } = call(strictLimit, makeReq(ip));
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it("returns 429 with Retry-After beyond max", () => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) call(strictLimit, makeReq(ip));

    const { res, next } = call(strictLimit, makeReq(ip));
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", 60);
    expect(res.body).toMatchObject({
      error: "Too many requests",
      limit: "strict",
      retryAfterSeconds: 60,
    });
  });

  it("keeps separate buckets per key (one client hitting the limit does not block another)", () => {
    const ipA = uniqueIp();
    const ipB = uniqueIp();
    for (let i = 0; i < 5; i++) call(strictLimit, makeReq(ipA));

    // ipA is now blocked, ipB is not
    expect(call(strictLimit, makeReq(ipA)).next).not.toHaveBeenCalled();
    expect(call(strictLimit, makeReq(ipB)).next).toHaveBeenCalledTimes(1);
  });

  it("keys by user id when authenticated: same user is limited across different IPs", () => {
    const userId = `user-${uniqueIp()}`;
    for (let i = 0; i < 5; i++) call(strictLimit, makeReq(uniqueIp(), userId));

    // 6th request from a brand-new IP but the same user id is still blocked
    const { res, next } = call(strictLimit, makeReq(uniqueIp(), userId));
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
  });

  it("falls back to IP keying for anonymous requests: an authenticated user's bucket does not affect the same IP anonymously", () => {
    const ip = uniqueIp();
    const userId = `user-${uniqueIp()}`;
    for (let i = 0; i < 5; i++) call(strictLimit, makeReq(ip, userId));

    // Same IP without a user is a different bucket → allowed
    expect(call(strictLimit, makeReq(ip)).next).toHaveBeenCalledTimes(1);
  });
});

describe("rate limiter (signupLimit: 10 per hour, IP-keyed)", () => {
  it("allows 10 then blocks the 11th from the same IP", () => {
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      expect(call(signupLimit, makeReq(ip)).next).toHaveBeenCalledTimes(1);
    }
    const { res, next } = call(signupLimit, makeReq(ip));
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ limit: "signup", retryAfterSeconds: 3600 });
  });

  it("ignores user identity (IP-keyed): same user on a new IP is not blocked", () => {
    const userId = `user-${uniqueIp()}`;
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) call(signupLimit, makeReq(ip, userId));

    expect(call(signupLimit, makeReq(uniqueIp(), userId)).next).toHaveBeenCalledTimes(1);
  });
});

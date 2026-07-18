import { describe, it, expect, vi, beforeAll } from "vitest";
import jwt from "jsonwebtoken";

// Fixed test secret — must be set BEFORE server/auth is imported, because
// the module caches the resolved secret on first use.
const TEST_SECRET = "test-jwt-secret-for-vitest-only";
process.env.JWT_SECRET = TEST_SECRET;

// server/auth imports ./storage (which pulls in the db). Mock it so tests
// need no database connection.
vi.mock("../storage", () => ({
  storage: {},
}));

import { AuthService, type JWTPayload } from "../auth";

const basePayload: JWTPayload = {
  id: "user-123",
  username: "alice",
  email: "alice@example.com",
};

describe("AuthService JWT", () => {
  it("sign/verify roundtrip preserves the payload", () => {
    const token = AuthService.generateToken(basePayload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = AuthService.verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified).toMatchObject({
      id: "user-123",
      username: "alice",
      email: "alice@example.com",
    });
  });

  it("includes issuer, audience, and 7-day expiry claims", () => {
    const token = AuthService.generateToken(basePayload);
    const decoded = jwt.decode(token) as Record<string, any>;
    expect(decoded.iss).toBe("streamaix");
    expect(decoded.aud).toBe("streamaix-users");
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ ...basePayload }, TEST_SECRET, {
      expiresIn: "-1s",
      issuer: "streamaix",
      audience: "streamaix-users",
    });
    expect(AuthService.verifyToken(expired)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = AuthService.generateToken(basePayload);
    const [header, payload, signature] = token.split(".");

    // Forge the payload (change the user id) but keep the original signature
    const forged = Buffer.from(
      JSON.stringify({
        ...(JSON.parse(Buffer.from(payload, "base64url").toString()) as object),
        id: "attacker-999",
      }),
    ).toString("base64url");

    expect(AuthService.verifyToken(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const foreign = jwt.sign({ ...basePayload }, "some-other-secret", {
      expiresIn: "7d",
      issuer: "streamaix",
      audience: "streamaix-users",
    });
    expect(AuthService.verifyToken(foreign)).toBeNull();
  });

  it("rejects a token with the wrong issuer/audience", () => {
    const wrongIssuer = jwt.sign({ ...basePayload }, TEST_SECRET, {
      expiresIn: "7d",
      issuer: "not-streamaix",
      audience: "streamaix-users",
    });
    expect(AuthService.verifyToken(wrongIssuer)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(AuthService.verifyToken("not-a-token")).toBeNull();
    expect(AuthService.verifyToken("")).toBeNull();
  });
});

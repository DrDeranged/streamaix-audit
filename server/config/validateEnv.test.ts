import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateEnv } from "./validateEnv";

// A known-checksummed address (mixed case) and its all-lowercase form.
const CHECKSUMMED = "0x52908400098527886E0F7030069857D2E4169EE7";
const LOWERCASE = CHECKSUMMED.toLowerCase();

describe("validateEnv", () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    // Clean slate for the vars we care about.
    for (const k of [
      "NODE_ENV",
      "DATABASE_URL",
      "JWT_SECRET",
      "ANTHROPIC_API_KEY",
      "SWAPS_ENABLED",
      "ZEROX_API_KEY",
      "TREASURY_ADDRESS",
      "BRIDGE_ENABLED",
      "ONCHAIN_ENABLED",
      "ONCHAIN_WRITES_ENABLED",
      "SERVICE_SIGNER_PRIVATE_KEY",
    ]) {
      delete process.env[k];
    }
  });

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it("returns missing names and does NOT throw in dev", () => {
    process.env.NODE_ENV = "development";
    const r = validateEnv();
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(
      expect.arrayContaining(["DATABASE_URL", "JWT_SECRET", "ANTHROPIC_API_KEY"]),
    );
  });

  it("throws in production when core secrets are missing", () => {
    process.env.NODE_ENV = "production";
    expect(() => validateEnv()).toThrowError(/DATABASE_URL/);
  });

  it("passes when all core secrets present (dev)", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgres://x";
    process.env.JWT_SECRET = "s";
    process.env.ANTHROPIC_API_KEY = "k";
    const r = validateEnv();
    expect(r.ok).toBe(true);
    expect(r.missing).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
    expect(info).toHaveBeenCalledExactlyOnceWith(
      "[env] validated: 3 required present, flags: ONCHAIN_WRITES_ENABLED=false,BRIDGE_ENABLED=false,SWAPS_ENABLED=false,SIGNALS_ENABLED=false",
    );
    info.mockRestore();
  });

  it("SWAPS_ENABLED requires ZEROX_API_KEY and checksummed TREASURY_ADDRESS", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgres://x";
    process.env.JWT_SECRET = "s";
    process.env.ANTHROPIC_API_KEY = "k";
    process.env.SWAPS_ENABLED = "true";
    // no ZEROX_API_KEY, no TREASURY_ADDRESS
    let r = validateEnv();
    expect(r.errors.some((e) => e.includes("ZEROX_API_KEY"))).toBe(true);
    expect(r.errors.some((e) => e.includes("TREASURY_ADDRESS"))).toBe(true);

    // non-checksummed treasury is rejected
    process.env.ZEROX_API_KEY = "z";
    process.env.TREASURY_ADDRESS = LOWERCASE;
    r = validateEnv();
    expect(r.errors.some((e) => e.includes("checksummed"))).toBe(true);

    // valid checksummed treasury + key → no swap errors
    process.env.TREASURY_ADDRESS = CHECKSUMMED;
    r = validateEnv();
    expect(r.errors).toHaveLength(0);
    expect(r.ok).toBe(true);
  });

  it("BRIDGE_ENABLED / ONCHAIN_ENABLED require SERVICE_SIGNER_PRIVATE_KEY", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgres://x";
    process.env.JWT_SECRET = "s";
    process.env.ANTHROPIC_API_KEY = "k";

    process.env.BRIDGE_ENABLED = "true";
    let r = validateEnv();
    expect(r.errors.some((e) => e.includes("SERVICE_SIGNER_PRIVATE_KEY"))).toBe(true);

    delete process.env.BRIDGE_ENABLED;
    process.env.ONCHAIN_ENABLED = "true";
    r = validateEnv();
    expect(r.errors.some((e) => e.includes("SERVICE_SIGNER_PRIVATE_KEY"))).toBe(true);

    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xabc";
    r = validateEnv();
    expect(r.errors).toHaveLength(0);
  });
});

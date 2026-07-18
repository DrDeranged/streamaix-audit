import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { assertMainnetSafety } from "./roles";

const ORIGINAL = process.env.ADMIN_MULTISIG_ADDRESS;

describe("assertMainnetSafety", () => {
  beforeEach(() => {
    delete process.env.ADMIN_MULTISIG_ADDRESS;
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.ADMIN_MULTISIG_ADDRESS;
    else process.env.ADMIN_MULTISIG_ADDRESS = ORIGINAL;
  });

  it("refuses Base mainnet (8453) when ADMIN_MULTISIG_ADDRESS is unset", () => {
    expect(() => assertMainnetSafety(8453n)).toThrow(/REFUSING to deploy to Base mainnet/);
  });

  it("allows Base mainnet when ADMIN_MULTISIG_ADDRESS is set", () => {
    process.env.ADMIN_MULTISIG_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    expect(() => assertMainnetSafety(8453n)).not.toThrow();
  });

  it("allows testnets without a multisig", () => {
    expect(() => assertMainnetSafety(84532n)).not.toThrow();
    expect(() => assertMainnetSafety(31337n)).not.toThrow();
  });
});

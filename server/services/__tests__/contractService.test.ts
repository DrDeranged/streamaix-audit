import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- ethers mock -------------------------------------------------------------
const ethersState: {
  hasRole: boolean;
  roleLookupFails: boolean;
  mintFails: boolean;
} = { hasRole: true, roleLookupFails: false, mintFails: false };

vi.mock("ethers", () => {
  class MockWallet {
    address = "0xSERVICE";
    constructor(_key: string, _provider?: any) {}
  }
  class MockContract {
    interface = { parseLog: () => null };
    constructor(_addr: string, _abi: any[], _signerOrProvider?: any) {}
    async MINTER_ROLE() {
      if (ethersState.roleLookupFails) throw new Error("call revert");
      return "0xMINTER";
    }
    async RESOLVER_ROLE() {
      return "0xRESOLVER";
    }
    async hasRole(_role: string, _addr: string) {
      if (ethersState.roleLookupFails) throw new Error("call revert");
      return ethersState.hasRole;
    }
    async mint(_to: string, _amount: string) {
      if (ethersState.mintFails) throw new Error("execution reverted");
      return {
        wait: async () => ({ hash: "0xtx123", gasUsed: 21000n, logs: [] }),
      };
    }
  }
  class MockProvider {
    constructor(_url: string) {}
  }
  return {
    ethers: { JsonRpcProvider: MockProvider, Wallet: MockWallet },
    Contract: MockContract,
  };
});

// ---- db mock ------------------------------------------------------------------
const dbState: { inserted: Array<{ table: any; values: any }> } = { inserted: [] };
vi.mock("../../db", () => ({
  db: {
    insert: (table: any) => ({
      values: async (v: any) => {
        dbState.inserted.push({ table, values: v });
      },
    }),
  },
}));

import { ContractService, getServiceSignerKey } from "../contractService";
import { onchainActions } from "@shared/schema";

const addresses = {
  streamToken: "0xToken",
  summaryNFT: "0xNFT",
  staking: "0xStaking",
  bountyBoard: "0xBounty",
};

function makeService() {
  return new ContractService("http://localhost:8545", addresses);
}

function auditRows() {
  return dbState.inserted.filter((i) => i.table === onchainActions).map((i) => i.values);
}

beforeEach(() => {
  dbState.inserted.length = 0;
  ethersState.hasRole = true;
  ethersState.roleLookupFails = false;
  ethersState.mintFails = false;
  delete process.env.ONCHAIN_WRITES_ENABLED;
  delete process.env.SERVICE_SIGNER_PRIVATE_KEY;
  delete process.env.PRIVATE_KEY;
});

describe("service signer key", () => {
  it("throws a deprecation error when only PRIVATE_KEY is set", () => {
    process.env.PRIVATE_KEY = "0xlegacy";
    expect(() => getServiceSignerKey()).toThrow(/DEPRECATED/);
  });

  it("throws when no key is configured at all", () => {
    expect(() => getServiceSignerKey()).toThrow(/SERVICE_SIGNER_PRIVATE_KEY is not configured/);
  });

  it("returns SERVICE_SIGNER_PRIVATE_KEY when set", () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    process.env.PRIVATE_KEY = "0xlegacy";
    expect(getServiceSignerKey()).toBe("0xservice");
  });
});

describe("ONCHAIN_WRITES_ENABLED kill switch", () => {
  it("mintTokens throws a clear disabled error when flag is off (default)", async () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    const svc = makeService();
    await expect(svc.mintTokens("0xrecipient", "1000")).rejects.toThrow(/On-chain writes disabled/);
    expect(auditRows().length).toBe(0);
  });

  it("all other write paths are gated too", async () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    const svc = makeService();
    await expect(svc.completeBountyOnChain(1)).rejects.toThrow(/On-chain writes disabled/);
    await expect(svc.unstake("100")).rejects.toThrow(/On-chain writes disabled/);
    await expect(svc.mintSummaryNFT("0xr", "ipfs", "ar")).rejects.toThrow(/On-chain writes disabled/);
  });
});

describe("role pre-flight", () => {
  it("fails fast with a clear error when signer lacks MINTER_ROLE", async () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    ethersState.hasRole = false;
    const svc = makeService();
    await expect(svc.mintTokens("0xrecipient", "1000")).rejects.toThrow(/does NOT hold MINTER_ROLE/);
    expect(auditRows().length).toBe(0);
  });

  it("fails fast when the role check itself cannot be performed", async () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    ethersState.roleLookupFails = true;
    const svc = makeService();
    await expect(svc.mintTokens("0xrecipient", "1000")).rejects.toThrow(/Role pre-flight failed/);
  });
});

describe("audit rows and structured logging", () => {
  it("writes a success onchain_actions row with txHash and gasUsed on mint", async () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    const svc = makeService();
    const txHash = await svc.mintTokens("0xrecipient", "1000");
    expect(txHash).toBe("0xtx123");
    const rows = auditRows();
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatchObject({
      action: "mintTokens",
      txHash: "0xtx123",
      gasUsed: "21000",
      status: "success",
    });
    expect(rows[0].args).toMatchObject({ recipientAddress: "0xrecipient", amount: "1000" });
  });

  it("writes a failed onchain_actions row when the transaction reverts", async () => {
    process.env.SERVICE_SIGNER_PRIVATE_KEY = "0xservice";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    ethersState.mintFails = true;
    const svc = makeService();
    await expect(svc.mintTokens("0xrecipient", "1000")).rejects.toThrow(/execution reverted/);
    const rows = auditRows();
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatchObject({ action: "mintTokens", status: "failed" });
    expect(rows[0].error).toMatch(/execution reverted/);
  });
});

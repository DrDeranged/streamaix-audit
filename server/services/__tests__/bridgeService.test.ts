import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock: FIFO queue of select results; insert/update recorded ----------
const dbState: {
  selectResults: any[][];
  inserted: Array<{ table: any; values: any }>;
  updated: Array<{ table: any; values: any }>;
} = { selectResults: [], inserted: [], updated: [] };

function makeSelectChain() {
  const chain: any = {};
  const self = () => chain;
  for (const m of ["from", "where", "orderBy", "limit"]) chain[m] = self;
  chain.then = (resolve: any, reject: any) => {
    const next = dbState.selectResults.length ? dbState.selectResults.shift() : [];
    return Promise.resolve(next).then(resolve, reject);
  };
  return chain;
}

vi.mock("../../db", () => ({
  db: {
    select: () => makeSelectChain(),
    insert: (table: any) => ({
      values: (v: any) => {
        dbState.inserted.push({ table, values: v });
        return {
          returning: async () => [{ id: "req-new", createdAt: new Date(), decidedBy: null, txHash: null, ...v }],
          then: (resolve: any) => Promise.resolve(undefined).then(resolve),
        };
      },
    }),
    update: (table: any) => ({
      set: (v: any) => {
        dbState.updated.push({ table, values: v });
        const chain: any = {
          where: () => chain,
          returning: async () => [{ id: "req-1", ...v }],
          then: (resolve: any) => Promise.resolve(undefined).then(resolve),
        };
        return chain;
      },
    }),
  },
}));

const getBalanceMock = vi.fn(async () => 1000);
vi.mock("../pointsService", () => ({
  pointsService: { getBalance: (...args: any[]) => getBalanceMock(...args) },
}));

const mintTokensMock = vi.fn(async () => "0xtxhash");
vi.mock("../contractService", () => ({
  getContractService: () => ({ mintTokens: (...args: any[]) => mintTokensMock(...args) }),
  onchainWritesEnabled: () => process.env.ONCHAIN_WRITES_ENABLED === "true",
}));

import { BridgeService, BridgeDisabledError } from "../bridgeService";
import { bridgeRequests } from "@shared/schema";

const svc = new BridgeService();

beforeEach(() => {
  dbState.selectResults.length = 0;
  dbState.inserted.length = 0;
  dbState.updated.length = 0;
  getBalanceMock.mockClear();
  mintTokensMock.mockClear();
  delete process.env.BRIDGE_ENABLED;
  delete process.env.ONCHAIN_WRITES_ENABLED;
});

describe("BridgeService.requestWithdrawal", () => {
  it("throws BridgeDisabledError when BRIDGE_ENABLED is off (default)", async () => {
    await expect(svc.requestWithdrawal("user-1", 100)).rejects.toThrow("bridge not yet enabled");
    await expect(svc.requestWithdrawal("user-1", 100)).rejects.toBeInstanceOf(BridgeDisabledError);
    expect(dbState.inserted.length).toBe(0);
  });

  it("rejects when balance is insufficient", async () => {
    process.env.BRIDGE_ENABLED = "true";
    getBalanceMock.mockResolvedValueOnce(50);
    await expect(svc.requestWithdrawal("user-1", 100)).rejects.toThrow(/Insufficient balance/);
    expect(dbState.inserted.length).toBe(0);
  });

  it("rejects non-positive or non-integer points", async () => {
    process.env.BRIDGE_ENABLED = "true";
    await expect(svc.requestWithdrawal("user-1", 0)).rejects.toThrow(/positive integer/);
    await expect(svc.requestWithdrawal("user-1", 10.5)).rejects.toThrow(/positive integer/);
  });

  it("writes a pending bridge_requests row when enabled and balance is sufficient", async () => {
    process.env.BRIDGE_ENABLED = "true";
    const row = await svc.requestWithdrawal("user-1", 100);
    expect(row.status).toBe("pending");
    const rows = dbState.inserted.filter((i) => i.table === bridgeRequests);
    expect(rows.length).toBe(1);
    expect(rows[0].values).toMatchObject({ userId: "user-1", points: 100, status: "pending" });
  });
});

describe("BridgeService.approveRequest", () => {
  it("throws when BRIDGE_ENABLED is off even for admins", async () => {
    await expect(svc.approveRequest("req-1", "admin-1")).rejects.toThrow("bridge not yet enabled");
    expect(mintTokensMock).not.toHaveBeenCalled();
  });

  it("throws when BRIDGE_ENABLED is on but ONCHAIN_WRITES_ENABLED is off — both flags required", async () => {
    process.env.BRIDGE_ENABLED = "true";
    await expect(svc.approveRequest("req-1", "admin-1")).rejects.toThrow(/On-chain writes disabled/);
    expect(mintTokensMock).not.toHaveBeenCalled();
  });

  it("mints via contractService and marks minted when both flags are on", async () => {
    process.env.BRIDGE_ENABLED = "true";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    dbState.selectResults.push([{ id: "req-1", userId: "user-1", points: 100, status: "pending" }]);
    dbState.selectResults.push([{ id: "user-1", walletAddress: "0xabc" }]);
    const row = await svc.approveRequest("req-1", "admin-1");
    expect(mintTokensMock).toHaveBeenCalledWith("0xabc", expect.any(String));
    expect(row.status).toBe("minted");
    expect(row.txHash).toBe("0xtxhash");
    const approvals = dbState.updated.map((u) => u.values);
    expect(approvals[0]).toMatchObject({ status: "approved", decidedBy: "admin-1" });
    expect(approvals[1]).toMatchObject({ status: "minted", txHash: "0xtxhash" });
  });

  it("reverts the request to pending if the mint fails, so it can be retried", async () => {
    process.env.BRIDGE_ENABLED = "true";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    dbState.selectResults.push([{ id: "req-1", userId: "user-1", points: 100, status: "pending" }]);
    dbState.selectResults.push([{ id: "user-1", walletAddress: "0xabc" }]);
    mintTokensMock.mockRejectedValueOnce(new Error("execution reverted"));
    await expect(svc.approveRequest("req-1", "admin-1")).rejects.toThrow(/execution reverted/);
    const updates = dbState.updated.map((u) => u.values);
    expect(updates[0]).toMatchObject({ status: "approved", decidedBy: "admin-1" });
    expect(updates[1]).toMatchObject({ status: "pending", decidedBy: null });
  });

  it("refuses to approve a non-pending request", async () => {
    process.env.BRIDGE_ENABLED = "true";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    dbState.selectResults.push([{ id: "req-1", userId: "user-1", points: 100, status: "minted" }]);
    await expect(svc.approveRequest("req-1", "admin-1")).rejects.toThrow(/only pending/);
    expect(mintTokensMock).not.toHaveBeenCalled();
  });

  it("refuses to mint when user has no wallet address", async () => {
    process.env.BRIDGE_ENABLED = "true";
    process.env.ONCHAIN_WRITES_ENABLED = "true";
    dbState.selectResults.push([{ id: "req-1", userId: "user-1", points: 100, status: "pending" }]);
    dbState.selectResults.push([{ id: "user-1", walletAddress: null }]);
    await expect(svc.approveRequest("req-1", "admin-1")).rejects.toThrow(/no wallet address/);
    expect(mintTokensMock).not.toHaveBeenCalled();
  });
});

describe("BridgeService.rejectRequest", () => {
  it("marks a pending request rejected with decidedBy", async () => {
    process.env.BRIDGE_ENABLED = "true";
    dbState.selectResults.push([{ id: "req-1", userId: "user-1", points: 100, status: "pending" }]);
    const row = await svc.rejectRequest("req-1", "admin-1");
    expect(row.status).toBe("rejected");
    expect(dbState.updated[0].values).toMatchObject({ status: "rejected", decidedBy: "admin-1" });
  });
});

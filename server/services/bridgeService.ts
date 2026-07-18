import { eq } from 'drizzle-orm';
import { db } from '../db';
import { bridgeRequests, users, type BridgeRequest } from '@shared/schema';
import { pointsService } from './pointsService';
import { getContractService, onchainWritesEnabled } from './contractService';
import { ethers } from 'ethers';

/**
 * Points-to-token bridge — DORMANT BY DESIGN.
 *
 * The entire feature is behind BRIDGE_ENABLED (default false). There is NO
 * automatic minting path: a request only ever becomes a token via an explicit
 * human admin approval, which is additionally gated by ONCHAIN_WRITES_ENABLED.
 * Both flags plus a human decision are required for any token to mint.
 * See replit.md "TOKEN BRIDGE" section before touching either flag.
 */

export function bridgeEnabled(): boolean {
  return process.env.BRIDGE_ENABLED === 'true';
}

export class BridgeDisabledError extends Error {
  constructor() {
    super('bridge not yet enabled');
    this.name = 'BridgeDisabledError';
  }
}

export class BridgeService {
  private assertBridgeEnabled(): void {
    if (!bridgeEnabled()) {
      throw new BridgeDisabledError();
    }
  }

  /**
   * Create a pending withdrawal request. Validates the user's points balance.
   * Does NOT deduct points and does NOT mint anything.
   */
  async requestWithdrawal(userId: string, points: number): Promise<BridgeRequest> {
    this.assertBridgeEnabled();

    if (!Number.isInteger(points) || points <= 0) {
      throw new Error('points must be a positive integer');
    }

    const balance = await pointsService.getBalance(userId);
    if (balance < points) {
      throw new Error(`Insufficient balance: have ${balance}, requested ${points}`);
    }

    const [row] = await db
      .insert(bridgeRequests)
      .values({ userId, points, status: 'pending' })
      .returning();
    return row;
  }

  /**
   * Explicit human admin approval. Additionally gated by ONCHAIN_WRITES_ENABLED —
   * both flags must be on for a mint to happen.
   */
  async approveRequest(requestId: string, adminUserId: string): Promise<BridgeRequest> {
    this.assertBridgeEnabled();

    if (!onchainWritesEnabled()) {
      throw new Error(
        'On-chain writes disabled: ONCHAIN_WRITES_ENABLED is not \'true\'. Bridge approvals cannot mint tokens until the kill switch is deliberately lifted.'
      );
    }

    const [request] = await db
      .select()
      .from(bridgeRequests)
      .where(eq(bridgeRequests.id, requestId))
      .limit(1);
    if (!request) {
      throw new Error('Bridge request not found');
    }
    if (request.status !== 'pending') {
      throw new Error(`Bridge request is '${request.status}', only pending requests can be approved`);
    }

    const [user] = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);
    if (!user?.walletAddress) {
      throw new Error('User has no wallet address on file; cannot mint');
    }

    // Mark approved (records the human decision) before attempting the mint.
    await db
      .update(bridgeRequests)
      .set({ status: 'approved', decidedBy: adminUserId })
      .where(eq(bridgeRequests.id, requestId));

    const amountWei = ethers.parseEther(String(request.points)).toString();
    let txHash: string;
    try {
      txHash = await getContractService().mintTokens(user.walletAddress, amountWei);
    } catch (e) {
      // Revert to pending so a failed mint attempt never strands the request;
      // the admin can retry once the underlying issue is fixed.
      await db
        .update(bridgeRequests)
        .set({ status: 'pending', decidedBy: null })
        .where(eq(bridgeRequests.id, requestId));
      throw e;
    }

    const [updated] = await db
      .update(bridgeRequests)
      .set({ status: 'minted', txHash })
      .where(eq(bridgeRequests.id, requestId))
      .returning();
    return updated;
  }

  async rejectRequest(requestId: string, adminUserId: string): Promise<BridgeRequest> {
    this.assertBridgeEnabled();

    const [request] = await db
      .select()
      .from(bridgeRequests)
      .where(eq(bridgeRequests.id, requestId))
      .limit(1);
    if (!request) {
      throw new Error('Bridge request not found');
    }
    if (request.status !== 'pending') {
      throw new Error(`Bridge request is '${request.status}', only pending requests can be rejected`);
    }

    const [updated] = await db
      .update(bridgeRequests)
      .set({ status: 'rejected', decidedBy: adminUserId })
      .where(eq(bridgeRequests.id, requestId))
      .returning();
    return updated;
  }
}

export const bridgeService = new BridgeService();

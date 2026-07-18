import type { Express, Response } from "express";
import { authenticateToken, type AuthRequest } from "../auth";
import { requireAdmin, asyncHandler } from "./_shared";
import { strictLimit, validateBody } from "../middleware/security";
import { bridgeWithdrawSchema, bridgeRequestParamsSchema } from "../middleware/validationSchemas";
import { bridgeService, bridgeEnabled, BridgeDisabledError } from "../services/bridgeService";

/**
 * Points-to-token bridge routes — DORMANT BY DESIGN (BRIDGE_ENABLED=false).
 * Approval is an explicit human admin action, additionally gated by
 * ONCHAIN_WRITES_ENABLED. See replit.md "TOKEN BRIDGE" section.
 */
export async function registerBridgeRoutes(app: Express): Promise<void> {
  app.post(
    "/api/bridge/withdraw",
    authenticateToken,
    strictLimit,
    validateBody(bridgeWithdrawSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      if (!bridgeEnabled()) {
        return res.status(403).json({ error: "bridge not yet enabled" });
      }
      try {
        const request = await bridgeService.requestWithdrawal(req.user!.id, req.body.points);
        res.json({ success: true, request });
      } catch (e: any) {
        if (e instanceof BridgeDisabledError) {
          return res.status(403).json({ error: "bridge not yet enabled" });
        }
        res.status(400).json({ error: e.message });
      }
    })
  );

  app.post(
    "/api/admin/bridge/:id/approve",
    authenticateToken,
    requireAdmin,
    strictLimit,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const params = bridgeRequestParamsSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({ error: "Invalid bridge request id" });
      }
      if (!bridgeEnabled()) {
        return res.status(403).json({ error: "bridge not yet enabled" });
      }
      try {
        const request = await bridgeService.approveRequest(params.data.id, req.user!.id);
        res.json({ success: true, request });
      } catch (e: any) {
        if (e instanceof BridgeDisabledError) {
          return res.status(403).json({ error: "bridge not yet enabled" });
        }
        res.status(400).json({ error: e.message });
      }
    })
  );

  app.post(
    "/api/admin/bridge/:id/reject",
    authenticateToken,
    requireAdmin,
    strictLimit,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const params = bridgeRequestParamsSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({ error: "Invalid bridge request id" });
      }
      if (!bridgeEnabled()) {
        return res.status(403).json({ error: "bridge not yet enabled" });
      }
      try {
        const request = await bridgeService.rejectRequest(params.data.id, req.user!.id);
        res.json({ success: true, request });
      } catch (e: any) {
        if (e instanceof BridgeDisabledError) {
          return res.status(403).json({ error: "bridge not yet enabled" });
        }
        res.status(400).json({ error: e.message });
      }
    })
  );
}

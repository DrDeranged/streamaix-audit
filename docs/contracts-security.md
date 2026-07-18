# Contract Security: Role Model & Operational Rules

## Why

Previously the deployer key was a single `Ownable` owner with **unlimited mint
authority** on StreamToken and SummaryNFT — and that key lived in the server
environment (`PRIVATE_KEY`). A single leaked secret meant unlimited token
inflation. The contracts now use OpenZeppelin `AccessControl` to split
privileges and cap the damage any single key can do.

## Role model

| Role | Contracts | Powers | Intended holder |
|---|---|---|---|
| `DEFAULT_ADMIN_ROLE` | StreamToken, SummaryNFT, PredictionMarketFactory | Set mint caps, pause/unpause, grant/revoke roles, rotate resolver, manage fees | **Multisig or hardware wallet only** |
| `MINTER_ROLE` | StreamToken, SummaryNFT | Mint, subject to caps and pause | Backend service key (`SERVICE_SIGNER_ADDRESS`) |
| `RESOLVER_ROLE` | PredictionMarketFactory | Resolve markets | Backend service key |

The admin can rotate the resolver key at any time without redeploying:
`rotateResolver(oldResolver, newResolver)` (or plain `grantRole`/`revokeRole`).

## On-chain mint limits (StreamToken)

- `MAX_SUPPLY`: 1,000,000,000 STREAM (hard cap, unchanged).
- `maxMintPerTx` — default **100,000 STREAM** per transaction. Admin-settable
  (`setMaxMintPerTx`, emits `MaxMintPerTxUpdated`).
- `maxMintPerDay` — default **500,000 STREAM** per **rolling 24-hour window**
  across all minters, enforced on-chain via 24 hourly buckets (each mint
  counts against the trailing 24 hours, not a calendar day; `mintedLast24h()`
  exposes the current window total). Admin-settable (`setMaxMintPerDay`,
  emits `MaxMintPerDayUpdated`).
- `pause()` / `unpause()` — admin-only circuit breaker gating **mint, burn,
  and transfer** (StreamToken) and **mint and transfer** (SummaryNFT).

Worst case if the service (minter) key leaks: at most `maxMintPerDay` tokens
per day until the admin pauses or revokes the role — not the whole supply.

## Deployment flow

Both `scripts/deploy.ts` and `scripts/deploy-base.ts` follow this sequence
(shared logic in `scripts/roles.ts`):

1. Deploy with the deployer as **temporary** admin.
2. Grant `MINTER_ROLE` / `RESOLVER_ROLE` to `SERVICE_SIGNER_ADDRESS` (env).
3. Grant `DEFAULT_ADMIN_ROLE` to `ADMIN_MULTISIG_ADDRESS` (env).
4. Deployer **renounces** `DEFAULT_ADMIN_ROLE` — it ends with no roles.

The scripts **refuse to run against Base mainnet (chain 8453) if
`ADMIN_MULTISIG_ADDRESS` is unset.** On testnets, missing env values produce
loud warnings instead.

## Operational rules (non-negotiable)

- The **admin key must live on a hardware wallet or multisig — NEVER in
  Replit secrets or any server environment.**
- Only the limited `MINTER_ROLE` / `RESOLVER_ROLE` service key may live in the
  deployment environment (`SERVICE_SIGNER_ADDRESS` identifies its address; its
  private key is the only signing key the backend should hold).
- If the service key is suspected compromised: admin calls `pause()` on the
  tokens, `revokeRole(MINTER_ROLE, ...)`, and `rotateResolver(...)`. No
  redeploy needed.
- Cap or role changes are on-chain governance actions — all emit events
  (`MaxMintPerTxUpdated`, `MaxMintPerDayUpdated`, `ResolverRotated`,
  `FeeRecipientUpdated`, plus standard `RoleGranted`/`RoleRevoked`), so they
  are auditable on Basescan.

## Tests

`test/roles-and-caps.test.cjs` (run with `npx hardhat test`) covers: non-minter
mint reverts, per-tx cap, daily cap enforcement and next-day reset, pause
blocking mint/transfer, resolver rotation, and admin handoff leaving the
deployer with zero roles.

> Note: `server/services/contractService.ts` has NOT been migrated to the new
> ABIs yet; this change is Solidity + deployment scripts only.

---
name: Swap rail dormant discipline
description: Conventions for the non-custodial Base swap rail and how to safely enable it later.
---

# Rule
The Base swap rail ships dormant: `SWAPS_ENABLED` unset/false makes all public `/api/swap/*` routes 403 and the service throw. Admin allowlist CRUD is intentionally NOT gated (admins curate pre-launch) but is auth+admin guarded.

**Why:** Real-money surface; same fail-closed discipline as the bridge (`BRIDGE_ENABLED`).

**How to apply:** To enable, set `SWAPS_ENABLED=true` plus `ZEROEX_API_KEY` and `TREASURY_ADDRESS` (quote calls fail explicitly without them). Optional: `SWAP_FEE_BPS` (default 30), `SWAP_DAILY_QUOTE_CAP_USD` (default 25000), `SWAP_UNKNOWN_NOTIONAL_USD` (default 1000), `VITE_WALLETCONNECT_PROJECT_ID` (adds WalletConnect wallet to RainbowKit list).

# Gotchas
- Trade recording must stay chain-verified (tx sender + success receipt via Base RPC) — the endpoint is otherwise forgeable.
- Daily quote cap notional falls back: 0x USD fields → USDC leg → conservative per-quote default. Never let unknown notional count as $0.
- Daily cap tracker is in-memory per process; resets on restart (accepted soft-cap tradeoff).
- Legacy ethers `useWeb3` stack coexists with the new wagmi/RainbowKit stack; desktop nav uses the new ConnectButton, mobile menu still uses the legacy wallet modal.

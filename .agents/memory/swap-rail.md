---
name: Dormant real-money features (swaps & signals)
description: Fail-closed flag discipline and non-obvious safeguards for the swap rail and agent signals.
---

# Rule
Real-money / compliance-sensitive features ship dark behind fail-closed env flags (`SWAPS_ENABLED`, `SIGNALS_ENABLED`, like `BRIDGE_ENABLED`). Flipping any of them is a human business/legal decision — never treat the 403s as bugs. Policy details live in replit.md.

**Why:** Legal review precedes launch; agents must not "helpfully" enable them.

# Non-obvious safeguards to preserve
- Trade recording must stay chain-verified (tx sender + success receipt via Base RPC) — the endpoint is otherwise forgeable.
- Daily quote cap notional must never default to $0 when 0x omits USD fields (falls back USDC leg → conservative per-quote charge).
- Every model-controlled user-visible signal field (thesis, invalidation, keyEvidence items) must pass the banned-advice-verb check; validation lives in shared/agentSignals.ts so client/server/tests share it.
- No auto-execution anywhere: signals only prefill the swap card (5% balance cap, user-editable); the user's wallet signs.
- Legacy ethers `useWeb3` stack coexists with wagmi/RainbowKit; mobile menu still uses the legacy wallet modal.

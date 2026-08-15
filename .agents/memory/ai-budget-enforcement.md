---
name: AI budget enforcement
description: Rules for keeping the daily AI budget brake intact when adding AI calls.
---

# Rule
Every model-gateway call must pass `priority` ("user"|"background") + `tag` (kebab-case call-site label) — the fields are required by the type, so tsc catches omissions. Whisper/TTS calls (outside the gateway) must call `enforceBudget` before and record spend after.

**Why:** The daily budget brake (`DAILY_AI_BUDGET_USD`) sheds cosmetic background calls at 80%, blocks all background at 100%, blocks user calls at 150% (503). Misclassifying a user-facing call as background makes it die a day early; forgetting spend recording makes the meter blind.

**How to apply:**
- Cosmetic shed list lives in `COSMETIC_TAGS` (modelGateway) — keep tags stable; adding a tag there opts that call into first-tier shedding.
- Ledger flushes in 60s batches; partial-flush failure must re-queue ONLY unapplied rows (double-count corrupts the persisted meter — this bug was caught in review once already).
- Enforcement fails OPEN if the ledger errors (broken meter must not take down AI); the ledger self-bootstraps its table on fresh DBs because db:push is blocked.
- Known accepted limitation: no cross-process reservation — the ceiling is soft by up to one flush window; fine for single-instance deploys.

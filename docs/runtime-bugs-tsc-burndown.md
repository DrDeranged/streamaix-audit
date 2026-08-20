# Known Runtime Bugs (found during TypeScript burn-down, 2026-08-15)

These are genuine runtime defects discovered while eliminating all tsc errors.
Per policy, behavior was NOT changed silently — the code was typed to reflect
what it actually does (including crashing paths). Each item needs a deliberate fix.

Legend: **[A]** = ambiguous, left in place pending a product/architecture decision.
Items that have been fixed (or were already fixed) have been removed from this list.

## Remaining ambiguous items ([A] — do NOT auto-fix)

None. The product decisions for all previously ambiguous items were made and
implemented on 2026-08-20.

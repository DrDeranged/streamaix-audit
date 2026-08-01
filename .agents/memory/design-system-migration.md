---
name: Design system migration
description: Conventions and pitfalls for migrating StreamAiX pages to the DESIGN.md token system
---

- DESIGN.md is the contract; ds/ primitives live in `client/src/components/ds/`. Migrated files must be listed in `scripts/design-migrated.txt` for `npm run design:lint` to enforce them.
- Token naming deviations from the original spec (to avoid clobbering shadcn vars): the violet accent is `--accent-core` (not `--accent`); `text-primary/body/secondary/muted` are un-layered CSS overrides at the end of `index.css` that win over shadcn-generated utilities.
- **Why:** shadcn `--primary`/`--accent` vars still power ui/ components; redefining them would restyle every unmigrated surface.
- Delegated bulk restyles (design subagents editing large tsx files) repeatedly produced corrupted className strings — missing closing quotes, duplicated tokens, invalid opacity forms like `gain/500/30`, empty variants (`hover: `, `data-[state=active]: `, `hover:hover:`), and even behavior changes (swapped image fallbacks). **How to apply:** design-lint now greps for these malformed patterns; still diff-review delegated output for non-class changes, and never run whitespace-collapsing seds (`s/  +/ /g`) on whole files — they destroy indentation.
- Authoritative tsc baseline: 370 pre-existing errors repo-wide (cold cache). Gate new work by diffing error sets against a stored baseline log, not by exit code.

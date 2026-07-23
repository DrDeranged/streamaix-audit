---
name: Replit lockfile proxy contamination
description: Every npm install inside Replit rewrites package-lock.json resolved URLs to the package firewall proxy; must scrub after each install.
---

# Lockfile proxy contamination

Rule: after ANY npm package install in this repl, run `npm run lockfile:scrub` (scripts/scrub-lockfile.sh) before finishing the task.

**Why:** Replit's package firewall rewrites `resolved` URLs in package-lock.json to `http://package-firewall.replit.local/npm/...`, which breaks installs/builds outside Replit (e.g. the GitHub audit mirror). It recurs on every install — scrubbing once is not enough.

**How to apply:** installLanguagePackages → then `npm run lockfile:scrub` → verify zero `package-firewall.replit.local` occurrences remain.

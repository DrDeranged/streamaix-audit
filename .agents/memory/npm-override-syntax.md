---
name: npm overrides $dep syntax
description: Fixing EOVERRIDE when a package is both a direct dependency and in overrides.
---

- If a package is a direct dependency AND listed in `overrides`, a literal version spec in overrides throws EOVERRIDE. Use the reference form: `"axios": "$axios"` — it pins transitive copies to the direct dependency's version.
- **Why:** npm forbids an override that conflicts with a direct dependency spec; `$dep` delegates to it.
- **How to apply:** direct-bump the dependency, add `"<name>": "$<name>"` in overrides, then `npm run lockfile:scrub`. Also: recurring ENOTEMPTY during installs = stale `node_modules/**/.<name>-XXXX` temp dirs; delete them and retry. `npm audit fix` is broken (npm bug) — use overrides instead.

---
name: Hardhat scripts under ESM
description: Why hardhat TS scripts break in this repo and how to write them so they run
---

Rule: This project is `"type": "module"`, but Hardhat is CommonJS. Any script run via `npx hardhat run` must use `import hre from "hardhat"; const { ethers } = hre;` (named `import { ethers } from "hardhat"` fails), `import.meta.url` instead of `__dirname`, and relative imports with an explicit `.ts` extension. Shared helper modules for deploy scripts must not import "hardhat" at all — read on-chain values (e.g. role ids) from contract instances instead.

**Why:** Named imports from a CJS package fail under Node ESM resolution; this is the historical reason several deploy scripts exist as `.cjs` duplicates.

**How to apply:** When writing or editing anything under `scripts/` that Hardhat executes, follow the pattern above; smoke-test with `npx hardhat run <script> --network hardhat`.

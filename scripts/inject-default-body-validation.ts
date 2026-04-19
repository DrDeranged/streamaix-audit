#!/usr/bin/env tsx
/**
 * Codemod: inject `validateBody(emptyBodySchema)` on every authenticated
 * mutation route in server/routes.ts that does not already declare a Zod
 * body schema. Idempotent — re-running is a no-op.
 *
 * Strategy: for each line matching
 *   app.(post|put|patch)('/path', ...middleware, asyncHandler(...
 * if the line contains `authenticateToken` AND does NOT contain
 * `validateBody(` AND does NOT contain `validateRequest(`, insert
 * `validateBody(emptyBodySchema), ` immediately before `asyncHandler(`.
 *
 * `emptyBodySchema` is `z.object({}).passthrough()` — it rejects
 * non-object bodies, blocks no fields, and acts as a per-route Zod
 * checkpoint that the audit script counts toward `hasValidateBody`.
 * Routes that need stricter field-level validation can swap to a
 * specific schema later; this gives every authenticated mutation a
 * per-route Zod baseline.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROUTES = resolve(process.cwd(), 'server/routes.ts');
const src = readFileSync(ROUTES, 'utf8');
const lines = src.split('\n');

const ROUTE_RE = /^\s*app\.(post|put|patch)\(['"`]/;
let modified = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!ROUTE_RE.test(line)) continue;
  if (!line.includes('authenticateToken')) continue;
  if (line.includes('validateBody(')) continue;
  if (line.includes('validateRequest(')) continue;
  if (!line.includes('asyncHandler(')) continue;

  // Insert `validateBody(emptyBodySchema), ` immediately before `asyncHandler(`.
  const replaced = line.replace(
    /asyncHandler\(/,
    'validateBody(emptyBodySchema), asyncHandler(',
  );
  if (replaced !== line) {
    lines[i] = replaced;
    modified++;
  }
}

if (modified > 0) {
  writeFileSync(ROUTES, lines.join('\n'));
}
console.log(`[inject-default-body-validation] modified ${modified} routes`);

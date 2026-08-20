/**
 * validateEnv — Phase 1 production visibility.
 *
 * Called at the earliest safe point in real app initialization (top of
 * `initializeApp` in server/app.ts, AFTER the bootstrap has already bound the
 * HTTP port and installed fatal handlers).
 *
 * Policy:
 *  - In production, missing DATABASE_URL / JWT_SECRET / ANTHROPIC_API_KEY logs
 *    the EXACT missing names and throws (which, at that call site, exits
 *    startup via the bootstrap's FATAL-during-dynamic-import path).
 *  - In development / test the same conditions only WARN so local work is not
 *    blocked.
 *  - Feature-flag preconditions (checked in every environment because a
 *    half-configured money rail is dangerous even in dev):
 *      SWAPS_ENABLED=true            requires ZEROX_API_KEY and a valid
 *                                     checksummed TREASURY_ADDRESS.
 *      BRIDGE_ENABLED=true  OR
 *      ONCHAIN_ENABLED=true (a.k.a.  requires SERVICE_SIGNER_PRIVATE_KEY.
 *      ONCHAIN_WRITES_ENABLED=true)
 *
 * Uses the already-installed `ethers` dependency for the address checksum —
 * no new packages.
 */
import { getAddress } from "ethers";

export interface ValidateEnvResult {
  ok: boolean;
  missing: string[];
  errors: string[];
  warnings: string[];
}

function isProd(): boolean {
  return (process.env.NODE_ENV || "").toLowerCase() === "production";
}

/**
 * Validate required environment. Returns a structured result; in production a
 * fatal problem also throws after logging so startup aborts loudly.
 */
export function validateEnv(): ValidateEnvResult {
  const missing: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // ---- Core required secrets -------------------------------------------
  const REQUIRED = ["DATABASE_URL", "JWT_SECRET", "ANTHROPIC_API_KEY"] as const;
  for (const name of REQUIRED) {
    if (!process.env[name] || process.env[name]!.trim() === "") {
      missing.push(name);
    }
  }

  // ---- Feature-flag preconditions --------------------------------------
  const isTrue = (v: string | undefined) => v === "true";

  if (isTrue(process.env.SWAPS_ENABLED)) {
    if (!process.env.ZEROX_API_KEY || process.env.ZEROX_API_KEY.trim() === "") {
      errors.push("SWAPS_ENABLED=true requires ZEROX_API_KEY (missing)");
    }
    const treasury = process.env.TREASURY_ADDRESS;
    if (!treasury || treasury.trim() === "") {
      errors.push("SWAPS_ENABLED=true requires TREASURY_ADDRESS (missing)");
    } else {
      try {
        const checksummed = getAddress(treasury);
        if (checksummed !== treasury) {
          errors.push(
            `SWAPS_ENABLED=true requires a checksummed TREASURY_ADDRESS ` +
              `(got "${treasury}", expected "${checksummed}")`,
          );
        }
      } catch {
        errors.push(
          `SWAPS_ENABLED=true requires a valid TREASURY_ADDRESS (invalid address "${treasury}")`,
        );
      }
    }
  }

  const bridgeOrOnchain =
    isTrue(process.env.BRIDGE_ENABLED) ||
    isTrue(process.env.ONCHAIN_ENABLED) ||
    isTrue(process.env.ONCHAIN_WRITES_ENABLED);
  if (bridgeOrOnchain) {
    if (
      !process.env.SERVICE_SIGNER_PRIVATE_KEY ||
      process.env.SERVICE_SIGNER_PRIVATE_KEY.trim() === ""
    ) {
      errors.push(
        "BRIDGE_ENABLED/ONCHAIN_ENABLED=true requires SERVICE_SIGNER_PRIVATE_KEY (missing)",
      );
    }
  }

  // ---- Report ----------------------------------------------------------
  const prod = isProd();
  const fatal = missing.length > 0 || errors.length > 0;

  if (missing.length > 0) {
    const line = `Missing required environment variable(s): ${missing.join(", ")}`;
    prod ? console.error(`❌ [env] ${line}`) : console.warn(`⚠️  [env] ${line}`);
  }
  for (const e of errors) {
    prod ? console.error(`❌ [env] ${e}`) : console.warn(`⚠️  [env] ${e}`);
  }
  for (const w of warnings) {
    console.warn(`⚠️  [env] ${w}`);
  }

  if (fatal && prod) {
    throw new Error(
      `[env] Startup aborted — fatal environment problems: ` +
        [
          ...missing.map((m) => `missing ${m}`),
          ...errors,
        ].join("; "),
    );
  }

  if (!fatal) {
    console.log("✅ [env] environment validation passed");
  } else {
    console.warn(
      "⚠️  [env] environment validation found problems but continuing (non-production)",
    );
  }

  return { ok: !fatal, missing, errors, warnings };
}

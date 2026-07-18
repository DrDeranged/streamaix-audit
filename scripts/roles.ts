import type { Contract } from "ethers";

/**
 * Shared post-deploy role handoff:
 * 1. Grants MINTER_ROLE / RESOLVER_ROLE to SERVICE_SIGNER_ADDRESS (from env).
 * 2. Transfers DEFAULT_ADMIN_ROLE to ADMIN_MULTISIG_ADDRESS (from env).
 * 3. Renounces DEFAULT_ADMIN_ROLE from the deployer.
 *
 * Refuses to run against Base mainnet (chain 8453) unless ADMIN_MULTISIG_ADDRESS is set.
 */
export interface RoleTargets {
  streamToken: Contract;
  summaryNFT: Contract;
  predictionMarketFactory?: Contract;
}

export function assertMainnetSafety(chainId: bigint): void {
  if (chainId === 8453n && !process.env.ADMIN_MULTISIG_ADDRESS) {
    throw new Error(
      "REFUSING to deploy to Base mainnet: ADMIN_MULTISIG_ADDRESS is not set. " +
        "The admin key must be a multisig/hardware wallet — never the deployer or a Replit secret."
    );
  }
}

export async function handoffRoles(deployerAddress: string, targets: RoleTargets): Promise<void> {
  const serviceSigner = process.env.SERVICE_SIGNER_ADDRESS;
  const adminMultisig = process.env.ADMIN_MULTISIG_ADDRESS;

  // Read role identifiers from the contracts themselves (no hardcoded hashes).
  const MINTER_ROLE: string = await targets.streamToken.MINTER_ROLE();
  const RESOLVER_ROLE: string | undefined = targets.predictionMarketFactory
    ? await targets.predictionMarketFactory.RESOLVER_ROLE()
    : undefined;
  const DEFAULT_ADMIN_ROLE = "0x" + "0".repeat(64);

  // 1. Grant limited operational roles to the backend service key.
  if (serviceSigner) {
    console.log(`\n🔐 Granting MINTER_ROLE / RESOLVER_ROLE to service signer ${serviceSigner}...`);
    await (await targets.streamToken.grantRole(MINTER_ROLE, serviceSigner)).wait();
    await (await targets.summaryNFT.grantRole(MINTER_ROLE, serviceSigner)).wait();
    if (targets.predictionMarketFactory) {
      await (await targets.predictionMarketFactory.grantRole(RESOLVER_ROLE, serviceSigner)).wait();
    }
    console.log("✅ Service roles granted");
  } else {
    console.warn("⚠️  SERVICE_SIGNER_ADDRESS not set — no MINTER_ROLE/RESOLVER_ROLE granted. Grant manually before use.");
  }

  // 2. Transfer admin to the multisig, then renounce from the deployer.
  if (adminMultisig) {
    console.log(`\n🔐 Transferring DEFAULT_ADMIN_ROLE to multisig ${adminMultisig}...`);
    const adminContracts = [targets.streamToken, targets.summaryNFT, targets.predictionMarketFactory].filter(
      Boolean
    ) as Contract[];
    for (const contract of adminContracts) {
      await (await contract.grantRole(DEFAULT_ADMIN_ROLE, adminMultisig)).wait();
    }
    for (const contract of adminContracts) {
      await (await contract.renounceRole(DEFAULT_ADMIN_ROLE, deployerAddress)).wait();
    }
    console.log("✅ Admin transferred to multisig; deployer renounced all admin roles");
  } else {
    console.warn(
      "⚠️  ADMIN_MULTISIG_ADDRESS not set — deployer retains DEFAULT_ADMIN_ROLE. " +
        "Acceptable ONLY on testnets; transfer + renounce before mainnet use."
    );
  }
}

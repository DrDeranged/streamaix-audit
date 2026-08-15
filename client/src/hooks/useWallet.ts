import { useAccount, useBalance, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { base } from "wagmi/chains";

/** Canonical Base token addresses used for the nav/trade balance readout. */
export const BASE_TOKENS = {
  WETH: { address: "0x4200000000000000000000000000000000000006" as const, decimals: 18 },
  USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const, decimals: 6 },
};

export interface WalletBalances {
  eth: string | null;
  usdc: string | null;
  weth: string | null;
}

/**
 * Thin wrapper over wagmi for the trading rail: address, chain, connection
 * state, and ETH/USDC/WETH balances (ERC-20s batched via viem multicall).
 */
export function useWallet() {
  const { address, chainId, isConnected, isConnecting } = useAccount();

  const ethBalance = useBalance({
    address,
    chainId: base.id,
    query: { enabled: !!address },
  });

  const erc20Reads = useReadContracts({
    contracts: [
      {
        address: BASE_TOKENS.USDC.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: base.id,
      },
      {
        address: BASE_TOKENS.WETH.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: base.id,
      },
    ],
    query: { enabled: !!address },
  });

  const [usdcRead, wethRead] = erc20Reads.data ?? [];

  const balances: WalletBalances = {
    eth: ethBalance.data ? formatUnits(ethBalance.data.value, 18) : null,
    usdc:
      usdcRead?.status === "success"
        ? formatUnits(usdcRead.result as bigint, BASE_TOKENS.USDC.decimals)
        : null,
    weth:
      wethRead?.status === "success"
        ? formatUnits(wethRead.result as bigint, BASE_TOKENS.WETH.decimals)
        : null,
  };

  return {
    address: address ?? null,
    chainId: chainId ?? null,
    isConnected,
    isConnecting,
    isOnBase: chainId === base.id,
    balances,
    balancesLoading: ethBalance.isLoading || erc20Reads.isLoading,
    refetchBalances: () => {
      ethBalance.refetch();
      erc20Reads.refetch();
    },
  };
}

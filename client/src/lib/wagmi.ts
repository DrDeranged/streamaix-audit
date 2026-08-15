import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

/**
 * wagmi v2 + RainbowKit config for the non-custodial trading rail on Base.
 *
 * Coinbase Smart Wallet is first in the list (preference "all" surfaces the
 * smart wallet alongside the extension). WalletConnect-based wallets are only
 * offered when a real projectId is configured via VITE_WALLETCONNECT_PROJECT_ID.
 */

coinbaseWallet.preference = "all";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

const wallets = [coinbaseWallet, injectedWallet, metaMaskWallet];
if (projectId) wallets.push(walletConnectWallet);

const connectors = connectorsForWallets(
  [{ groupName: "Popular", wallets }],
  {
    appName: "StreamAiX",
    projectId: projectId || "00000000000000000000000000000000",
  }
);

export const wagmiConfig = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http(),
  },
});

export const BASE_CHAIN_ID = base.id;

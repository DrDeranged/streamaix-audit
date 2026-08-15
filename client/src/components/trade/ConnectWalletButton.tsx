import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

/** Small Base network mark (blue circle) used next to the connected address. */
function BaseLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 111 111" className={className} aria-label="Base" role="img">
      <path
        d="M54.921 110.034c30.438 0 55.113-24.632 55.113-55.017C110.034 24.632 85.359 0 54.921 0 26.043 0 2.353 22.171 0 50.392h72.847v9.25H0c2.353 28.221 26.043 50.392 54.921 50.392Z"
        fill="#0052FF"
      />
    </svg>
  );
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Design-system-native RainbowKit connect button: ink surfaces, accent tokens,
 * truncated address + Base logo when connected. Connection state persists via
 * wagmi's storage + reconnectOnMount.
 */
export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return <div aria-hidden className="h-9 w-36 rounded-xl bg-ink-raised animate-pulse" />;
        }

        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
              className="bg-accent-core hover:bg-accent-deep text-white rounded-xl transition-all duration-200"
              data-testid="button-connect-wallet"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              onClick={openChainModal}
              variant="outline"
              className="bg-ink-surface border border-loss/50 text-loss hover:bg-ink-raised rounded-xl"
              data-testid="button-wrong-network"
            >
              Wrong network
            </Button>
          );
        }

        return (
          <Button
            onClick={openAccountModal}
            variant="outline"
            className="bg-ink-surface border border-accent-core/40 hover:bg-ink-raised hover:border-accent-core rounded-xl transition-all duration-200"
            data-testid="button-wallet-account"
          >
            <BaseLogo className="w-4 h-4 mr-2" />
            <span className="font-mono text-sm text-accent-bright">
              {truncateAddress(account.address)}
            </span>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}

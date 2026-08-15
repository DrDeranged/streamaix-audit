import { Navigation } from "@/components/landing/navigation";
import { SwapCard } from "@/components/trade/SwapCard";
import { DisclosureModal } from "@/components/trade/DisclosureModal";
import { ConnectWalletButton } from "@/components/trade/ConnectWalletButton";
import { useWallet } from "@/hooks/useWallet";

export default function TradePage() {
  const { isConnected, balances } = useWallet();

  return (
    <div className="min-h-screen bg-ink-page">
      <Navigation />
      <DisclosureModal />
      <main className="max-w-lg mx-auto px-4 pt-28 pb-16">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary" data-testid="text-trade-title">Trade on Base</h1>
            <p className="text-sm text-muted mt-1">
              Swap tokens directly from your own wallet. StreamAiX never holds your funds.
            </p>
          </div>
          <div className="shrink-0 pt-1 md:hidden">
            <ConnectWalletButton />
          </div>
        </header>

        <SwapCard />

        {isConnected && (
          <div className="mt-4 bg-ink-surface border border-ink-edge rounded-2xl p-4" data-testid="wallet-balances">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Wallet balances</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {([["ETH", balances.eth], ["USDC", balances.usdc], ["WETH", balances.weth]] as const).map(([sym, bal]) => (
                <div key={sym} className="bg-ink-raised rounded-xl px-3 py-2">
                  <div className="text-muted text-xs">{sym}</div>
                  <div className="text-primary font-mono">
                    {bal === null ? "—" : Number(bal).toLocaleString(undefined, { maximumFractionDigits: 5 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

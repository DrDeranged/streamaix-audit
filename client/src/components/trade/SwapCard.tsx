import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { usePublicClient, useSendTransaction, useWriteContract } from "wagmi";
import { base } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownUp, ExternalLink, Info, Loader2, TimerReset } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

interface AllowedToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

interface SwapQuote {
  sellToken: AllowedToken;
  buyToken: AllowedToken;
  sellAmount: string;
  buyAmount: string;
  minBuyAmount: string;
  price: string;
  guaranteedPrice: string;
  allowanceTarget: string | null;
  priceImpactPct: number | null;
  fee: { recipient: string; bps: number; buyTokenFeeAmount: string | null };
  tx: { to: string; data: string; value: string; gas: string | null };
  slippageBps: number;
  expiresAt: number;
}

type SwapStatus =
  | { step: "idle" }
  | { step: "approving"; hash?: string }
  | { step: "swapping"; hash?: string }
  | { step: "confirming"; hash: string }
  | { step: "done"; hash: string }
  | { step: "error"; message: string };

const NATIVE_ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

function isNative(address: string): boolean {
  return address.toLowerCase() === NATIVE_ETH;
}

function fmt(amount: string, decimals: number, dp = 6): string {
  const n = Number(formatUnits(BigInt(amount), decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: dp });
}

export interface SwapCardProps {
  /** Optional prefill (e.g. from an agent signal). User-editable. */
  initialSell?: string;
  initialBuy?: string;
  initialAmount?: string;
  /** Link an executed swap back to the agent signal that motivated it. */
  signalId?: string;
}

export function SwapCard({ initialSell, initialBuy, initialAmount, signalId }: SwapCardProps = {}) {
  const { address, isConnected, balances, refetchBalances } = useWallet();
  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [sellSymbol, setSellSymbol] = useState(initialSell || "ETH");
  const [buySymbol, setBuySymbol] = useState(initialBuy || "USDC");
  const [sellInput, setSellInput] = useState(initialAmount || "");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [needsOverride, setNeedsOverride] = useState(false);
  const [override, setOverride] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [status, setStatus] = useState<SwapStatus>({ step: "idle" });
  const quoteSeq = useRef(0);

  const tokensQuery = useQuery<{ tokens: AllowedToken[]; disabled?: boolean }>({
    queryKey: ["/api/swap/tokens"],
    queryFn: async () => {
      const res = await fetch("/api/swap/tokens", { credentials: "include" });
      if (res.status === 403) return { tokens: [], disabled: true };
      if (!res.ok) throw new Error(`Failed to load tokens (${res.status})`);
      return res.json();
    },
    retry: false,
  });
  const swapsDisabled = tokensQuery.data?.disabled === true;
  const tokens = tokensQuery.data?.tokens ?? [];

  const sellToken = tokens.find((t) => t.symbol === sellSymbol) ?? null;
  const buyToken = tokens.find((t) => t.symbol === buySymbol) ?? null;

  const balanceFor = (symbol: string): string | null => {
    if (symbol === "ETH") return balances.eth;
    if (symbol === "USDC") return balances.usdc;
    if (symbol === "WETH") return balances.weth;
    return null;
  };
  const sellBalance = balanceFor(sellSymbol);

  const sellAmountBase = useMemo(() => {
    if (!sellToken || !sellInput) return null;
    try {
      const v = parseUnits(sellInput, sellToken.decimals);
      return v > BigInt(0) ? v.toString() : null;
    } catch {
      return null;
    }
  }, [sellInput, sellToken]);

  const fetchQuote = useCallback(
    async (withOverride: boolean) => {
      if (!sellToken || !buyToken || !sellAmountBase || !address) return;
      const seq = ++quoteSeq.current;
      setQuoting(true);
      setQuoteError(null);
      setNeedsOverride(false);
      try {
        const res = await fetch("/api/swap/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellToken: sellToken.symbol,
            buyToken: buyToken.symbol,
            sellAmount: sellAmountBase,
            takerAddress: address,
            overrideHighImpact: withOverride,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (seq !== quoteSeq.current) return;
        if (!res.ok) {
          if (res.status === 409 && body.requiresConfirmation) {
            setNeedsOverride(true);
            setQuote(null);
            setQuoteError(body.error);
          } else {
            setQuote(null);
            setQuoteError(body.error || `Quote failed (${res.status})`);
          }
          return;
        }
        setQuote(body.quote);
      } catch (err: any) {
        if (seq === quoteSeq.current) {
          setQuote(null);
          setQuoteError(err?.message || "Quote failed");
        }
      } finally {
        if (seq === quoteSeq.current) setQuoting(false);
      }
    },
    [sellToken, buyToken, sellAmountBase, address]
  );

  // Debounced quote on input changes
  useEffect(() => {
    setQuote(null);
    setOverride(false);
    if (!sellAmountBase || !address || swapsDisabled) return;
    const t = setTimeout(() => fetchQuote(false), 450);
    return () => clearTimeout(t);
  }, [sellAmountBase, sellSymbol, buySymbol, address, swapsDisabled, fetchQuote]);

  // Quote expiry countdown
  useEffect(() => {
    if (!quote) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((quote.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setQuote(null);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [quote]);

  const flip = () => {
    setSellSymbol(buySymbol);
    setBuySymbol(sellSymbol);
    setSellInput("");
    setQuote(null);
  };

  const setMax = () => {
    if (sellBalance) setSellInput(sellBalance);
  };

  const recordTrade = async (q: SwapQuote, txHash: string) => {
    try {
      await fetch("/api/swap/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          sellToken: q.sellToken.symbol,
          buyToken: q.buyToken.symbol,
          sellAmount: q.sellAmount,
          buyAmount: q.buyAmount,
          txHash,
          feeCollected: q.fee.buyTokenFeeAmount ?? undefined,
          quotedPrice: q.price,
          signalId: signalId || undefined,
        }),
      });
    } catch {
      // Recording is best-effort; the swap itself already succeeded on-chain.
    }
  };

  const executeSwap = async () => {
    if (!quote || !address || !publicClient) return;
    const q = quote;
    try {
      // 1. Approve when selling an ERC-20 and an allowance target exists
      if (!isNative(q.sellToken.address) && q.allowanceTarget) {
        const allowance = await publicClient.readContract({
          address: q.sellToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address as `0x${string}`, q.allowanceTarget as `0x${string}`],
        });
        if (allowance < BigInt(q.sellAmount)) {
          setStatus({ step: "approving" });
          const approveHash = await writeContractAsync({
            address: q.sellToken.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [q.allowanceTarget as `0x${string}`, BigInt(q.sellAmount)],
            chainId: base.id,
          });
          setStatus({ step: "approving", hash: approveHash });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Submit the swap transaction from the user's wallet
      setStatus({ step: "swapping" });
      const hash = await sendTransactionAsync({
        to: q.tx.to as `0x${string}`,
        data: q.tx.data as `0x${string}`,
        value: BigInt(q.tx.value || "0"),
        chainId: base.id,
      });
      setStatus({ step: "confirming", hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        setStatus({ step: "error", message: "Transaction reverted on-chain" });
        return;
      }
      setStatus({ step: "done", hash });
      setQuote(null);
      setSellInput("");
      refetchBalances();
      recordTrade(q, hash);
      toast({ title: "Swap confirmed", description: `${q.sellToken.symbol} → ${q.buyToken.symbol}` });
    } catch (err: any) {
      setStatus({ step: "error", message: err?.shortMessage || err?.message || "Swap failed" });
    }
  };

  if (swapsDisabled) {
    return (
      <div className="bg-ink-surface border border-ink-edge rounded-2xl p-8 text-center" data-testid="swap-disabled-notice">
        <Info className="w-8 h-8 text-accent-bright mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-primary mb-1">Trading isn't live yet</h3>
        <p className="text-sm text-muted">
          On-chain swaps on Base are coming soon. Check back shortly.
        </p>
      </div>
    );
  }

  const busy = status.step === "approving" || status.step === "swapping" || status.step === "confirming";

  return (
    <div className="bg-ink-surface border border-ink-edge rounded-2xl p-5 space-y-4" data-testid="swap-card">
      {/* Sell side */}
      <div className="bg-ink-raised border border-ink-edge rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>You pay</span>
          {sellBalance !== null && (
            <button
              type="button"
              onClick={setMax}
              className="hover:text-accent-bright transition-colors"
              data-testid="button-max"
            >
              Balance: {Number(sellBalance).toLocaleString(undefined, { maximumFractionDigits: 5 })}{" "}
              <span className="text-accent-bright font-medium">MAX</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={sellInput}
            onChange={(e) => setSellInput(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.0"
            inputMode="decimal"
            className="border-0 bg-transparent text-2xl font-semibold text-primary px-0 focus-visible:ring-0"
            data-testid="input-sell-amount"
          />
          <Select value={sellSymbol} onValueChange={setSellSymbol}>
            <SelectTrigger className="w-28 bg-ink-surface border-ink-edge rounded-xl" data-testid="select-sell-token">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-ink-surface border-ink-edge">
              {tokens.filter((t) => t.symbol !== buySymbol).map((t) => (
                <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center -my-1">
        <Button
          variant="outline"
          size="icon"
          onClick={flip}
          className="bg-ink-raised border-ink-edge hover:bg-ink-surface rounded-xl h-8 w-8"
          data-testid="button-flip-tokens"
        >
          <ArrowDownUp className="w-4 h-4 text-accent-bright" />
        </Button>
      </div>

      {/* Buy side */}
      <div className="bg-ink-raised border border-ink-edge rounded-xl p-4 space-y-2">
        <div className="text-xs text-muted">You receive (estimated)</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-2xl font-semibold text-primary min-w-0 truncate" data-testid="text-buy-amount">
            {quoting ? (
              <Loader2 className="w-5 h-5 animate-spin text-accent-bright" />
            ) : quote && buyToken ? (
              fmt(quote.buyAmount, buyToken.decimals)
            ) : (
              <span className="text-muted">0.0</span>
            )}
          </div>
          <Select value={buySymbol} onValueChange={setBuySymbol}>
            <SelectTrigger className="w-28 bg-ink-surface border-ink-edge rounded-xl" data-testid="select-buy-token">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-ink-surface border-ink-edge">
              {tokens.filter((t) => t.symbol !== sellSymbol).map((t) => (
                <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quote detail */}
      {quote && buyToken && sellToken && (
        <div className="text-xs text-body space-y-1.5 px-1" data-testid="quote-details">
          <div className="flex justify-between">
            <span className="text-muted">Rate</span>
            <span>1 {sellToken.symbol} ≈ {Number(quote.price).toLocaleString(undefined, { maximumFractionDigits: 6 })} {buyToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Minimum received</span>
            <span>{fmt(quote.minBuyAmount, buyToken.decimals)} {buyToken.symbol}</span>
          </div>
          {quote.priceImpactPct !== null && (
            <div className="flex justify-between">
              <span className="text-muted">Price impact</span>
              <span className={quote.priceImpactPct > 3 ? "text-warn" : ""}>
                {quote.priceImpactPct.toFixed(2)}%
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Platform fee ({(quote.fee.bps / 100).toFixed(2)}%)</span>
            <span data-testid="text-fee-line">
              {quote.fee.buyTokenFeeAmount
                ? `${fmt(quote.fee.buyTokenFeeAmount, buyToken.decimals)} ${buyToken.symbol}`
                : "included in quote"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Quote refreshes in</span>
            <span className="flex items-center gap-1 text-accent-bright" data-testid="text-quote-countdown">
              <TimerReset className="w-3 h-3" />
              {secondsLeft}s
            </span>
          </div>
        </div>
      )}

      {/* Errors / high-impact override */}
      {quoteError && (
        <div className="text-xs text-loss bg-loss/10 border border-loss/30 rounded-xl px-3 py-2" data-testid="text-quote-error">
          {quoteError}
          {needsOverride && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full border-warn/50 text-warn hover:bg-ink-raised rounded-xl"
              onClick={() => {
                setOverride(true);
                fetchQuote(true);
              }}
              data-testid="button-confirm-high-impact"
            >
              I understand the price impact — quote anyway
            </Button>
          )}
        </div>
      )}

      {/* Status tracker */}
      {status.step !== "idle" && (
        <div className="text-xs rounded-xl px-3 py-2 bg-ink-raised border border-ink-edge flex items-center justify-between gap-2" data-testid="swap-status">
          <span className={status.step === "error" ? "text-loss" : status.step === "done" ? "text-gain" : "text-body"}>
            {status.step === "approving" && "Approving token…"}
            {status.step === "swapping" && "Confirm the swap in your wallet…"}
            {status.step === "confirming" && "Waiting for confirmation…"}
            {status.step === "done" && "Swap confirmed"}
            {status.step === "error" && status.message}
          </span>
          {"hash" in status && status.hash && (
            <a
              href={`https://basescan.org/tx/${status.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-accent-bright hover:text-accent-core shrink-0"
              data-testid="link-basescan"
            >
              BaseScan <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Action */}
      <Button
        onClick={executeSwap}
        disabled={!isConnected || !quote || busy}
        className="w-full bg-accent-core hover:bg-accent-deep text-white rounded-xl h-11 font-medium"
        data-testid="button-swap"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : !isConnected ? (
          "Connect a wallet to trade"
        ) : !quote ? (
          quoting ? "Fetching quote…" : "Enter an amount"
        ) : (
          `Swap ${sellSymbol} for ${buySymbol}`
        )}
      </Button>

      {/* Persistent fee/risk line */}
      <p className="text-[11px] text-muted text-center leading-relaxed" data-testid="text-risk-line">
        Non-custodial — your wallet signs every transaction. Quotes include a 0.3% platform fee.
        Crypto is volatile; this is not investment advice.
      </p>
    </div>
  );
}

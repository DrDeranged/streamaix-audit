import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

const STORAGE_PREFIX = "swap-disclosure-ack-v1:";

export function hasAcknowledgedDisclosure(address: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + address.toLowerCase()) === "true";
  } catch {
    return false;
  }
}

/**
 * One-time (per wallet) risk disclosure, shown on first connection. The user
 * must acknowledge before trading.
 */
export function DisclosureModal() {
  const { address, isConnected } = useWallet();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConnected && address && !hasAcknowledgedDisclosure(address)) {
      setOpen(true);
    }
  }, [isConnected, address]);

  const acknowledge = () => {
    if (address) {
      try {
        localStorage.setItem(STORAGE_PREFIX + address.toLowerCase(), "true");
      } catch {
        // localStorage unavailable — modal will show again next visit
      }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && acknowledge()}>
      <DialogContent className="bg-ink-surface border border-ink-edge rounded-2xl max-w-md" data-testid="dialog-swap-disclosure">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ShieldAlert className="w-5 h-5 text-warn" />
            Before you trade
          </DialogTitle>
          <DialogDescription className="sr-only">Trading risk disclosure</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm text-body list-disc pl-5">
          <li>
            Trading is <span className="font-medium text-primary">non-custodial</span>: StreamAiX never
            holds your keys or funds. Every transaction is signed by your own wallet.
          </li>
          <li>Crypto assets are volatile — you can lose the full value of what you trade.</li>
          <li>
            A <span className="font-medium text-primary">0.3% platform fee</span> is included in every
            quote and shown before you confirm.
          </li>
          <li>Nothing here is investment advice.</li>
        </ul>
        <DialogFooter>
          <Button
            onClick={acknowledge}
            className="bg-accent-core hover:bg-accent-deep text-white rounded-xl w-full"
            data-testid="button-acknowledge-disclosure"
          >
            I understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

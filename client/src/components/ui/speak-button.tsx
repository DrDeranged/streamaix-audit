import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * SpeakButton — client-side text-to-speech via the Web Speech API.
 *
 * Server-side TTS (OpenAI) was removed; speech now happens for free in the
 * browser. Renders a speak/stop toggle. When speechSynthesis is unavailable
 * the button is disabled with an explanatory tooltip.
 */
export interface SpeakButtonProps {
  /** The text to speak. */
  text: string;
  /** Optional speech rate (0.1–10, default 1). */
  rate?: number;
  /** Optional pitch (0–2, default 1). */
  pitch?: number;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline" | "secondary";
  "data-testid"?: string;
}

function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function SpeakButton({
  text,
  rate = 1,
  pitch = 1,
  className,
  size = "icon",
  variant = "ghost",
  "data-testid": dataTestId,
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const supported = speechSupported();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech if the component unmounts mid-utterance.
  useEffect(() => {
    return () => {
      if (supported && utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const toggle = useCallback(() => {
    if (!supported || !text?.trim()) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Cancel anything already queued (e.g. another SpeakButton).
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [supported, text, speaking, rate, pitch]);

  const button = (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={!supported}
      onClick={toggle}
      aria-label={speaking ? "Stop speaking" : "Read aloud"}
      className={cn("shrink-0", className)}
      data-testid={dataTestId ?? "button-speak"}
    >
      {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );

  if (!supported) {
    return (
      <Tooltip>
        {/* span wrapper so the tooltip fires on a disabled button */}
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent>
          Read-aloud isn't supported in this browser.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{speaking ? "Stop" : "Read aloud"}</TooltipContent>
    </Tooltip>
  );
}

export default SpeakButton;

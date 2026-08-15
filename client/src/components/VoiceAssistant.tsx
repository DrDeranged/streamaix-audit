import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff, Loader2, X, Volume2, TrendingUp, TrendingDown, Wallet, Trophy, AlertTriangle, Send } from "lucide-react";
import Surface from "@/components/ds/Surface";
import StatValue from "@/components/ds/StatValue";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

type Status = "idle" | "listening" | "processing" | "speaking" | "error";

type IntentResult =
  | { kind: "market"; symbol: string; price: number; percentChange24h: number; source: "live" | "unavailable" }
  | { kind: "balance"; streamPoints: number; username: string | null }
  | { kind: "bounty"; bountyId: string; title: string; reward: number; status: string; summary: string }
  | { kind: "navigate"; path: string }
  | { kind: "error"; message: string }
  | null;

interface VoiceResult {
  transcript: string;
  spokenResponse: string;
  displayResponse: string;
  intent: { type: string; path?: string; symbol?: string; bountyId?: string };
  intentResult: IntentResult;
}

function IntentResultCard({ result }: { result: IntentResult }) {
  if (!result) return null;
  if (result.kind === "market") {
    if (result.source === "unavailable") {
      return (
        <Surface variant="raised" className="border border-warn/30 bg-warn/10 p-3 flex items-center gap-2 text-warn" data-testid="voice-result-market-unavailable">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Live price for {result.symbol} unavailable.</span>
        </Surface>
      );
    }
    const up = result.percentChange24h >= 0;
    return (
      <Surface variant="raised" className="border border-accent-core/30 bg-accent-core/10 p-3" data-testid="voice-result-market">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-accent-bright">{result.symbol} · live</span>
          <span className={`tabular flex items-center gap-1 text-xs font-semibold ${up ? "text-gain" : "text-loss"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {up ? "+" : ""}{result.percentChange24h.toFixed(2)}%
          </span>
        </div>
        <StatValue
          label="Price"
          value={`$${result.price >= 1 ? result.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : result.price.toPrecision(4)}`}
          valueClassName="mt-1"
          data-testid="voice-result-price"
        />
        <p className="text-[10px] text-muted mt-1">24h change</p>
      </Surface>
    );
  }
  if (result.kind === "balance") {
    return (
      <Surface variant="raised" className="border border-accent-core/30 bg-accent-core/10 p-3" data-testid="voice-result-balance">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-3.5 w-3.5 text-accent-bright" />
          <span className="text-xs uppercase tracking-wider text-accent-bright">STREAM balance</span>
        </div>
        <StatValue
          label="Balance"
          value={result.streamPoints.toLocaleString()}
          valueClassName="mt-1"
          data-testid="voice-result-balance-amount"
        />
        {result.username && <p className="text-[10px] text-muted mt-1">@{result.username}</p>}
      </Surface>
    );
  }
  if (result.kind === "bounty") {
    return (
      <Surface variant="raised" className="border border-warn/30 bg-warn/10 p-3" data-testid="voice-result-bounty">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-warn">
            <Trophy className="h-3.5 w-3.5" />
            Bounty
          </span>
          {result.reward > 0 && (
            <span className="tabular text-xs font-semibold text-warn">{result.reward} STREAM</span>
          )}
        </div>
        <p className="text-sm font-semibold text-primary truncate" data-testid="voice-result-bounty-title">
          {result.title}
        </p>
        <p className="text-xs text-body mt-1 line-clamp-3">{result.summary}</p>
      </Surface>
    );
  }
  if (result.kind === "error") {
    return (
      <Surface variant="raised" className="border border-loss/30 bg-loss/10 p-3 flex items-center gap-2 text-loss" data-testid="voice-result-error">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs">{result.message}</span>
      </Surface>
    );
  }
  return null;
}

// Browser speech recognition (Web Speech API). Server-side transcription was
// removed with OpenAI Whisper — speech-to-text now happens in the browser,
// and users can always type instead.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceAssistant() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const gotResultRef = useRef(false);

  const speechSynthesisSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const speechRecognitionSupported = typeof window !== "undefined" && getSpeechRecognition() !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (speechSynthesisSupported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startListening() {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Log in to use the assistant.", variant: "destructive" });
      return;
    }
    setErrorMsg(null);
    setOpen(true);
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      // No browser speech support: fall back to the text box.
      setStatus("idle");
      setErrorMsg("Voice input isn't supported in this browser — type your question below.");
      return;
    }
    try {
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      gotResultRef.current = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        gotResultRef.current = true;
        if (transcript) {
          void sendTranscript(transcript);
        } else {
          setStatus("idle");
          setErrorMsg("Didn't catch that — try again or type your question.");
        }
      };
      recognition.onerror = (event) => {
        gotResultRef.current = true;
        setStatus("idle");
        setErrorMsg(
          event.error === "not-allowed"
            ? "Microphone access denied. Enable mic permission or type your question."
            : "Didn't catch that — try again or type your question.",
        );
      };
      recognition.onend = () => {
        if (!gotResultRef.current) {
          setStatus("idle");
          setErrorMsg("Didn't catch that — try again or type your question.");
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setStatus("listening");
    } catch (err) {
      console.error("[VoiceAssistant] speech recognition error", err);
      setStatus("error");
      setErrorMsg("Voice input failed to start — type your question instead.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  async function sendTranscript(transcript: string) {
    setStatus("processing");
    try {
      const data: { success: boolean } & VoiceResult = await apiRequest("/api/assistant/text", {
        method: "POST",
        body: JSON.stringify({
          transcript,
          currentPath: window.location.pathname,
        }),
      });
      setResult({ ...data, transcript: data.transcript || transcript });
      if (data.intent?.type === "navigate" && data.intent.path) {
        setTimeout(() => setLocation(data.intent.path!), 600);
      }
      // Speak the reply client-side (free, Web Speech API).
      const spoken = data.spokenResponse || data.displayResponse;
      if (speechSynthesisSupported && spoken) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spoken);
        utterance.onend = () => setStatus("idle");
        utterance.onerror = () => setStatus("idle");
        setStatus("speaking");
        window.speechSynthesis.speak(utterance);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Assistant request failed";
      console.error("[VoiceAssistant] request failed", err);
      setStatus("error");
      setErrorMsg(msg);
    }
  }

  function handleSendText() {
    const t = textInput.trim();
    if (!t || status === "processing") return;
    setTextInput("");
    setErrorMsg(null);
    void sendTranscript(t);
  }

  function dismissPanel() {
    setOpen(false);
    setResult(null);
    setErrorMsg(null);
    recognitionRef.current?.abort();
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
    setStatus("idle");
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating mic button */}
      <button
        type="button"
        onClick={status === "listening" ? stopListening : startListening}
        aria-label={status === "listening" ? "Stop listening" : "Start assistant"}
        data-testid="button-voice-assistant"
         className={`fixed z-50 bottom-6 right-6 h-14 w-14 rounded-xl shadow-2xl flex items-center justify-center transition-all
          ${status === "listening"
             ? "bg-loss hover:bg-loss/80 animate-pulse ring-4 ring-loss/40"
             : "grad-accent glow-accent hover:scale-105 ring-2 ring-accent-bright/20"}
        `}
      >
        {status === "processing" ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : status === "speaking" ? (
          <Volume2 className="h-6 w-6 text-primary animate-pulse" />
        ) : status === "listening" ? (
          <MicOff className="h-6 w-6 text-primary" />
        ) : (
          <Mic className="h-6 w-6 text-primary" />
        )}
      </button>

      {/* Result / status panel */}
      {open && (
        <div
          data-testid="panel-voice-assistant"
           className="fixed z-50 bottom-24 right-6 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-ink-edge bg-ink-surface/95 backdrop-blur-xl shadow-2xl p-4 text-sm text-body"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
               <div className={`h-2 w-2 rounded-xl ${
                 status === "listening" ? "bg-loss animate-pulse" :
                 status === "processing" ? "bg-warn animate-pulse" :
                 status === "speaking" ? "bg-accent-core animate-pulse" :
                 status === "error" ? "bg-loss" : "bg-gain"
              }`} />
               <span className="text-xs uppercase tracking-wide text-secondary">
                {status === "listening" && "Listening..."}
                {status === "processing" && "Thinking..."}
                {status === "speaking" && "Speaking..."}
                {status === "idle" && (result ? "Done" : "Ready")}
                {status === "error" && "Error"}
              </span>
            </div>
            <button
              onClick={dismissPanel}
              aria-label="Close"
              data-testid="button-close-voice"
               className="text-secondary hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {status === "listening" && (
             <p className="text-body text-xs">
              Speak now — tap the mic again to stop.
            </p>
          )}

          {errorMsg && (
             <p className="text-loss text-xs">{errorMsg}</p>
          )}

          {result && (
            <div className="space-y-2">
              <div>
                 <p className="text-[10px] uppercase tracking-wide text-muted">You asked</p>
                 <p className="text-body">{result.transcript || "(empty)"}</p>
              </div>
              <div>
                 <p className="text-[10px] uppercase tracking-wide text-muted">Assistant</p>
                 <p className="text-primary whitespace-pre-line">{result.displayResponse}</p>
              </div>
              <IntentResultCard result={result.intentResult} />
              {result.intent?.type === "navigate" && result.intent.path && (
                 <p className="text-xs text-accent-bright">Opening {result.intent.path}…</p>
              )}
            </div>
          )}

          {!result && !errorMsg && status === "idle" && (
             <p className="text-secondary text-xs">
              Try: "What's BTC at?", "What's my balance?", "Summarize my last bounty", "Open prediction markets".
              {!speechRecognitionSupported && " (Voice input isn't supported in this browser — type below.)"}
            </p>
          )}

          {/* Text fallback input — always available */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendText(); }}
              placeholder="Type a question..."
              data-testid="input-assistant-text"
              className="flex-1 rounded-xl border border-ink-edge bg-ink-raised px-3 py-2 text-xs text-primary placeholder:text-muted focus:border-accent-core/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSendText}
              disabled={!textInput.trim() || status === "processing"}
              aria-label="Send question"
              data-testid="button-assistant-send"
              className="rounded-xl p-2 grad-accent disabled:opacity-40"
            >
              <Send className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      )}

    </>
  );
}

export default VoiceAssistant;

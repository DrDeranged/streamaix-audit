import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff, Loader2, X, Volume2, TrendingUp, TrendingDown, Wallet, Trophy, AlertTriangle } from "lucide-react";
import Surface from "@/components/ds/Surface";
import StatValue from "@/components/ds/StatValue";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

type Status = "idle" | "recording" | "processing" | "speaking" | "error";

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
  audioBase64: string | null;
  audioMimeType: string | null;
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

const MIN_RECORDING_MS = 350;
const MAX_RECORDING_MS = 12_000;

export function VoiceAssistant() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const recordStartRef = useRef<number>(0);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  }, []);

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      const slice = bytes.subarray(i, i + chunk);
      for (let j = 0; j < slice.length; j++) binary += String.fromCharCode(slice[j]);
    }
    return btoa(binary);
  }

  async function startRecording() {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Log in to use the voice assistant.", variant: "destructive" });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast({ title: "Voice not supported", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }
    try {
      setErrorMsg(null);
      setOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      recordStartRef.current = Date.now();

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        cleanupStream();
        const elapsed = Date.now() - recordStartRef.current;
        if (elapsed < MIN_RECORDING_MS || chunksRef.current.length === 0) {
          setStatus("idle");
          setErrorMsg("Hold a bit longer and try again.");
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        void sendAudio(blob, mr.mimeType || "audio/webm");
      };
      mr.start();
      setStatus("recording");
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_MS);
    } catch (err) {
      console.error("[VoiceAssistant] mic error", err);
      setStatus("error");
      setErrorMsg("Microphone access denied. Enable mic permission and retry.");
    }
  }

  function stopRecording() {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "recording") {
      mr.stop();
    }
  }

  async function sendAudio(blob: Blob, mimeType: string) {
    setStatus("processing");
    try {
      const audioBase64 = await blobToBase64(blob);
      const data: { success: boolean } & VoiceResult = await apiRequest("/api/assistant/voice", {
        method: "POST",
        body: JSON.stringify({
          audioBase64,
          mimeType,
          currentPath: window.location.pathname,
        }),
      });
      setResult(data);
      // Handle intent
      if (data.intent?.type === "navigate" && data.intent.path) {
        setTimeout(() => setLocation(data.intent.path!), 600);
      }
      // Play TTS
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.audioMimeType || "audio/mpeg"};base64,${data.audioBase64}`);
        audioElRef.current = audio;
        audio.onended = () => setStatus("idle");
        audio.onerror = () => setStatus("idle");
        setStatus("speaking");
        await audio.play().catch(() => setStatus("idle"));
      } else {
        setStatus("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice request failed";
      console.error("[VoiceAssistant] request failed", err);
      setStatus("error");
      setErrorMsg(msg);
    }
  }

  function dismissPanel() {
    setOpen(false);
    setResult(null);
    setErrorMsg(null);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") stopRecording();
    setStatus("idle");
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating mic button */}
      <button
        type="button"
        onClick={status === "recording" ? stopRecording : startRecording}
        aria-label={status === "recording" ? "Stop recording" : "Start voice assistant"}
        data-testid="button-voice-assistant"
         className={`fixed z-50 bottom-6 right-6 h-14 w-14 rounded-xl shadow-2xl flex items-center justify-center transition-all
          ${status === "recording"
             ? "bg-loss hover:bg-loss/80 animate-pulse ring-4 ring-loss/40"
             : "grad-accent glow-accent hover:scale-105 ring-2 ring-accent-bright/20"}
        `}
      >
        {status === "processing" ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : status === "speaking" ? (
          <Volume2 className="h-6 w-6 text-primary animate-pulse" />
        ) : status === "recording" ? (
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
                 status === "recording" ? "bg-loss animate-pulse" :
                 status === "processing" ? "bg-warn animate-pulse" :
                 status === "speaking" ? "bg-accent-core animate-pulse" :
                 status === "error" ? "bg-loss" : "bg-gain"
              }`} />
               <span className="text-xs uppercase tracking-wide text-secondary">
                {status === "recording" && "Listening..."}
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

          {status === "recording" && (
             <p className="text-body text-xs">
              Tap the mic again to send. (Auto-stops after 12s.)
            </p>
          )}

          {errorMsg && (
             <p className="text-loss text-xs">{errorMsg}</p>
          )}

          {result && (
            <div className="space-y-2">
              <div>
                 <p className="text-[10px] uppercase tracking-wide text-muted">You said</p>
                 <p className="text-body">{result.transcript || "(silence)"}</p>
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
            </p>
          )}
        </div>
      )}

    </>
  );
}

export default VoiceAssistant;

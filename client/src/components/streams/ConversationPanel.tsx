import { useState, useRef, useEffect } from 'react';
import { useStreamConversation, ConversationMessage } from '@/hooks/useStreamConversation';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useAwardVoiceConversation } from '@/hooks/usePoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import SectionTitle from '@/components/ds/SectionTitle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mic, 
  MicOff, 
  Hand, 
  Send, 
  Volume2, 
  VolumeX,
  Radio,
  Users,
  Bot,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Crown,
  Headphones,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpeakButton } from '@/components/ui/speak-button';

interface ConversationPanelProps {
  streamId: string;
  userId?: string;
  avatarId?: string;
  isHost?: boolean;
  className?: string;
}

export function ConversationPanel({
  streamId,
  userId,
  avatarId,
  isHost = false,
  className,
}: ConversationPanelProps) {
  const [textInput, setTextInput] = useState('');
  // Auto-speak avatar replies client-side (Web Speech API). Server-side TTS
  // was removed — avatar responses arrive as text only.
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pointsAwardedRef = useRef(false);
  
  const awardVoiceConversation = useAwardVoiceConversation();

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speakText = (text: string) => {
    if (!speechSupported || !audioEnabledRef.current || !text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const {
    isConnected,
    participants,
    messages,
    speakerQueue,
    currentSpeaker,
    myParticipant,
    liveTranscription,
    error,
    requestSpeak,
    cancelSpeakRequest,
    sendTextInput,
    mute,
    unmute,
    grantSpeaking,
    revokeSpeaking,
  } = useStreamConversation({
    streamId,
    userId,
    avatarId,
    role: isHost ? 'host' : 'speaker',
    audioPreference: 'text_only',
  });

  const {
    isRecording,
    isTranscribing,
    hasPermission,
    startRecording,
    stopRecording,
    requestPermission,
  } = useMicrophone({
    streamId,
    onTranscription: (text, isFinal) => {
      if (isFinal && text.trim()) {
        sendTextInput(text);
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak newly-arrived avatar messages aloud (client-side, free).
  useEffect(() => {
    for (const msg of messages) {
      if (msg.speakerType !== 'avatar') continue;
      if (spokenIdsRef.current.has(msg.id)) continue;
      spokenIdsRef.current.add(msg.id);
      speakText(msg.textContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Stop any in-flight speech when audio is muted or on unmount.
  useEffect(() => {
    if (!speechSupported) return;
    if (!audioEnabled) window.speechSynthesis.cancel();
    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled]);

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextInput(textInput.trim());
      setTextInput('');
      
      if (!pointsAwardedRef.current) {
        pointsAwardedRef.current = true;
        awardVoiceConversation.mutate({ streamId });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const canSpeak = myParticipant?.speakingStatus === 'speaking';
  const isInQueue = myParticipant?.speakingStatus === 'queued' || myParticipant?.speakingStatus === 'requested';
  const showOnboarding = !isConnected && messages.length === 0;

  // Onboarding view when not connected yet
  if (showOnboarding) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-ink-surface border border-ink-edge rounded-xl p-6 text-center",
        className
      )}>
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-accent-core/20 rounded-full blur-xl animate-pulse" />
          <div className="relative p-4 bg-accent-core/20 rounded-full border border-accent-core/30">
            <Headphones className="w-10 h-10 text-accent-bright" />
          </div>
        </div>
        
        <SectionTitle as="h3" className="mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-bright" />
          Live Voice Conversation
        </SectionTitle>
        
        <p className="text-sm text-secondary mb-4 max-w-[280px]">
          Chat with AI avatars in real-time using voice or text. Ask questions, share ideas, and have natural conversations.
        </p>

        <div className="space-y-2 text-left w-full max-w-[280px] mb-4">
          <div className="flex items-center gap-2 text-sm text-body">
            <MessageSquare className="w-4 h-4 text-accent-bright" />
            <span>Type messages or use your microphone</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-body">
            <Hand className="w-4 h-4 text-warn" />
            <span>Raise your hand to speak</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-body">
            <Bot className="w-4 h-4 text-accent-bright" />
            <span>AI avatars respond with voice</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="w-3 h-3 animate-spin" />
          Connecting to conversation...
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-ink-surface border border-ink-edge rounded-xl overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-divider bg-ink-raised">
        <div className="flex items-center gap-2">
          <Radio className={cn(
            "w-4 h-4",
            isConnected ? "text-gain animate-pulse" : "text-loss"
          )} />
          <span className="text-sm font-medium text-primary">Live Conversation</span>
          <Badge variant="outline" className="text-xs border-accent-core/30 text-accent-bright">
            <Users className="w-3 h-3 mr-1" />
            {participants.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? (
                  <Volume2 className="h-4 w-4 text-accent-bright" />
                ) : (
                  <VolumeX className="h-4 w-4 text-secondary" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {audioEnabled ? 'Mute read-aloud' : 'Enable read-aloud'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Participants bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-ink-divider overflow-x-auto">
        {participants.slice(0, 8).map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger>
              <div className={cn(
                "relative",
                p.speakingStatus === 'speaking' && "ring-2 ring-gain ring-offset-1 ring-offset-ink-surface rounded-full"
              )}>
                <Avatar className="h-7 w-7 border border-ink-edge">
                  <AvatarImage src={p.imageUrl} />
                  <AvatarFallback className="text-xs bg-ink-raised text-primary">
                    {p.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {p.type === 'avatar' && (
                  <Bot className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-accent-bright bg-ink-surface rounded-full" />
                )}
                {p.role === 'host' && (
                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-warn" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{p.name}</p>
              <p className="text-xs text-secondary">
                {p.type === 'avatar' ? 'AI Avatar' : 'User'} • {p.role}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {participants.length > 8 && (
          <span className="text-xs text-secondary ml-1">+{participants.length - 8}</span>
        )}
      </div>

      {/* Speaker queue (if any) */}
      {speakerQueue.length > 0 && (
        <div className="px-3 py-2 bg-warn/10 border-b border-warn/20">
          <div className="flex items-center gap-2 text-xs text-warn">
            <Hand className="h-3 w-3" />
            <span>Queue:</span>
            {speakerQueue.map((p, idx) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="font-medium">{idx + 1}. {p.name}</span>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                     className="h-4 w-4 hover:bg-gain/20"
                    onClick={() => grantSpeaking(p.id)}
                  >
                    <CheckCircle2 className="h-3 w-3 text-gain" />
                  </Button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isAvatar={msg.speakerType === 'avatar'} />
          ))}
          
          {/* Live transcription indicator */}
          {liveTranscription && (
            <div className="flex items-start gap-2 opacity-60">
              <Loader2 className="h-4 w-4 mt-1 animate-spin text-accent-bright" />
              <div className="text-sm text-body italic">
                {liveTranscription.text}...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t border-ink-divider bg-ink-raised space-y-2">
        {/* Mic permission helper */}
        {hasPermission === false && (
          <div className="flex items-center gap-2 p-2 bg-warn/10 rounded-xl border border-warn/20">
            <AlertCircle className="h-4 w-4 text-warn flex-shrink-0" />
            <span className="text-xs text-warn">Microphone access needed for voice chat</span>
            <Button
              variant="ghost"
              size="sm"
               className="ml-auto text-xs h-6 text-warn hover:text-primary"
              onClick={requestPermission}
            >
              Enable
            </Button>
          </div>
        )}

        {/* Speaking status indicator */}
        {canSpeak && (
          <div className="flex items-center gap-2 p-2 bg-gain/10 rounded-xl border border-gain/20">
            <div className="h-2 w-2 rounded-full bg-gain animate-pulse" />
            <span className="text-xs text-gain font-medium">You're live! Speak or type your message.</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Raise hand / Cancel */}
          {!canSpeak && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isInQueue ? "destructive" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-1",
                    isInQueue 
                       ? "bg-warn/20 hover:bg-warn/30 text-warn border-warn/30"
                       : "border-accent-core/30 text-accent-bright hover:bg-accent-core/10"
                  )}
                  onClick={isInQueue ? cancelSpeakRequest : requestSpeak}
                  data-testid="raise-hand-button"
                >
                  <Hand className={cn("h-3.5 w-3.5", isInQueue && "animate-bounce")} />
                  {isInQueue ? `In Queue (#${myParticipant?.queuePosition || '?'})` : 'Raise Hand'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInQueue ? 'Cancel your request to speak' : 'Request permission to speak with voice'}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Mic controls (when speaking) */}
          {canSpeak && (
            <>
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                className={cn(
                  "gap-1",
                  isRecording 
                    ? "bg-loss hover:bg-loss/80"
                    : "grad-accent hover:bg-accent-deep glow-accent"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={hasPermission === false}
                data-testid="mic-button"
              >
                {isRecording ? (
                  <>
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse mr-1" />
                    <MicOff className="h-3.5 w-3.5" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Start Mic
                  </>
                )}
              </Button>
              {isTranscribing && (
                  <div className="flex items-center gap-1 text-xs text-accent-bright">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Transcribing...
                </div>
              )}
            </>
          )}

          <div className="flex-1" />

          {myParticipant?.isMuted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={unmute}>
                   <VolumeX className="h-4 w-4 text-loss" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unmute yourself</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={mute}>
                   <Volume2 className="h-4 w-4 text-gain" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mute yourself</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message to the avatar..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-ink-surface border-ink-edge text-primary placeholder:text-muted focus:border-accent-core/50"
            data-testid="conversation-input"
          />
          <Button 
            size="icon" 
            onClick={handleSendText}
            disabled={!textInput.trim()}
             className="grad-accent hover:bg-accent-deep glow-accent disabled:opacity-50"
            data-testid="send-message-button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Error display */}
        {error && (
           <div className="flex items-center gap-2 text-xs text-loss">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isAvatar 
}: { 
  message: ConversationMessage; 
  isAvatar: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-2",
      isAvatar && "bg-accent-core/10 -mx-3 px-3 py-2 rounded-xl"
    )}>
      <div className="flex-shrink-0 relative">
        <Avatar className="h-8 w-8 border border-ink-edge">
          <AvatarFallback className={cn(
            "text-xs",
            isAvatar ? "bg-accent-deep text-primary" : "bg-ink-raised text-primary"
          )}>
            {message.speakerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isAvatar && (
          <Bot className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-accent-bright bg-ink-surface rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            isAvatar ? "text-accent-bright" : "text-primary"
          )}>
            {message.speakerName}
          </span>
          <span className="text-xs text-muted">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.sourceType === 'microphone_transcription' && (
            <Mic className="h-3 w-3 text-muted" />
          )}
        </div>
        <div className="flex items-start gap-1">
          <p className="text-sm text-body mt-0.5 whitespace-pre-wrap flex-1">
            {message.textContent}
          </p>
          {isAvatar && (
            <SpeakButton
              text={message.textContent}
              className="h-6 w-6 text-secondary hover:text-primary"
              data-testid={`button-speak-${message.id}`}
            />
          )}
        </div>
        {message.audioUrl && (
          <audio 
            src={message.audioUrl} 
            controls 
            className="mt-2 h-8 w-full max-w-xs"
          />
        )}
      </div>
    </div>
  );
}

export default ConversationPanel;

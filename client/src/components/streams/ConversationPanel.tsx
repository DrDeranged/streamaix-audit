import { useState, useRef, useEffect } from 'react';
import { useStreamConversation, ConversationMessage, ConversationParticipant } from '@/hooks/useStreamConversation';
import { useMicrophone } from '@/hooks/useMicrophone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  User,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAudioReceived = (audioBase64: string, speakerName: string) => {
    if (!audioEnabled) return;
    audioQueueRef.current.push(audioBase64);
    playNextAudio();
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    const audioBase64 = audioQueueRef.current.shift()!;
    
    try {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      await audio.play();
      audio.onended = () => {
        isPlayingRef.current = false;
        playNextAudio();
      };
    } catch (err) {
      console.error('[ConversationPanel] Audio playback error:', err);
      isPlayingRef.current = false;
      playNextAudio();
    }
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
    onAudioReceived: handleAudioReceived,
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

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextInput(textInput.trim());
      setTextInput('');
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

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-xl overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Radio className={cn(
            "w-4 h-4",
            isConnected ? "text-green-400 animate-pulse" : "text-red-400"
          )} />
          <span className="text-sm font-medium text-white">Live Conversation</span>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
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
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {audioEnabled ? 'Mute audio' : 'Enable audio'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Participants bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700/50 overflow-x-auto">
        {participants.slice(0, 8).map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger>
              <div className={cn(
                "relative",
                p.speakingStatus === 'speaking' && "ring-2 ring-green-400 ring-offset-1 ring-offset-slate-900 rounded-full"
              )}>
                <Avatar className="h-7 w-7 border border-slate-600">
                  <AvatarImage src={p.imageUrl} />
                  <AvatarFallback className="text-xs bg-slate-700 text-white">
                    {p.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {p.type === 'avatar' && (
                  <Bot className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-cyan-400 bg-slate-900 rounded-full" />
                )}
                {p.role === 'host' && (
                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{p.name}</p>
              <p className="text-xs text-slate-400">
                {p.type === 'avatar' ? 'AI Avatar' : 'User'} • {p.role}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {participants.length > 8 && (
          <span className="text-xs text-slate-400 ml-1">+{participants.length - 8}</span>
        )}
      </div>

      {/* Speaker queue (if any) */}
      {speakerQueue.length > 0 && (
        <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Hand className="h-3 w-3" />
            <span>Queue:</span>
            {speakerQueue.map((p, idx) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="font-medium">{idx + 1}. {p.name}</span>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-green-500/20"
                    onClick={() => grantSpeaking(p.id)}
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
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
              <Loader2 className="h-4 w-4 mt-1 animate-spin text-cyan-400" />
              <div className="text-sm text-slate-300 italic">
                {liveTranscription.text}...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
        {/* Controls */}
        <div className="flex items-center gap-2 mb-2">
          {/* Raise hand / Cancel */}
          {!canSpeak && (
            <Button
              variant={isInQueue ? "destructive" : "outline"}
              size="sm"
              className={cn(
                "gap-1",
                isInQueue && "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
              )}
              onClick={isInQueue ? cancelSpeakRequest : requestSpeak}
            >
              <Hand className="h-3.5 w-3.5" />
              {isInQueue ? 'Cancel' : 'Raise Hand'}
            </Button>
          )}

          {/* Mic controls (when speaking) */}
          {canSpeak && (
            <>
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                className="gap-1"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={hasPermission === false}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Speak
                  </>
                )}
              </Button>
              {isTranscribing && (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              )}
            </>
          )}

          {myParticipant?.isMuted ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={unmute}>
              <VolumeX className="h-4 w-4 text-red-400" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={mute}>
              <Volume2 className="h-4 w-4 text-green-400" />
            </Button>
          )}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
            data-testid="conversation-input"
          />
          <Button 
            size="icon" 
            onClick={handleSendText}
            disabled={!textInput.trim()}
            className="bg-cyan-600 hover:bg-cyan-500"
            data-testid="send-message-button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
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
      isAvatar && "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 -mx-3 px-3 py-2 rounded-lg"
    )}>
      <div className="flex-shrink-0 relative">
        <Avatar className="h-8 w-8 border border-slate-600">
          <AvatarFallback className={cn(
            "text-xs",
            isAvatar ? "bg-gradient-to-br from-cyan-600 to-purple-600 text-white" : "bg-slate-700 text-white"
          )}>
            {message.speakerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isAvatar && (
          <Bot className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-cyan-400 bg-slate-900 rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            isAvatar ? "text-cyan-300" : "text-white"
          )}>
            {message.speakerName}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.sourceType === 'microphone_transcription' && (
            <Mic className="h-3 w-3 text-slate-500" />
          )}
        </div>
        <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">
          {message.textContent}
        </p>
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

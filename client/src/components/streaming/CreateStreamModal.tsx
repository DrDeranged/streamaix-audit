import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Radio, TrendingUp, Mic, Zap, Brain, Swords, Calendar, 
  Users, Video, Volume2, VolumeX, Sparkles, Clock, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStream: (streamData: StreamFormData) => Promise<void>;
  availableAvatars?: { id: string; name: string; avatar?: string }[];
}

export interface StreamFormData {
  title: string;
  description: string;
  streamType: 'broadcast' | 'trading_room' | 'audio_space' | 'live_bounty' | 'avatar_alpha';
  category: string;
  tags: string[];
  scheduledStart?: Date;
  isPrivate: boolean;
  voiceOption: 'tts' | 'mic' | 'text';
  ttsVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  inviteAvatarId?: string;
  isDebate?: boolean;
  debateTopic?: string;
  debateSide?: 'pro' | 'con';
}

const streamTypes = [
  { value: 'broadcast', label: 'Broadcast', icon: Radio, description: 'General live stream', gradient: 'from-purple-500 to-pink-500' },
  { value: 'trading_room', label: 'Trading Room', icon: TrendingUp, description: 'Market analysis & calls', gradient: 'from-emerald-500 to-cyan-500' },
  { value: 'audio_space', label: 'Audio Space', icon: Mic, description: 'Voice-only discussion', gradient: 'from-cyan-500 to-blue-500' },
  { value: 'live_bounty', label: 'Live Bounty', icon: Zap, description: 'Work on bounties live', gradient: 'from-amber-500 to-orange-500' },
  { value: 'avatar_alpha', label: 'Avatar Alpha', icon: Brain, description: 'AI-powered insights', gradient: 'from-purple-600 to-pink-500' },
];

const voiceOptions = [
  { value: 'tts', label: 'AI Voice (TTS)', icon: Sparkles, description: 'Use AI-generated voice' },
  { value: 'mic', label: 'Microphone', icon: Mic, description: 'Use your own voice' },
  { value: 'text', label: 'Text Only', icon: VolumeX, description: 'No audio, text captions only' },
];

const ttsVoices = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral & balanced' },
  { value: 'echo', label: 'Echo', description: 'Deep & resonant' },
  { value: 'fable', label: 'Fable', description: 'Warm & expressive' },
  { value: 'onyx', label: 'Onyx', description: 'Strong & confident' },
  { value: 'nova', label: 'Nova', description: 'Friendly & upbeat' },
  { value: 'shimmer', label: 'Shimmer', description: 'Clear & energetic' },
];

const categories = [
  'Bitcoin', 'Ethereum', 'DeFi', 'NFTs', 'Trading', 'Market Analysis', 
  'Project Reviews', 'Tech Discussion', 'Community', 'Education', 'News'
];

export function CreateStreamModal({ isOpen, onClose, onCreateStream, availableAvatars = [] }: CreateStreamModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<StreamFormData>({
    title: '',
    description: '',
    streamType: 'broadcast',
    category: 'Trading',
    tags: [],
    isPrivate: false,
    voiceOption: 'text',
    ttsVoice: 'alloy',
    isDebate: false,
    debateTopic: '',
    debateSide: 'pro',
  });
  
  const [tagInput, setTagInput] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a stream title', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submitData = { ...formData };
      if (scheduleEnabled && scheduledDate && scheduledTime) {
        submitData.scheduledStart = new Date(`${scheduledDate}T${scheduledTime}`);
      }
      await onCreateStream(submitData);
      toast({ title: 'Stream created!', description: scheduleEnabled ? 'Your stream has been scheduled' : 'Going live now...' });
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create stream', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const selectedStreamType = streamTypes.find(t => t.value === formData.streamType);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br",
                  selectedStreamType?.gradient || 'from-purple-500 to-pink-500'
                )}>
                  {selectedStreamType && <selectedStreamType.icon className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Stream</h2>
                  <p className="text-xs text-slate-400">Step {step} of 3</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white" data-testid="button-close-modal">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-white mb-3 block">Stream Type</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {streamTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setFormData(prev => ({ ...prev, streamType: type.value as any }))}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all text-left",
                            formData.streamType === type.value
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                          )}
                          data-testid={`button-stream-type-${type.value}`}
                        >
                          <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", type.gradient)}>
                            <type.icon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-sm font-medium text-white">{type.label}</p>
                          <p className="text-xs text-slate-400">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Swords className="w-5 h-5 text-purple-400" />
                        <Label className="text-sm font-medium text-white">Debate Mode</Label>
                      </div>
                      <Switch
                        checked={formData.isDebate}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDebate: checked }))}
                        data-testid="switch-debate-mode"
                      />
                    </div>
                    {formData.isDebate && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 mt-4">
                        <Input
                          value={formData.debateTopic}
                          onChange={(e) => setFormData(prev => ({ ...prev, debateTopic: e.target.value }))}
                          placeholder="Debate topic (e.g., 'Will BTC hit $150K in 2025?')"
                          className="bg-slate-700/50 border-slate-600 text-white"
                          data-testid="input-debate-topic"
                        />
                        <div className="flex gap-3">
                          <Button
                            variant={formData.debateSide === 'pro' ? 'default' : 'outline'}
                            onClick={() => setFormData(prev => ({ ...prev, debateSide: 'pro' }))}
                            className={cn(
                              "flex-1",
                              formData.debateSide === 'pro' ? 'bg-emerald-600' : 'border-slate-600'
                            )}
                            data-testid="button-side-pro"
                          >
                            👍 PRO
                          </Button>
                          <Button
                            variant={formData.debateSide === 'con' ? 'default' : 'outline'}
                            onClick={() => setFormData(prev => ({ ...prev, debateSide: 'con' }))}
                            className={cn(
                              "flex-1",
                              formData.debateSide === 'con' ? 'bg-rose-600' : 'border-slate-600'
                            )}
                            data-testid="button-side-con"
                          >
                            👎 CON
                          </Button>
                        </div>
                        {availableAvatars.length > 0 && (
                          <Select
                            value={formData.inviteAvatarId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, inviteAvatarId: value }))}
                          >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white" data-testid="select-avatar-opponent">
                              <SelectValue placeholder="Invite AI Avatar as opponent" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAvatars.map((avatar) => (
                                <SelectItem key={avatar.id} value={avatar.id}>
                                  {avatar.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-white mb-2 block">Stream Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a catchy title..."
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      data-testid="input-stream-title"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-white mb-2 block">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What will you be covering?"
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                      data-testid="input-stream-description"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-white mb-2 block">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-white mb-2 block">Tags (up to 5)</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        data-testid="input-tag"
                      />
                      <Button onClick={addTag} variant="outline" className="border-slate-600" data-testid="button-add-tag">
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs flex items-center gap-1"
                        >
                          {tag}
                          <button onClick={() => removeTag(i)} className="hover:text-red-400">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <Label className="text-sm font-medium text-white">Schedule for Later</Label>
                      </div>
                      <Switch
                        checked={scheduleEnabled}
                        onCheckedChange={setScheduleEnabled}
                        data-testid="switch-schedule"
                      />
                    </div>
                    {scheduleEnabled && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          data-testid="input-schedule-date"
                        />
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          data-testid="input-schedule-time"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-white mb-3 block">Voice Option</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {voiceOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFormData(prev => ({ ...prev, voiceOption: opt.value as any }))}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all text-center",
                            formData.voiceOption === opt.value
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                          )}
                          data-testid={`button-voice-${opt.value}`}
                        >
                          <opt.icon className={cn(
                            "w-8 h-8 mx-auto mb-2",
                            formData.voiceOption === opt.value ? "text-purple-400" : "text-slate-400"
                          )} />
                          <p className="text-sm font-medium text-white">{opt.label}</p>
                          <p className="text-xs text-slate-400">{opt.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.voiceOption === 'tts' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <Label className="text-sm font-medium text-white mb-3 block">Select AI Voice</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ttsVoices.map((voice) => (
                          <button
                            key={voice.value}
                            onClick={() => setFormData(prev => ({ ...prev, ttsVoice: voice.value as any }))}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all text-left",
                              formData.ttsVoice === voice.value
                                ? "border-cyan-500 bg-cyan-500/20"
                                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                            )}
                            data-testid={`button-tts-voice-${voice.value}`}
                          >
                            <p className="text-sm font-medium text-white">{voice.label}</p>
                            <p className="text-xs text-slate-400">{voice.description}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <Label className="text-sm font-medium text-white">Private Stream</Label>
                      </div>
                      <Switch
                        checked={formData.isPrivate}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                        data-testid="switch-private"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Only invited users can join</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-purple-500/30">
                    <h4 className="text-sm font-bold text-white mb-2">Stream Preview</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-300"><span className="text-slate-500">Title:</span> {formData.title || 'Untitled'}</p>
                      <p className="text-slate-300"><span className="text-slate-500">Type:</span> {selectedStreamType?.label}</p>
                      <p className="text-slate-300"><span className="text-slate-500">Category:</span> {formData.category}</p>
                      <p className="text-slate-300"><span className="text-slate-500">Voice:</span> {voiceOptions.find(v => v.value === formData.voiceOption)?.label}</p>
                      {scheduleEnabled && scheduledDate && (
                        <p className="text-slate-300"><span className="text-slate-500">Scheduled:</span> {scheduledDate} {scheduledTime}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/20">
              <Button
                variant="outline"
                onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                className="border-slate-600 text-slate-300"
                data-testid="button-back"
              >
                {step > 1 ? 'Back' : 'Cancel'}
              </Button>
              
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      s === step ? "bg-purple-500" : s < step ? "bg-purple-500/50" : "bg-slate-600"
                    )}
                  />
                ))}
              </div>
              
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-next"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  data-testid="button-go-live"
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <Clock className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      {scheduleEnabled ? 'Schedule Stream' : 'Go Live'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

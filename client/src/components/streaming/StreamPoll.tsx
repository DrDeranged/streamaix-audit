import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, Clock, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  isActive: boolean;
  createdBy: string;
}

interface StreamPollProps {
  poll: Poll;
  hasVoted?: string;
  onVote: (optionId: string) => void;
  isHost?: boolean;
  onEndPoll?: () => void;
}

interface CreatePollFormProps {
  onCreate: (question: string, options: string[]) => void;
  onCancel: () => void;
}

export function StreamPoll({ poll, hasVoted, onVote, isHost, onEndPoll }: StreamPollProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(hasVoted || null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (poll.endsAt) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(poll.endsAt!);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Ended');
          return;
        }
        
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [poll.endsAt]);

  const handleVote = (optionId: string) => {
    if (hasVoted || !poll.isActive) return;
    setSelectedOption(optionId);
    onVote(optionId);
  };

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl"
    >
      <Surface className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-core/10">
              <BarChart3 className="w-4 h-4 text-accent-bright" />
            </div>
            <div>
              <SectionTitle as="h3">Live Poll</SectionTitle>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <Users className="w-3 h-3" />
                <span className="tabular">{poll.totalVotes} votes</span>
                {timeLeft && (
                  <>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span className="tabular">{timeLeft}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {isHost && poll.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEndPoll}
              className="text-loss hover:text-loss hover:bg-loss/10 h-8 px-2 rounded-xl"
              data-testid="button-end-poll"
            >
              End Poll
            </Button>
          )}
        </div>

        <p className="text-primary font-medium mb-4">{poll.question}</p>

        <div className="space-y-2">
          {poll.options.map((option) => {
            const percentage = getPercentage(option.votes);
            const isSelected = selectedOption === option.id;
            const showResults = !!hasVoted || !poll.isActive;
            
            return (
              <motion.button
                key={option.id}
                whileHover={!hasVoted && poll.isActive ? { scale: 1.01 } : {}}
                whileTap={!hasVoted && poll.isActive ? { scale: 0.99 } : {}}
                onClick={() => handleVote(option.id)}
                disabled={!!hasVoted || !poll.isActive}
                className={cn(
                  "relative w-full p-3 rounded-xl border border-ink-edge text-left overflow-hidden transition-all bg-ink-raised",
                  isSelected
                    ? "border-accent-core bg-accent-core/10 glow-accent"
                    : "hover:border-accent-core/40",
                  (hasVoted || !poll.isActive) && "cursor-default"
                )}
                data-testid={`poll-option-${option.id}`}
              >
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      "absolute inset-y-0 left-0",
                      isSelected ? "bg-accent-core/30" : "bg-ink-edge"
                    )}
                  />
                )}
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-xl bg-accent-core flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary" />
                      </motion.div>
                    )}
                    <span className={cn(
                      "text-sm",
                      isSelected ? "text-primary font-medium" : "text-body"
                    )}>
                      {option.text}
                    </span>
                  </div>
                  
                  {showResults && (
                    <span className={cn(
                      "tabular text-sm font-medium",
                      isSelected ? "text-accent-bright" : "text-secondary"
                    )}>
                      {percentage}%
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {!poll.isActive && (
          <div className="mt-4 pt-3 border-t border-ink-divider text-center">
            <span className="text-xs text-muted">Poll has ended</span>
          </div>
        )}
      </Surface>
    </motion.div>
  );
}

export function CreatePollForm({ onCreate, onCancel }: CreatePollFormProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (!question.trim()) return;
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) return;
    onCreate(question.trim(), validOptions);
  };

  const isValid = question.trim() && options.filter(o => o.trim()).length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl"
    >
      <Surface className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-core/10">
              <BarChart3 className="w-4 h-4 text-accent-bright" />
            </div>
            <SectionTitle as="h3">Create Poll</SectionTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 rounded-xl text-secondary hover:text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="rounded-xl bg-ink-raised border-ink-edge text-primary placeholder:text-muted"
              data-testid="input-poll-question"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 rounded-xl bg-ink-raised border-ink-edge text-primary placeholder:text-muted"
                  data-testid={`input-poll-option-${index}`}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="h-10 w-10 p-0 rounded-xl text-loss hover:text-loss hover:bg-loss/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {options.length < 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="w-full h-10 rounded-xl border border-dashed border-accent-core/30 text-accent-bright hover:bg-accent-core/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
            )}
          </div>

          <Button
            onClick={handleCreate}
            disabled={!isValid}
            className="w-full rounded-xl grad-accent glow-accent hover:bg-accent-deep disabled:opacity-50"
            data-testid="button-create-poll"
          >
            Create Poll
          </Button>
        </div>
      </Surface>
    </motion.div>
  );
}

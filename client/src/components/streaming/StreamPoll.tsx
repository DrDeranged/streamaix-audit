import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Check, Clock, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      className="bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 shadow-xl"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Poll</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-3 h-3" />
              <span>{poll.totalVotes} votes</span>
              {timeLeft && (
                <>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{timeLeft}</span>
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
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
            data-testid="button-end-poll"
          >
            End Poll
          </Button>
        )}
      </div>

      <p className="text-white font-medium mb-4">{poll.question}</p>

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
                "relative w-full p-3 rounded-xl border text-left overflow-hidden transition-all",
                isSelected
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40",
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
                    isSelected ? "bg-purple-500/30" : "bg-slate-700/50"
                  )}
                />
              )}
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  <span className={cn(
                    "text-sm",
                    isSelected ? "text-white font-medium" : "text-slate-300"
                  )}>
                    {option.text}
                  </span>
                </div>
                
                {showResults && (
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-purple-300" : "text-slate-400"
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
        <div className="mt-4 pt-3 border-t border-purple-500/20 text-center">
          <span className="text-xs text-slate-400">Poll has ended</span>
        </div>
      )}
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
      className="bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Create Poll</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Question</label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="bg-slate-800/50 border-purple-500/30 text-white"
            data-testid="input-poll-question"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">Options</label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="bg-slate-800/50 border-purple-500/30 text-white flex-1"
                data-testid={`input-poll-option-${index}`}
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="h-10 w-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
              className="w-full h-10 border border-dashed border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </Button>
          )}
        </div>

        <Button
          onClick={handleCreate}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50"
          data-testid="button-create-poll"
        >
          Create Poll
        </Button>
      </div>
    </motion.div>
  );
}

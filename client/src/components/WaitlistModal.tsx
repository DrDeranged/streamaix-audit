import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Sun, Moon, Bot, Check, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const { data: waitlistCount } = useQuery<{ count: number }>({
    queryKey: ["/api/waitlist/count"],
    staleTime: 60000,
  });

  const waitlistMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      return await apiRequest("/api/waitlist", {
        method: "POST",
        body: JSON.stringify({ ...data, referralSource: "landing_page" }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/count"] });
      
      setTimeout(() => {
        onOpenChange(false);
        setTimeout(() => {
          setIsSuccess(false);
          setEmail("");
          setName("");
        }, 300);
      }, 3500);
    },
    onError: () => {
      toast({
        title: "Unable to join",
        description: "Please check your email and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    waitlistMutation.mutate({ email, name: name || undefined });
  };

  const benefits = [
    { icon: Sun, label: "Morning Alpha", time: "8am EST", color: "from-amber-500 to-orange-500" },
    { icon: Moon, label: "Market Close", time: "4pm EST", color: "from-indigo-500 to-purple-500" },
    { icon: Bot, label: "AI Insights", time: "24/7", color: "from-cyan-500 to-blue-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-[95vw] sm:max-w-md">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Outer glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-cyan-500 to-fuchsia-500 rounded-2xl blur-lg opacity-60 animate-pulse" />
              
              {/* Main card */}
              <div className="relative bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                {/* Animated gradient border overlay */}
                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-purple-500 via-cyan-400 to-fuchsia-500 opacity-50" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                
                {/* Neural network pattern background */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-32 h-32 border border-cyan-500/30 rounded-full" />
                  <div className="absolute bottom-8 right-8 w-24 h-24 border border-purple-500/30 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-fuchsia-500/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="relative p-6 sm:p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 mb-4 shadow-lg shadow-purple-500/30"
                    >
                      <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                        Get Your Daily Alpha
                      </span>
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base">
                      AI-powered market intelligence delivered to your inbox
                    </p>
                  </div>

                  {/* Benefits row */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={benefit.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="relative group"
                      >
                        <div className="p-2 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 hover:border-slate-600/50 transition-all text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${benefit.color} mb-1.5 sm:mb-2 shadow-lg`}>
                            <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="text-[10px] sm:text-xs font-semibold text-white truncate">{benefit.label}</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500">{benefit.time}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative group">
                        <Input
                          type="text"
                          placeholder="Your name (optional)"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 sm:h-14 text-base bg-slate-900/60 border-slate-700/50 rounded-xl focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500"
                          data-testid="input-waitlist-name"
                        />
                      </div>

                      <div className="relative group">
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 sm:h-14 text-base bg-slate-900/60 border-slate-700/50 rounded-xl focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-500"
                          data-testid="input-waitlist-email"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:from-purple-500 hover:via-fuchsia-400 hover:to-cyan-400 border-0 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                      disabled={waitlistMutation.isPending}
                      data-testid="button-waitlist-submit"
                    >
                      {waitlistMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Get Free Alpha
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Footer */}
                  <div className="mt-4 sm:mt-5 text-center space-y-2">
                    {(waitlistCount?.count || 0) > 10 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-300 font-medium">
                          {waitlistCount?.count?.toLocaleString()}+ traders already joined
                        </span>
                      </motion.div>
                    )}
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Unsubscribe anytime. We respect your inbox.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Outer glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-teal-500 rounded-2xl blur-lg opacity-60" />
              
              {/* Success card */}
              <div className="relative bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-8 sm:p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 mb-5 shadow-lg shadow-emerald-500/30"
                >
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-3xl font-bold mb-3"
                >
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    You're In!
                  </span>
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-300 mb-2"
                >
                  Welcome to the alpha traders club.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-1"
                >
                  <p className="text-sm text-slate-400">
                    Check your inbox for a welcome email.
                  </p>
                  <p className="text-xs text-emerald-400/80">
                    First alpha drops tomorrow at 8am EST
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
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
    { icon: Sun, label: "Morning Alpha", time: "8am EST", color: "bg-warn text-ink-page" },
    { icon: Moon, label: "Market Close", time: "4pm EST", color: "bg-accent-core text-primary" },
    { icon: Bot, label: "AI Insights", time: "24/7", color: "bg-gain text-ink-page" },
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
              <Surface className="relative overflow-hidden rounded-2xl bg-ink-surface p-6 sm:p-8">
                {/* Neural network pattern background */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-4 left-4 h-32 w-32 rounded-xl border border-accent-core/20" />
                  <div className="absolute bottom-8 right-8 h-24 w-24 rounded-xl border border-accent-core/20" />
                  <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-accent-core/20" />
                </div>

                <div className="relative">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="glow-accent mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent-core sm:h-16 sm:w-16"
                    >
                      <Zap className="h-7 w-7 text-ink-page sm:h-8 sm:w-8" />
                    </motion.div>
                    
                    <SectionTitle as="h2" className="mb-2 text-2xl font-bold sm:text-3xl">
                      Get Your Daily Alpha
                    </SectionTitle>
                    <p className="text-body text-sm sm:text-base">
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
                        <Surface variant="raised" className="p-2 text-center transition-colors hover:border hover:border-ink-edge sm:p-3">
                          <div className={`mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-xl sm:mb-2 sm:h-10 sm:w-10 ${benefit.color}`}>
                            <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="truncate text-[10px] font-semibold text-primary sm:text-xs">{benefit.label}</div>
                          <div className="text-[9px] text-muted sm:text-[10px]">{benefit.time}</div>
                        </Surface>
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
                           className="h-12 rounded-xl border border-ink-edge bg-ink-raised text-base text-primary transition-colors placeholder:text-muted focus:border-accent-core focus:ring-2 focus:ring-accent-core/20 sm:h-14"
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
                           className="h-12 rounded-xl border border-ink-edge bg-ink-raised text-base text-primary transition-colors placeholder:text-muted focus:border-accent-core focus:ring-2 focus:ring-accent-core/20 sm:h-14"
                          data-testid="input-waitlist-email"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                       className="grad-accent glow-accent h-12 w-full rounded-xl border-0 text-base font-semibold text-primary transition-transform duration-300 hover:-translate-y-0.5 sm:h-14 sm:text-lg"
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
                         className="inline-flex items-center gap-1.5 rounded-xl border border-gain/30 bg-gain/10 px-3 py-1.5"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-gain" />
                        <span className="text-xs font-medium text-gain">
                          {waitlistCount?.count?.toLocaleString()}+ traders already joined
                        </span>
                      </motion.div>
                    )}
                     <p className="text-[11px] text-muted sm:text-xs">
                      Unsubscribe anytime. We respect your inbox.
                    </p>
                  </div>
                </div>
              </Surface>
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
              <Surface className="relative rounded-2xl border border-gain/30 bg-ink-surface p-8 text-center sm:p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                   className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-xl bg-gain"
                >
                   <Check className="h-10 w-10 text-ink-page" strokeWidth={3} />
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                   className="mb-3 text-2xl font-bold text-primary sm:text-3xl"
                >
                   You're In!
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                   className="mb-2 text-body"
                >
                  Welcome to the alpha traders club.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-1"
                >
                   <p className="text-sm text-secondary">
                    Check your inbox for a welcome email.
                  </p>
                   <p className="text-xs text-gain">
                    First alpha drops tomorrow at 8am EST
                  </p>
                </motion.div>
               </Surface>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

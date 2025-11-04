import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
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
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onOpenChange(false);
        // Reset form after close animation completes
        setTimeout(() => {
          setIsSuccess(false);
          setEmail("");
          setName("");
        }, 300);
      }, 3000);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to join waitlist. Please try again.";
      toast({
        title: "Error",
        description: message,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md neural-glass iridescent-border border-2">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <span className="gradient-text-primary">Join the Waitlist</span>
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  Be among the first to experience AI-powered content analysis and prediction markets.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-200">
                    Name (Optional)
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="neural-glass border-purple-500/30 focus:border-cyan-500"
                    data-testid="input-waitlist-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="neural-glass border-purple-500/30 focus:border-cyan-500"
                    data-testid="input-waitlist-email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 border-0 shadow-lg"
                  disabled={waitlistMutation.isPending}
                  data-testid="button-waitlist-submit"
                >
                  {waitlistMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Joining...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Join Waitlist
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-400 mt-4">
                  We'll notify you when StreamAiX launches. No spam, ever.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 mb-4"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold gradient-text-primary mb-2">
                You're on the list!
              </h3>
              <p className="text-slate-300">
                We'll notify you when StreamAiX goes live.
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Check your inbox for a confirmation email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

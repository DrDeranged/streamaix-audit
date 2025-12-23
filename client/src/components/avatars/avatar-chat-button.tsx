import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AvatarChatDialog } from "./avatar-chat-dialog";

interface AvatarChatButtonProps {
  avatar: {
    id: string;
    name: string;
    handle: string;
    bio: string;
    expertise: string;
    imageUrl: string | null;
    verificationStatus?: string;
    investmentThesis?: string | null;
    tradingStyle?: string | null;
    riskTolerance?: string | null;
    marketOutlook?: string | null;
  };
  size?: "sm" | "default" | "lg";
  className?: string;
  variant?: "default" | "card";
}

export function AvatarChatButton({ avatar, size = "sm", className = "", variant = "card" }: AvatarChatButtonProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to chat with Knowledge Avatars.",
        variant: "destructive"
      });
      return;
    }
    
    // Dispatch event to close avatar dialog before opening chat
    window.dispatchEvent(new CustomEvent('streamaix-chat-open'));
    
    // Small delay to allow dialog to close first
    setTimeout(() => {
      setChatOpen(true);
    }, 50);
  };

  if (variant === "card") {
    return (
      <>
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-70 blur-[1px] transition-opacity duration-300 animate-pulse" />
          <Button
            onClick={handleClick}
            size={size}
            variant="outline"
            className="relative px-3 text-xs font-mono bg-gradient-to-r from-purple-500/20 to-cyan-500/20 dark:from-purple-600/30 dark:to-cyan-600/30 backdrop-blur-xl border-0 text-purple-600 dark:text-white hover:from-purple-500/30 hover:to-cyan-500/30 dark:hover:from-purple-600/40 dark:hover:to-cyan-600/40 transition-all duration-300"
            data-testid={`button-chat-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-300 mr-1.5" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
        </div>
        
        <AvatarChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          avatar={avatar}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        size={size}
        className={`bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white ${className}`}
        data-testid={`button-chat-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat with {avatar.name.split(' ')[0]}
      </Button>
      
      <AvatarChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        avatar={avatar}
      />
    </>
  );
}

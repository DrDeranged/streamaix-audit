import { Button } from "@/components/ui/button";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-ink-page">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <motion.div 
          className="absolute left-10 top-20 h-32 w-32 rounded-full bg-accent-core/30 blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-accent-bright/20 blur-2xl"
          animate={{ y: [-25, 15, -25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
         <Surface className="mx-4 w-full max-w-md bg-ink-surface/95 p-6 shadow-2xl backdrop-blur-lg">
             <div className="mb-4 flex items-center gap-3">
               <div className="rounded-xl bg-accent-core p-3">
                 <AlertCircle className="h-6 w-6 text-primary" />
              </div>
               <SectionTitle as="h1">404 Page Not Found</SectionTitle>
            </div>

             <p className="mb-6 mt-4 text-sm text-body">
              Oops! The page you're looking for doesn't exist. Let's get you back on track.
            </p>

            <div className="flex gap-3">
              <Link href="/">
                 <Button className="grad-accent glow-accent flex-1 text-primary hover:bg-accent-deep">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                 className="border-ink-edge text-secondary hover:bg-ink-raised hover:text-primary"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
         </Surface>
      </motion.div>
    </div>
  );
}

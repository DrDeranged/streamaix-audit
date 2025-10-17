import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400 via-fuchsia-400 to-cyan-400 rounded-full blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-cyan-400 via-purple-400 to-fuchsia-400 rounded-full blur-2xl"
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
        <Card className="w-full max-w-md mx-4 backdrop-blur-lg bg-purple-900/20 border-purple-500/30 shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-300 mb-6">
              Oops! The page you're looking for doesn't exist. Let's get you back on track.
            </p>

            <div className="flex gap-3">
              <Link href="/">
                <Button className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

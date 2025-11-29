import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Share, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  showInstallPrompt, 
  canInstallPWA, 
  isPWAInstalled, 
  getDeviceType, 
  isIOSSafari 
} from '@/utils/pwa';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onDismiss }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isPWAInstalled()) return;
    
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < threeDays) {
        setDismissed(true);
        return;
      }
    }
    
    setDeviceType(getDeviceType());
    
    const handleInstallable = () => {
      setTimeout(() => setShowPrompt(true), 3000);
    };
    
    window.addEventListener('pwa-installable', handleInstallable);
    
    if (canInstallPWA()) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
    
    if (isIOSSafari() && !isPWAInstalled()) {
      setTimeout(() => setShowPrompt(true), 5000);
    }
    
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deviceType === 'ios') {
      setShowIOSInstructions(true);
      return;
    }
    
    const result = await showInstallPrompt();
    if (result.outcome === 'accepted') {
      setShowPrompt(false);
    }
  }, [deviceType]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed || isPWAInstalled() || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
          data-testid="pwa-install-prompt"
        >
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-5 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-cyan-500/5 to-violet-500/5" />
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
            
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
              aria-label="Dismiss"
              data-testid="pwa-dismiss-button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Install StreamAiX</h3>
                  <p className="text-sm text-slate-400">
                    {deviceType === 'ios' ? 'Add to Home Screen' : 'Get the app experience'}
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm text-slate-300">
                Install StreamAiX on your {deviceType === 'ios' ? 'iPhone' : deviceType === 'android' ? 'Android' : 'device'} for 
                instant access to prediction markets, AI insights, and push notifications.
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {['Offline Access', 'Push Alerts', 'Fast Launch'].map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {!showIOSInstructions ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500"
                    data-testid="pwa-install-button"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                    data-testid="pwa-later-button"
                  >
                    Later
                  </Button>
                </div>
              ) : (
                <IOSInstallInstructions onClose={() => setShowIOSInstructions(false)} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IOSInstallInstructions({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-3"
    >
      <div className="rounded-lg bg-slate-800/50 p-3">
        <h4 className="mb-2 text-sm font-medium text-white">To install on iOS:</h4>
        <ol className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-300">1</span>
            <span>
              Tap the <Share className="inline h-4 w-4 text-cyan-400" /> Share button in Safari
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-300">2</span>
            <span>
              Scroll down and tap <Plus className="inline h-4 w-4 text-cyan-400" /> "Add to Home Screen"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-300">3</span>
            <span>Tap "Add" to install StreamAiX</span>
          </li>
        </ol>
      </div>
      
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
      >
        <ChevronDown className="mr-2 h-4 w-4" />
        Got it
      </Button>
    </motion.div>
  );
}

export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShowUpdate(true);
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('skipWaiting');
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-4 right-4 top-4 z-50 md:left-auto md:right-4 md:max-w-sm"
    >
      <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-900/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
          <Download className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Update Available</p>
          <p className="text-xs text-slate-400">A new version is ready</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpdate}
          className="bg-cyan-600 text-white hover:bg-cyan-500"
        >
          Update
        </Button>
      </div>
    </motion.div>
  );
}

export default PWAInstallPrompt;

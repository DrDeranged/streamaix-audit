import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Share, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
    
    const handleInstalled = () => {
      setShowPrompt(false);
      setDismissed(true);
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };
    
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('appinstalled', handleInstalled);
    
    if (canInstallPWA()) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
    
    if (isIOSSafari() && !isPWAInstalled()) {
      setTimeout(() => setShowPrompt(true), 5000);
    }
    
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('appinstalled', handleInstalled);
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
           <Surface className="relative overflow-hidden rounded-2xl border border-ink-edge bg-ink-surface p-5 shadow-2xl backdrop-blur-xl">
             <div className="pointer-events-none absolute inset-0 bg-accent-core/5" />
             <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent-core/10 blur-3xl" />
             <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent-bright/5 blur-3xl" />
            
            <button
              onClick={handleDismiss}
               className="absolute right-3 top-3 rounded-xl p-1.5 text-secondary transition-colors hover:bg-ink-raised hover:text-primary"
              aria-label="Dismiss"
              data-testid="pwa-dismiss-button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-core/15 shadow-lg shadow-accent-core/20">
                   <Smartphone className="h-6 w-6 text-accent-bright" />
                </div>
                <div>
                   <SectionTitle as="h3" className="text-base font-semibold">Install StreamAiX</SectionTitle>
                   <p className="text-sm text-secondary">
                    {deviceType === 'ios' ? 'Add to Home Screen' : 'Get the app experience'}
                  </p>
                </div>
              </div>

               <p className="mb-4 text-sm text-body">
                Install StreamAiX on your {deviceType === 'ios' ? 'iPhone' : deviceType === 'android' ? 'Android' : 'device'} for 
                instant access to prediction markets, AI insights, and push notifications.
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {['Offline Access', 'Push Alerts', 'Fast Launch'].map((feature) => (
                  <span
                    key={feature}
                     className="rounded-xl border border-accent-core/20 bg-accent-core/10 px-3 py-1 text-xs font-medium text-accent-bright"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {!showIOSInstructions ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                     className="grad-accent glow-accent flex-1 text-primary hover:bg-accent-deep"
                    data-testid="pwa-install-button"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                     className="border-ink-edge text-secondary hover:bg-ink-raised hover:text-primary"
                    data-testid="pwa-later-button"
                  >
                    Later
                  </Button>
                 </div>
              ) : (
                <IOSInstallInstructions onClose={() => setShowIOSInstructions(false)} />
              )}
            </div>
           </Surface>
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
       <Surface variant="raised" className="p-3">
         <SectionTitle as="h3" className="mb-2 text-sm font-medium">To install on iOS:</SectionTitle>
         <ol className="space-y-2 text-sm text-body">
          <li className="flex items-start gap-2">
             <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xl bg-accent-core/20 text-xs font-medium text-accent-bright">1</span>
            <span>
               Tap the <Share className="inline h-4 w-4 text-accent-bright" /> Share button in Safari
            </span>
          </li>
          <li className="flex items-start gap-2">
             <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xl bg-accent-core/20 text-xs font-medium text-accent-bright">2</span>
            <span>
               Scroll down and tap <Plus className="inline h-4 w-4 text-accent-bright" /> "Add to Home Screen"
            </span>
          </li>
          <li className="flex items-start gap-2">
             <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xl bg-accent-core/20 text-xs font-medium text-accent-bright">3</span>
            <span>Tap "Add" to install StreamAiX</span>
          </li>
        </ol>
       </Surface>
      
      <Button
        variant="outline"
        onClick={onClose}
         className="w-full border-ink-edge text-secondary hover:bg-ink-raised hover:text-primary"
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
       <Surface className="flex items-center gap-3 rounded-xl p-4 shadow-xl backdrop-blur-xl">
         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-core/15">
           <Download className="h-5 w-5 text-accent-bright" />
        </div>
        <div className="flex-1">
           <p className="text-sm font-medium text-primary">Update Available</p>
           <p className="text-xs text-secondary">A new version is ready</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpdate}
           className="grad-accent glow-accent text-primary hover:bg-accent-deep"
        >
          Update
        </Button>
       </Surface>
    </motion.div>
  );
}

export default PWAInstallPrompt;

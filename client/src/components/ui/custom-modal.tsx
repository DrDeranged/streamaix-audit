import { X } from 'lucide-react';
import { useEffect } from 'react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function CustomModal({ isOpen, onClose, children, maxWidth = 'max-w-6xl' }: CustomModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal Container */}
      <div 
        className={`relative w-full ${maxWidth} bg-card/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-lg flex flex-col`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-colors"
          data-testid="button-close-modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Content */}
        <div 
          className="overflow-y-auto overscroll-contain"
          style={{ 
            maxHeight: 'calc(90vh - 0px)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

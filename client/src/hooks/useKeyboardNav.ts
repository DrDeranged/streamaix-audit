import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for keyboard navigation in lists and grids
 */
export function useKeyboardNav<T extends HTMLElement>(
  itemSelector: string,
  options?: {
    loop?: boolean;
    onSelect?: (index: number) => void;
    orientation?: 'vertical' | 'horizontal' | 'grid';
    gridColumns?: number;
  }
) {
  const containerRef = useRef<T>(null);
  const { loop = true, onSelect, orientation = 'vertical', gridColumns = 1 } = options || {};

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll<HTMLElement>(itemSelector);
    if (items.length === 0) return;

    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = Array.from(items).indexOf(activeElement);

    let nextIndex = currentIndex;
    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          nextIndex = orientation === 'grid' 
            ? currentIndex + gridColumns 
            : currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          nextIndex = orientation === 'grid' 
            ? currentIndex - gridColumns 
            : currentIndex - 1;
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          nextIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          nextIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'Home':
        nextIndex = 0;
        handled = true;
        break;
      case 'End':
        nextIndex = items.length - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (currentIndex >= 0 && onSelect) {
          event.preventDefault();
          onSelect(currentIndex);
          return;
        }
        break;
    }

    if (handled) {
      event.preventDefault();

      if (loop) {
        if (nextIndex < 0) nextIndex = items.length - 1;
        if (nextIndex >= items.length) nextIndex = 0;
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
      }

      items[nextIndex]?.focus();
    }
  }, [itemSelector, loop, onSelect, orientation, gridColumns]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return containerRef;
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink(targetId: string) {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  return skipToContent;
}

/**
 * Hook to trap focus within a modal/dialog
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

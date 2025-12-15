/**
 * Skip link component for keyboard accessibility
 * Allows users to skip to main content
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
      data-testid="skip-link"
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only text
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Live region for dynamic announcements
 */
export function LiveRegion({ 
  children, 
  priority = 'polite' 
}: { 
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

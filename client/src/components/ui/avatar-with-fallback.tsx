import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarWithFallbackProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ringClassName?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-16 h-16 text-2xl',
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getDiceBearUrl(name: string): string {
  const seed = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=6366f1,8b5cf6,a855f7,06b6d4,ec4899&backgroundType=gradientLinear`;
}

export function AvatarWithFallback({ 
  src, 
  name, 
  size = 'md', 
  className,
  ringClassName 
}: AvatarWithFallbackProps) {
  const [imgError, setImgError] = useState(false);
  const [dicebearError, setDicebearError] = useState(false);
  
  const sizeClass = sizeClasses[size];
  const initials = getInitials(name);
  const dicebearUrl = getDiceBearUrl(name);
  
  const baseClasses = cn(
    'rounded-full overflow-hidden flex items-center justify-center bg-slate-700/80 flex-shrink-0',
    sizeClass,
    ringClassName,
    className
  );
  
  if (src && !imgError) {
    return (
      <div className={baseClasses}>
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  
  if (!dicebearError) {
    return (
      <div className={baseClasses}>
        <img 
          src={dicebearUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setDicebearError(true)}
        />
      </div>
    );
  }
  
  return (
    <div className={cn(baseClasses, 'bg-gradient-to-br from-purple-600 to-cyan-500')}>
      <span className="font-bold text-white">
        {initials}
      </span>
    </div>
  );
}

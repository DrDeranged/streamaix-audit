import { useEffect, useRef } from 'react';
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';
import { cn } from '@/lib/utils';

interface LiveKitVideoProps {
  track: LocalVideoTrack | RemoteVideoTrack | null;
  className?: string;
  muted?: boolean;
  mirror?: boolean;
}

export function LiveKitVideo({ track, className, muted = false, mirror = false }: LiveKitVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;

    track.attach(el);
    
    return () => {
      track.detach(el);
    };
  }, [track]);

  if (!track) {
    return (
      <div className={cn("bg-slate-900 flex items-center justify-center", className)}>
        <div className="text-slate-500 text-sm">No video</div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={cn(
        "w-full h-full object-cover",
        mirror && "scale-x-[-1]",
        className
      )}
      muted={muted}
      autoPlay
      playsInline
      data-testid="livekit-video"
    />
  );
}

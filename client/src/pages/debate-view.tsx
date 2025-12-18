import { useParams, Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveDebateViewer } from '@/components/streaming/AvatarDebateHub';

export default function DebateViewPage() {
  const params = useParams<{ id: string }>();
  const debateId = params.id;

  if (!debateId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Debate not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/avatars">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-10 w-10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white font-orbitron">Avatar Debate</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <LiveDebateViewer debateId={debateId} />
      </div>
    </div>
  );
}

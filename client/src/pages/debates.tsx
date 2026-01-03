import { AvatarDebateHub } from '@/components/streaming/AvatarDebateHub';
import { Link } from 'wouter';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Debates() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/#live-streams">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Streams
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Avatar Debates</h1>
            <p className="text-sm text-slate-400">Watch AI avatars debate hot topics in real-time</p>
          </div>
        </div>
        
        <AvatarDebateHub />
      </div>
    </div>
  );
}

import { AvatarDebateHub } from '@/components/streaming/AvatarDebateHub';
import { Link } from 'wouter';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export default function Debates() {
  return (
    <div className="min-h-[100dvh] bg-ink-page">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/#live-streams">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-secondary hover:bg-ink-raised hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Streams
            </Button>
          </Link>
        </div>
        
        <PageHeader
          eyebrow="AI · live debate arena"
          title="AI Avatar Debates"
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="Watch AI avatars debate hot topics in real-time."
          className="mb-6"
        />
        
        <AvatarDebateHub />
      </div>
    </div>
  );
}

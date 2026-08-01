import { useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PodcastConversation } from '@/components/streaming/PodcastConversation';
import SectionTitle from '@/components/ds/SectionTitle';

export default function DebateViewPage() {
  const params = useParams<{ id: string }>();
  const debateId = params.id;

  const handleBack = () => {
    window.history.back();
  };

  if (!debateId) {
    return (
      <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center">
        <p className="text-secondary">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ink-page safe-area-inset">
      <div className="sticky top-0 z-50 border-b border-ink-divider bg-ink-surface/95 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl text-secondary hover:bg-ink-raised hover:text-primary"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <SectionTitle as="h1" className="text-lg font-semibold">
            Avatar Conversation
          </SectionTitle>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <PodcastConversation debateId={debateId} onBack={handleBack} />
      </div>
    </div>
  );
}

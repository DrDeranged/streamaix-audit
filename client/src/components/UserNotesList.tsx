import { useQuery } from "@tanstack/react-query";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, FileText, Lightbulb, Clock, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface UserNote {
  id: string;
  userId: string;
  summaryId: string;
  noteText: string;
  noteType: "footnote" | "analysis" | "insight";
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserNotesListProps {
  summaryId?: string;
  title?: string;
}

const noteTypeConfig = {
  footnote: { icon: BookmarkPlus, label: "Footnote", color: "bg-accent-core/15 text-accent-bright border-accent-core/30" },
  analysis: { icon: FileText, label: "Analysis", color: "bg-gain/10 text-gain border-gain/30" },
  insight: { icon: Lightbulb, label: "Insight", color: "bg-warn/10 text-warn border-warn/30" }
};

export default function UserNotesList({ summaryId, title }: UserNotesListProps) {
  const { isAuthenticated, user } = useAuth();
  
  const { data: notesData, isLoading, error } = useQuery({
    queryKey: summaryId ? ["/api/notes", { summaryId }] : ["/api/notes"],
    enabled: isAuthenticated,
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <Surface className="border-dashed border-ink-edge p-6">
        <div className="text-center text-secondary">
            <BookmarkPlus className="mx-auto mb-2 h-8 w-8 text-accent-bright" />
            <p className="font-medium">Sign in to view your notes</p>
            <p className="text-sm text-muted">Your personal notes and insights will appear here</p>
        </div>
      </Surface>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Surface key={i} className="animate-pulse p-5">
            <div className="h-4 w-1/3 rounded-xl bg-ink-raised"></div>
            <div className="mt-5 space-y-2">
                <div className="h-3 w-full rounded-xl bg-ink-raised"></div>
                <div className="h-3 w-2/3 rounded-xl bg-ink-raised"></div>
              </div>
          </Surface>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Surface className="border-loss/30 bg-loss/10 p-6">
        <div className="text-center text-loss">
            <BookmarkPlus className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">Unable to load notes</p>
            <p className="text-sm text-secondary">Please try again later</p>
        </div>
      </Surface>
    );
  }

  const notes = (notesData as any)?.notes || [];

  if (notes.length === 0) {
    return (
      <Surface className="border-dashed border-ink-edge p-6">
        <div className="text-center text-secondary">
            <BookmarkPlus className="mx-auto mb-4 h-12 w-12 text-accent-bright opacity-50" />
            <SectionTitle as="h3" className="mb-2">No notes yet</SectionTitle>
            <p className="text-sm">
              {summaryId 
                ? "Add your first note to this summary to capture insights and analysis."
                : "Your personal notes and insights will appear here."}
            </p>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-4" data-testid="list-user-notes">
      {title && (
        <div className="flex items-center justify-between">
          <SectionTitle as="h3">{title}</SectionTitle>
          <Badge variant="secondary" className="border border-ink-edge bg-ink-raised text-secondary" data-testid="badge-notes-count">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Badge>
        </div>
      )}
      
      {notes.map((note: UserNote) => {
        const noteConfig = noteTypeConfig[note.noteType];
        const IconComponent = noteConfig.icon;
        
        return (
          <Surface key={note.id} className="p-5 transition-colors duration-200 hover:bg-ink-raised" data-testid={`card-note-${note.id}`}>
            <div className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-secondary" />
                  <Badge className={noteConfig.color} variant="secondary">
                    {noteConfig.label}
                  </Badge>
                  {!note.isPrivate && (
                    <Badge variant="outline" className="border-ink-edge text-xs text-secondary">
                      Public
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock className="w-3 h-3" />
                  <span data-testid={`text-note-date-${note.id}`}>
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-0">
              <p className="whitespace-pre-wrap leading-relaxed text-body" data-testid={`text-note-content-${note.id}`}>
                {note.noteText}
              </p>
              
              <div className="mt-4 flex items-center justify-between border-t border-ink-divider pt-4">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="tap-target rounded-xl text-accent-bright hover:bg-ink-raised hover:text-primary"
                    data-testid={`button-view-summary-${note.id}`}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Summary
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="tap-target rounded-xl text-muted hover:bg-loss/10 hover:text-loss"
                  data-testid={`button-delete-note-${note.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
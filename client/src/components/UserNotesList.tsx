import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, FileText, Lightbulb, Clock, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  footnote: { icon: BookmarkPlus, label: "Footnote", color: "bg-blue-100 text-blue-800" },
  analysis: { icon: FileText, label: "Analysis", color: "bg-green-100 text-green-800" },
  insight: { icon: Lightbulb, label: "Insight", color: "bg-yellow-100 text-yellow-800" }
};

export default function UserNotesList({ summaryId, title }: UserNotesListProps) {
  const { data: notesData, isLoading, error } = useQuery({
    queryKey: summaryId ? ["/api/notes", { summaryId }] : ["/api/notes"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <BookmarkPlus className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Unable to load notes</p>
            <p className="text-sm">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const notes = (notesData as any)?.notes || [];

  if (notes.length === 0) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <BookmarkPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No notes yet</h3>
            <p className="text-sm">
              {summaryId 
                ? "Add your first note to this summary to capture insights and analysis."
                : "Your personal notes and insights will appear here."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="list-user-notes">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary" data-testid="badge-notes-count">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Badge>
        </div>
      )}
      
      {notes.map((note: UserNote) => {
        const noteConfig = noteTypeConfig[note.noteType];
        const IconComponent = noteConfig.icon;
        
        return (
          <Card key={note.id} className="hover:shadow-md transition-shadow duration-200" data-testid={`card-note-${note.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-gray-600" />
                  <Badge className={noteConfig.color} variant="secondary">
                    {noteConfig.label}
                  </Badge>
                  {!note.isPrivate && (
                    <Badge variant="outline" className="text-xs">
                      Public
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span data-testid={`text-note-date-${note.id}`}>
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed" data-testid={`text-note-content-${note.id}`}>
                {note.noteText}
              </p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    data-testid={`button-view-summary-${note.id}`}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Summary
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  data-testid={`button-delete-note-${note.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
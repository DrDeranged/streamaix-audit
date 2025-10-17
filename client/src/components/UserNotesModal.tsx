import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookmarkPlus, FileText, Lightbulb } from "lucide-react";

interface UserNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryId: string;
  summaryTitle: string;
}

const noteTypeOptions = [
  { value: "footnote", label: "Footnote", icon: BookmarkPlus, description: "Add a personal note or reference" },
  { value: "analysis", label: "Analysis", icon: FileText, description: "Share your detailed analysis" },
  { value: "insight", label: "Insight", icon: Lightbulb, description: "Record a key insight or learning" }
];

export default function UserNotesModal({ isOpen, onClose, summaryId, summaryTitle }: UserNotesModalProps) {
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("footnote");
  const [isPrivate, setIsPrivate] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { summaryId: string; noteText: string; noteType: string; isPrivate: boolean }) => {
      return await apiRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify(noteData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Note saved!",
        description: "Your note has been added to your personal collection.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNoteText("");
      setNoteType("footnote");
      setIsPrivate(true);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save note",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast({
        title: "Note content required",
        description: "Please enter some content for your note.",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      summaryId,
      noteText: noteText.trim(),
      noteType,
      isPrivate,
    });
  };

  const selectedNoteType = noteTypeOptions.find(option => option.value === noteType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900/95 border-purple-500/30 backdrop-blur-sm" data-testid="modal-user-notes">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5" />
            Add Personal Note
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adding note to: <span className="font-medium">{summaryTitle}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Note Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="noteType">Note Type</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger data-testid="select-note-type">
                <SelectValue placeholder="Select note type" />
              </SelectTrigger>
              <SelectContent>
                {noteTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Note Content */}
          <div className="space-y-3">
            <Label htmlFor="noteText">
              {selectedNoteType?.label} Content
            </Label>
            <Textarea
              id="noteText"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Write your ${selectedNoteType?.label.toLowerCase()} here...`}
              className="min-h-[120px] resize-none"
              maxLength={5000}
              data-testid="textarea-note-content"
            />
            <div className="text-xs text-muted-foreground text-right">
              {noteText.length}/5000 characters
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="privacy">Note Visibility</Label>
              <p className="text-sm text-muted-foreground">
                {isPrivate ? "Only visible to you" : "Visible to others viewing this summary"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="privacy-toggle" className="text-sm">
                {isPrivate ? "Private" : "Public"}
              </Label>
              <Switch
                id="privacy-toggle"
                checked={!isPrivate}
                onCheckedChange={(checked) => setIsPrivate(!checked)}
                data-testid="switch-note-privacy"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createNoteMutation.isPending}
              data-testid="button-cancel-note"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createNoteMutation.isPending || !noteText.trim()}
              data-testid="button-save-note"
            >
              {createNoteMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
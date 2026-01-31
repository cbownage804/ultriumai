/**
 * Internal Ticket Notes - MSP-only notes invisible to clients
 * Supports different note types: internal, escalation, handoff, ai_suggestion
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lock, 
  MessageSquare, 
  Pin, 
  PinOff, 
  Send,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  Brain,
  Clock,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InternalNote {
  id: string;
  ticket_id: string;
  user_id: string;
  note_content: string;
  note_type: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface InternalTicketNotesProps {
  ticketId: string;
  ticketNumber?: string;
}

export const InternalTicketNotes = ({ ticketId, ticketNumber }: InternalTicketNotesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<string>('internal');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [ticketId]);

  const fetchNotes = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('vanguard_internal_ticket_notes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch internal notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newNote.trim() || !user?.id) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('vanguard_internal_ticket_notes')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        note_content: newNote.trim(),
        note_type: noteType,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add internal note.",
        variant: "destructive",
      });
    } else {
      setNewNote('');
      fetchNotes();
      toast({
        title: "Note Added",
        description: "Internal note saved successfully.",
      });
    }
    setSubmitting(false);
  };

  const handleTogglePin = async (note: InternalNote) => {
    const { error } = await supabase
      .from('vanguard_internal_ticket_notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', note.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
    } else {
      fetchNotes();
    }
  };

  const handleDelete = async (noteId: string) => {
    const { error } = await supabase
      .from('vanguard_internal_ticket_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    } else {
      fetchNotes();
      toast({
        title: "Note Deleted",
        description: "Internal note removed.",
      });
    }
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'escalation': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'handoff': return <ArrowRightLeft className="h-4 w-4 text-blue-400" />;
      case 'ai_suggestion': return <Brain className="h-4 w-4 text-purple-400" />;
      default: return <MessageSquare className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getNoteTypeBadge = (type: string) => {
    switch (type) {
      case 'escalation': return { label: 'Escalation', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'handoff': return { label: 'Handoff', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'ai_suggestion': return { label: 'AI Suggestion', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      default: return { label: 'Internal', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-400" />
          Internal Notes
          <Badge variant="outline" className="ml-2 border-red-400/30 text-red-400 text-xs">
            MSP Only
          </Badge>
        </CardTitle>
        {ticketNumber && (
          <p className="text-sm text-white/60">Ticket #{ticketNumber}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Internal
                  </div>
                </SelectItem>
                <SelectItem value="escalation">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Escalation
                  </div>
                </SelectItem>
                <SelectItem value="handoff">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Handoff
                  </div>
                </SelectItem>
                <SelectItem value="ai_suggestion">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Suggestion
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an internal note (clients cannot see this)..."
            className="bg-white/5 border-white/10 min-h-[80px]"
          />
          <Button 
            onClick={handleSubmit}
            disabled={!newNote.trim() || submitting}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Adding...' : 'Add Internal Note'}
          </Button>
        </div>

        {/* Notes List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-white/60 py-8">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center text-white/60 py-8">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No internal notes yet</p>
                <p className="text-sm">Notes added here are only visible to MSP staff</p>
              </div>
            ) : (
              notes.map((note) => {
                const typeBadge = getNoteTypeBadge(note.note_type);
                return (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border ${
                      note.is_pinned 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getNoteTypeIcon(note.note_type)}
                        <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                        {note.is_pinned && (
                          <Pin className="h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white/40 hover:text-white"
                          onClick={() => handleTogglePin(note)}
                        >
                          {note.is_pinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">{note.note_content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Tech
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(note.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InternalTicketNotes;

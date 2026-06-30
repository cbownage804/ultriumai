import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { PBKDF2_ITERATIONS } from '@/utils/crypto';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Star,
  Copy,
  Loader2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SecureNote {
  id: string;
  title: string;
  encrypted_content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface DecryptedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
}

export const SecureNotes = () => {
  const { user } = useAuth();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DecryptedNote | null>(null);
  const [viewingNote, setViewingNote] = useState<DecryptedNote | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });

  // Encryption helpers
  const encryptContent = async (content: string): Promise<string> => {
    if (!masterPassword) throw new Error('Master password required');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return JSON.stringify({
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    });
  };

  const decryptContent = async (encryptedData: string): Promise<string> => {
    if (!masterPassword) throw new Error('Master password required');
    
    const { iv, salt, ciphertext } = JSON.parse(encryptedData);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const saltArray = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    const ciphertextArray = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltArray, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      ciphertextArray
    );

    return decoder.decode(decrypted);
  };

  // Load and decrypt notes
  useEffect(() => {
    const loadNotes = async () => {
      if (!user || !isUnlocked) {
        setNotes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('safepass_notes')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const decrypted: DecryptedNote[] = [];
        for (const note of data || []) {
          try {
            const content = await decryptContent(note.encrypted_content);
            decrypted.push({
              id: note.id,
              title: note.title,
              content,
              tags: note.tags || [],
              is_favorite: note.is_favorite,
              created_at: note.created_at
            });
          } catch {
            console.error('Failed to decrypt note');
          }
        }
        setNotes(decrypted);
      } catch (error) {
        console.error('Error loading notes:', error);
        toast.error('Failed to load secure notes');
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user, isUnlocked, masterPassword]);

  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const encryptedContent = await encryptContent(newNote.content);
      const tags = newNote.tags.split(',').map(t => t.trim()).filter(Boolean);

      if (editingNote) {
        const { error } = await supabase
          .from('safepass_notes')
          .update({
            title: newNote.title,
            encrypted_content: encryptedContent,
            tags
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        
        setNotes(prev => prev.map(n => 
          n.id === editingNote.id 
            ? { ...n, title: newNote.title, content: newNote.content, tags }
            : n
        ));
        toast.success('Note updated successfully');
      } else {
        const { data, error } = await supabase
          .from('safepass_notes')
          .insert({
            user_id: user?.id,
            title: newNote.title,
            encrypted_content: encryptedContent,
            tags
          })
          .select()
          .single();

        if (error) throw error;

        setNotes(prev => [{
          id: data.id,
          title: newNote.title,
          content: newNote.content,
          tags,
          is_favorite: false,
          created_at: data.created_at
        }, ...prev]);
        toast.success('Secure note created');
      }

      setIsAddDialogOpen(false);
      setEditingNote(null);
      setNewNote({ title: '', content: '', tags: '' });
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('safepass_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const toggleFavorite = async (note: DecryptedNote) => {
    try {
      const { error } = await supabase
        .from('safepass_notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', note.id);

      if (error) throw error;

      setNotes(prev => prev.map(n => 
        n.id === note.id ? { ...n, is_favorite: !n.is_favorite } : n
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isUnlocked) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Vault Locked</h3>
        <p className="text-muted-foreground">Unlock your vault to view secure notes</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Secure Notes
          </h3>
          <p className="text-muted-foreground text-sm">Store encrypted notes securely</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary text-black" onClick={() => {
              setEditingNote(null);
              setNewNote({ title: '', content: '', tags: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'New Secure Note'}</DialogTitle>
              <DialogDescription>Your note will be encrypted with your master password</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-title">Title *</Label>
                <Input
                  id="note-title"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Note title"
                />
              </div>
              
              <div>
                <Label htmlFor="note-content">Content *</Label>
                <Textarea
                  id="note-content"
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your secure note..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="note-tags">Tags (comma separated)</Label>
                <Input
                  id="note-tags"
                  value={newNote.tags}
                  onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="personal, work, important"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveNote} className="flex-1 bg-primary hover:bg-primary text-black">
                  {editingNote ? 'Update' : 'Save'} Note
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Secure Notes</h3>
          <p className="text-muted-foreground mb-4">Create your first encrypted note</p>
          <Button className="bg-primary hover:bg-primary text-black" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {note.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(note);
                        }}
                      >
                        <Star className={`h-4 w-4 ${note.is_favorite ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {note.content}
                    </p>
                    
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {note.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingNote(note);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(note.content);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNote(note);
                            setNewNote({
                              title: note.title,
                              content: note.content,
                              tags: note.tags.join(', ')
                            });
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* View Note Dialog */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingNote?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
              {viewingNote?.content}
            </div>
            {viewingNote?.tags && viewingNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {viewingNote.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => viewingNote && copyToClipboard(viewingNote.content)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={() => setViewingNote(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

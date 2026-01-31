import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Pencil, Trash2, Pin, PinOff } from 'lucide-react';
import { useVanguardAtlas, AtlasDocument } from '@/hooks/useVanguardAtlas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentFormData {
  title: string;
  content: string;
  category: string;
}

const CATEGORIES = ['General', 'Network', 'Security', 'Hardware', 'Software', 'Procedures', 'Onboarding'];

const initialFormData: DocumentFormData = {
  title: '',
  content: '',
  category: 'General',
};

export function AtlasDocuments({ organizationId }: { organizationId?: string }) {
  const { documents, createDocument, updateDocument, deleteDocument, isLoading } = useVanguardAtlas(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AtlasDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AtlasDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<AtlasDocument | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setEditingDoc(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleView = (doc: AtlasDocument) => {
    setViewingDoc(doc);
    setViewDialogOpen(true);
  };

  const handleEdit = (doc: AtlasDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content || '',
      category: doc.category,
    });
    setDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleDeleteClick = (doc: AtlasDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingDoc(doc);
    setDeleteDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleTogglePin = async (doc: AtlasDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateDocument(doc.id, { is_pinned: !doc.is_pinned });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    setSaving(true);
    try {
      if (editingDoc) {
        await updateDocument(editingDoc.id, formData);
      } else {
        await createDocument({ ...formData, organization_id: organizationId });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    
    await deleteDocument(deletingDoc.id);
    setDeleteDialogOpen(false);
    setDeletingDoc(null);
  };

  // Sort: pinned first, then by updated_at
  const sortedDocs = [...documents].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />New Document
        </Button>
      </div>
      
      <div className="grid gap-2">
        {sortedDocs.map((doc) => (
          <Card 
            key={doc.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleView(doc)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{doc.title}</p>
                  {doc.is_pinned && <Pin className="h-3 w-3 text-amber-400" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {doc.category} • {new Date(doc.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => handleTogglePin(doc, e)}
                >
                  {doc.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => handleEdit(doc, e)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => handleDeleteClick(doc, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No documents yet.</p>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2 text-sm text-muted-foreground mb-4">
              <span className="px-2 py-1 bg-accent rounded">{viewingDoc?.category}</span>
              <span>Updated: {viewingDoc && new Date(viewingDoc.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {viewingDoc?.content || 'No content'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDeleteClick(viewingDoc!)}>
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
            <Button onClick={() => handleEdit(viewingDoc!)}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? 'Edit Document' : 'New Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Document title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Document content..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.title.trim()}>
              {saving ? 'Saving...' : editingDoc ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDoc?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

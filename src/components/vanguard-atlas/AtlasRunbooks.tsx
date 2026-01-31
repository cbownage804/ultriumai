import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Pencil, Trash2, Clock, CheckCircle } from 'lucide-react';
import { useVanguardAtlas, AtlasRunbook } from '@/hooks/useVanguardAtlas';
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
import { Switch } from '@/components/ui/switch';
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

interface RunbookFormData {
  title: string;
  content: string;
  category: string;
  estimated_time_minutes: string;
  difficulty_level: string;
  is_published: boolean;
}

const CATEGORIES = ['General', 'Onboarding', 'Offboarding', 'Troubleshooting', 'Maintenance', 'Security', 'Disaster Recovery'];
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Expert'];

const initialFormData: RunbookFormData = {
  title: '',
  content: '',
  category: 'General',
  estimated_time_minutes: '',
  difficulty_level: 'Medium',
  is_published: false,
};

export function AtlasRunbooks({ organizationId }: { organizationId?: string }) {
  const { runbooks, createRunbook, updateRunbook, deleteRunbook, isLoading } = useVanguardAtlas(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingRb, setEditingRb] = useState<AtlasRunbook | null>(null);
  const [viewingRb, setViewingRb] = useState<AtlasRunbook | null>(null);
  const [deletingRb, setDeletingRb] = useState<AtlasRunbook | null>(null);
  const [formData, setFormData] = useState<RunbookFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setEditingRb(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleView = (rb: AtlasRunbook) => {
    setViewingRb(rb);
    setViewDialogOpen(true);
  };

  const handleEdit = (rb: AtlasRunbook, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingRb(rb);
    setFormData({
      title: rb.title,
      content: rb.content || '',
      category: rb.category,
      estimated_time_minutes: rb.estimated_time_minutes?.toString() || '',
      difficulty_level: rb.difficulty_level,
      is_published: rb.is_published,
    });
    setDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleDeleteClick = (rb: AtlasRunbook, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingRb(rb);
    setDeleteDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    setSaving(true);
    try {
      const data = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        estimated_time_minutes: formData.estimated_time_minutes ? parseInt(formData.estimated_time_minutes) : null,
        difficulty_level: formData.difficulty_level,
        is_published: formData.is_published,
      };
      
      if (editingRb) {
        await updateRunbook(editingRb.id, data);
      } else {
        await createRunbook({ ...data, organization_id: organizationId });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRb) return;
    
    await deleteRunbook(deletingRb.id);
    setDeleteDialogOpen(false);
    setDeletingRb(null);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-amber-400';
      case 'Hard': return 'text-orange-400';
      case 'Expert': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

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
        <h2 className="text-lg font-semibold">Runbooks / SOPs</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />Create Runbook
        </Button>
      </div>
      
      <div className="grid gap-2">
        {runbooks.map((rb) => (
          <Card 
            key={rb.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleView(rb)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-pink-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{rb.title}</p>
                  {rb.is_published && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 bg-accent rounded">{rb.category}</span>
                  <span className={getDifficultyColor(rb.difficulty_level)}>{rb.difficulty_level}</span>
                  {rb.estimated_time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rb.estimated_time_minutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => handleEdit(rb, e)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => handleDeleteClick(rb, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {runbooks.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No runbooks yet.</p>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingRb?.title}
              {viewingRb?.is_published && (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Published</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
              <span className="px-2 py-1 bg-accent rounded">{viewingRb?.category}</span>
              <span className={`px-2 py-1 rounded ${getDifficultyColor(viewingRb?.difficulty_level || '')}`}>
                {viewingRb?.difficulty_level}
              </span>
              {viewingRb?.estimated_time_minutes && (
                <span className="flex items-center gap-1 px-2 py-1 bg-accent rounded">
                  <Clock className="h-3 w-3" />
                  {viewingRb.estimated_time_minutes} minutes
                </span>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {viewingRb?.content || 'No content'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDeleteClick(viewingRb!)}>
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
            <Button onClick={() => handleEdit(viewingRb!)}>
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
              {editingRb ? 'Edit Runbook' : 'New Runbook'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., New Employee Onboarding"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={formData.difficulty_level} 
                  onValueChange={(v) => setFormData({ ...formData, difficulty_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Est. Time (min)</Label>
                <Input
                  id="time"
                  type="number"
                  value={formData.estimated_time_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_time_minutes: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Step-by-step instructions..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_published">Published (visible to technicians)</Label>
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.title.trim()}>
              {saving ? 'Saving...' : editingRb ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Runbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRb?.title}"? This action cannot be undone.
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

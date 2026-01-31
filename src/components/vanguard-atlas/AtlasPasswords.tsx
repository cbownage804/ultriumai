import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Plus, Pencil, Trash2, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useVanguardAtlas, AtlasPassword } from '@/hooks/useVanguardAtlas';
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
import { toast } from 'sonner';

interface PasswordFormData {
  name: string;
  username: string;
  password_encrypted: string;
  url: string;
  notes: string;
  category: string;
}

const CATEGORIES = ['General', 'Admin', 'Server', 'Cloud', 'Email', 'Application', 'Network'];

const initialFormData: PasswordFormData = {
  name: '',
  username: '',
  password_encrypted: '',
  url: '',
  notes: '',
  category: 'General',
};

export function AtlasPasswords({ organizationId }: { organizationId?: string }) {
  const { passwords, createPassword, updatePassword, deletePassword, isLoading } = useVanguardAtlas(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPwd, setEditingPwd] = useState<AtlasPassword | null>(null);
  const [deletingPwd, setDeletingPwd] = useState<AtlasPassword | null>(null);
  const [formData, setFormData] = useState<PasswordFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [showFormPassword, setShowFormPassword] = useState(false);

  const handleCreate = () => {
    setEditingPwd(null);
    setFormData(initialFormData);
    setShowFormPassword(false);
    setDialogOpen(true);
  };

  const handleEdit = (pwd: AtlasPassword, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPwd(pwd);
    setFormData({
      name: pwd.name,
      username: pwd.username || '',
      password_encrypted: pwd.password_encrypted || '',
      url: pwd.url || '',
      notes: pwd.notes || '',
      category: pwd.category,
    });
    setShowFormPassword(false);
    setDialogOpen(true);
  };

  const handleDeleteClick = (pwd: AtlasPassword, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPwd(pwd);
    setDeleteDialogOpen(true);
  };

  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const togglePasswordVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      if (editingPwd) {
        await updatePassword(editingPwd.id, formData);
      } else {
        await createPassword({ ...formData, organization_id: organizationId });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPwd) return;
    
    await deletePassword(deletingPwd.id);
    setDeleteDialogOpen(false);
    setDeletingPwd(null);
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
        <h2 className="text-lg font-semibold">Passwords</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Password
        </Button>
      </div>
      
      <div className="grid gap-2">
        {passwords.map((pwd) => (
          <Card key={pwd.id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{pwd.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-accent rounded">{pwd.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{pwd.username || 'No username'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pwd.password_encrypted && (
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {showPassword[pwd.id] ? pwd.password_encrypted : '••••••••'}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => togglePasswordVisibility(pwd.id, e)}
                      >
                        {showPassword[pwd.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => handleCopy(pwd.password_encrypted!, 'Password', e)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {pwd.url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(pwd.url!, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => handleEdit(pwd, e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteClick(pwd, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {passwords.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No passwords stored.</p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPwd ? 'Edit Password' : 'New Password'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Domain Admin"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="admin@domain.com"
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
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showFormPassword ? 'text' : 'password'}
                  value={formData.password_encrypted}
                  onChange={(e) => setFormData({ ...formData, password_encrypted: e.target.value })}
                  placeholder="••••••••"
                  className="font-mono"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                >
                  {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://portal.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving...' : editingPwd ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPwd?.name}"? This action cannot be undone.
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

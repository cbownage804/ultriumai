import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useVanguardAtlas, AtlasOrganization } from '@/hooks/useVanguardAtlas';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrganizationFormData {
  name: string;
  description: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  website: string;
  address: string;
}

const initialFormData: OrganizationFormData = {
  name: '',
  description: '',
  primary_contact_name: '',
  primary_contact_email: '',
  primary_contact_phone: '',
  website: '',
  address: '',
};

export function AtlasOrganizations({ 
  selectedOrg, 
  onSelectOrg 
}: { 
  selectedOrg?: string; 
  onSelectOrg: (id: string) => void;
}) {
  const { organizations, createOrganization, updateOrganization, deleteOrganization, isLoading } = useVanguardAtlas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<AtlasOrganization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<AtlasOrganization | null>(null);
  const [formData, setFormData] = useState<OrganizationFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setEditingOrg(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleEdit = (org: AtlasOrganization, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      primary_contact_name: org.primary_contact_name || '',
      primary_contact_email: org.primary_contact_email || '',
      primary_contact_phone: org.primary_contact_phone || '',
      website: org.website || '',
      address: org.address || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (org: AtlasOrganization, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingOrg(org);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, formData);
      } else {
        await createOrganization(formData);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrg) return;
    
    await deleteOrganization(deletingOrg.id);
    setDeleteDialogOpen(false);
    setDeletingOrg(null);
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
        <h2 className="text-lg font-semibold">Organizations</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Organization
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map(org => (
          <Card 
            key={org.id} 
            className={`cursor-pointer transition-all hover:border-primary ${selectedOrg === org.id ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => onSelectOrg(org.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-8 w-8 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{org.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {org.description || 'No description'}
                  </p>
                  {org.primary_contact_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact: {org.primary_contact_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => handleEdit(org, e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteClick(org, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {organizations.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No organizations yet. Create your first one!
          </p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? 'Edit Organization' : 'New Organization'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving...' : editingOrg ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingOrg?.name}"? This will also delete all associated documents, passwords, configurations, and runbooks. This action cannot be undone.
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

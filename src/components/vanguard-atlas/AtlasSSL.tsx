import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useVanguardAtlas, AtlasSSLCertificate } from '@/hooks/useVanguardAtlas';
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

interface SSLFormData {
  domain: string;
  issuer: string;
  valid_from: string;
  valid_until: string;
  certificate_type: string;
  auto_renew: boolean;
  notes: string;
}

const CERT_TYPES = ['Standard', 'Wildcard', 'Extended Validation', 'Organization Validated', 'Domain Validated'];

const initialFormData: SSLFormData = {
  domain: '',
  issuer: '',
  valid_from: '',
  valid_until: '',
  certificate_type: 'Standard',
  auto_renew: false,
  notes: '',
};

export function AtlasSSL({ organizationId }: { organizationId?: string }) {
  const { sslCertificates, createSSLCertificate, updateSSLCertificate, deleteSSLCertificate, isLoading } = useVanguardAtlas(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<AtlasSSLCertificate | null>(null);
  const [deletingCert, setDeletingCert] = useState<AtlasSSLCertificate | null>(null);
  const [formData, setFormData] = useState<SSLFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setEditingCert(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleEdit = (cert: AtlasSSLCertificate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCert(cert);
    setFormData({
      domain: cert.domain,
      issuer: cert.issuer || '',
      valid_from: cert.valid_from ? cert.valid_from.split('T')[0] : '',
      valid_until: cert.valid_until ? cert.valid_until.split('T')[0] : '',
      certificate_type: cert.certificate_type,
      auto_renew: cert.auto_renew,
      notes: cert.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (cert: AtlasSSLCertificate, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCert(cert);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.domain.trim()) return;
    
    setSaving(true);
    try {
      const data = {
        ...formData,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      };
      
      if (editingCert) {
        await updateSSLCertificate(editingCert.id, data);
      } else {
        await createSSLCertificate({ ...data, organization_id: organizationId });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCert) return;
    
    await deleteSSLCertificate(deletingCert.id);
    setDeleteDialogOpen(false);
    setDeletingCert(null);
  };

  const getDaysUntilExpiry = (validUntil?: string) => {
    if (!validUntil) return null;
    return Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number | null) => {
    if (days === null) return { color: 'text-muted-foreground', icon: null, label: 'Unknown' };
    if (days <= 0) return { color: 'text-red-400', icon: AlertTriangle, label: 'Expired' };
    if (days <= 14) return { color: 'text-red-400', icon: AlertTriangle, label: `${days} days` };
    if (days <= 30) return { color: 'text-amber-400', icon: AlertTriangle, label: `${days} days` };
    return { color: 'text-green-400', icon: CheckCircle, label: `${days} days` };
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
        <h2 className="text-lg font-semibold">SSL Certificates</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Certificate
        </Button>
      </div>
      
      <div className="grid gap-2">
        {sslCertificates.map((cert) => {
          const days = getDaysUntilExpiry(cert.valid_until);
          const status = getExpiryStatus(days);
          const StatusIcon = status.icon;
          
          return (
            <Card 
              key={cert.id} 
              className={`hover:bg-accent/50 transition-colors ${days !== null && days <= 30 ? 'border-amber-500/50' : ''} ${days !== null && days <= 0 ? 'border-red-500/50' : ''}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cert.domain}</p>
                    <span className="text-xs px-2 py-0.5 bg-accent rounded">{cert.certificate_type}</span>
                    {cert.auto_renew && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Auto-renew</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cert.issuer || 'Unknown issuer'} • Expires: {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 ${status.color}`}>
                    {StatusIcon && <StatusIcon className="h-4 w-4" />}
                    <span className="text-sm font-medium">{status.label}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => handleEdit(cert, e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteClick(cert, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {sslCertificates.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No SSL certificates tracked.</p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCert ? 'Edit SSL Certificate' : 'New SSL Certificate'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com or *.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="Let's Encrypt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert_type">Type</Label>
                <Select 
                  value={formData.certificate_type} 
                  onValueChange={(v) => setFormData({ ...formData, certificate_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_renew">Auto-renew enabled</Label>
              <Switch
                id="auto_renew"
                checked={formData.auto_renew}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_renew: checked })}
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
            <Button onClick={handleSave} disabled={saving || !formData.domain.trim()}>
              {saving ? 'Saving...' : editingCert ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SSL Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the certificate for "{deletingCert?.domain}"? This action cannot be undone.
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

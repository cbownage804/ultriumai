import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useVanguardAtlas, AtlasExpiration } from '@/hooks/useVanguardAtlas';
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

interface ExpirationFormData {
  item_type: string;
  item_name: string;
  expires_at: string;
  notes: string;
}

const ITEM_TYPES = ['License', 'SSL Certificate', 'Domain', 'Warranty', 'Contract', 'Subscription', 'Support Agreement', 'Other'];

const initialFormData: ExpirationFormData = {
  item_type: 'License',
  item_name: '',
  expires_at: '',
  notes: '',
};

export function AtlasExpirations({ organizationId }: { organizationId?: string }) {
  const { expirations, createExpiration, resolveExpiration, isLoading } = useVanguardAtlas(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingExp, setResolvingExp] = useState<AtlasExpiration | null>(null);
  const [formData, setFormData] = useState<ExpirationFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleResolveClick = (exp: AtlasExpiration, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvingExp(exp);
    setResolveDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.item_name.trim() || !formData.expires_at) return;
    
    setSaving(true);
    try {
      await createExpiration({
        item_type: formData.item_type,
        item_name: formData.item_name,
        expires_at: new Date(formData.expires_at).toISOString(),
        notes: formData.notes,
        organization_id: organizationId,
      });
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolvingExp) return;
    
    await resolveExpiration(resolvingExp.id);
    setResolveDialogOpen(false);
    setResolvingExp(null);
  };

  const getExpiryStatus = (days: number | undefined) => {
    if (days === undefined) return { color: 'text-muted-foreground', borderColor: '', icon: Clock, label: 'Unknown' };
    if (days <= 0) return { color: 'text-red-400', borderColor: 'border-red-500/50', icon: AlertTriangle, label: 'Expired' };
    if (days <= 7) return { color: 'text-red-400', borderColor: 'border-red-500/50', icon: AlertTriangle, label: `${days} days` };
    if (days <= 30) return { color: 'text-amber-400', borderColor: 'border-amber-500/50', icon: AlertTriangle, label: `${days} days` };
    return { color: 'text-green-400', borderColor: '', icon: CheckCircle, label: `${days} days` };
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
        <h2 className="text-lg font-semibold">Expirations Dashboard</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />Track Expiration
        </Button>
      </div>
      
      <div className="grid gap-2">
        {expirations.map((exp) => {
          const status = getExpiryStatus(exp.daysUntilExpiry);
          const StatusIcon = status.icon;
          
          return (
            <Card key={exp.id} className={`${status.borderColor}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <StatusIcon className={`h-5 w-5 ${status.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{exp.item_name}</p>
                    <span className="text-xs px-2 py-0.5 bg-accent rounded">{exp.item_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(exp.expires_at).toLocaleDateString()}
                    {exp.notes && ` • ${exp.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => handleResolveClick(exp, e)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {expirations.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No expirations tracked.</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Track New Expiration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="e.g., Microsoft 365 License"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Type</Label>
                <Select 
                  value={formData.item_type} 
                  onValueChange={(v) => setFormData({ ...formData, item_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiration Date *</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
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
            <Button onClick={handleSave} disabled={saving || !formData.item_name.trim() || !formData.expires_at}>
              {saving ? 'Saving...' : 'Track'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Confirmation Dialog */}
      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Expiration</AlertDialogTitle>
            <AlertDialogDescription>
              Mark "{resolvingExp?.item_name}" as resolved? This will remove it from the active expirations list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResolve}>
              Mark Resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

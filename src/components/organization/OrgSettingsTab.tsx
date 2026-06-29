import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Loader2, ArrowRightLeft, Upload } from 'lucide-react';

export const OrgSettingsTab = () => {
  const {
    organization, isAdmin, isOwner, members,
    updateOrganization, deleteOrganization, transferOwnership, migrateWraythTeam,
  } = useOrganization();
  const navigate = useNavigate();
  const [name, setName] = useState(organization?.name || '');
  const [billingEmail, setBillingEmail] = useState(organization?.billing_email || '');
  const [saving, setSaving] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string>('');
  const [migrating, setMigrating] = useState(false);

  if (!organization) return null;

  const handleSave = async () => {
    setSaving(true);
    await updateOrganization({ name: name.trim(), billing_email: billingEmail.trim() || null });
    setSaving(false);
  };

  const handleDelete = async () => {
    const success = await deleteOrganization();
    if (success) navigate('/hub');
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    await transferOwnership(transferTarget);
    setTransferTarget('');
  };

  const handleMigrate = async () => {
    setMigrating(true);
    await migrateWraythTeam();
    setMigrating(false);
  };

  const eligibleTransferTargets = members.filter(m => m.status === 'active' && m.role !== 'owner' && m.user_id);

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-email">Billing Email</Label>
            <Input id="billing-email" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} disabled={!isAdmin} />
          </div>
          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Wrayth Migration */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Wrayth Teams
            </CardTitle>
            <CardDescription>
              Migrate members from your existing Wrayth teams into this organization. Existing org members won't be duplicated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={migrating}>
                  {migrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import Members
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Import Wrayth team members?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will import all members from your Wrayth teams into this organization. Members already in the org will be skipped.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMigrate}>Import</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Transfer Ownership */}
      {isOwner && eligibleTransferTargets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Ownership
            </CardTitle>
            <CardDescription>
              Transfer organization ownership to another active member. You'll be demoted to Admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Select value={transferTarget} onValueChange={setTransferTarget}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a member..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleTransferTargets.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.email} ({m.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!transferTarget}>Transfer</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Transfer ownership?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be demoted to Admin and the selected member will become the Owner. This action is immediate.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTransfer}>Transfer Ownership</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Deleting the organization will remove all members and revoke all licenses. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Organization</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{organization.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the organization, all members, and all license assignments. Active subscriptions will need to be cancelled separately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

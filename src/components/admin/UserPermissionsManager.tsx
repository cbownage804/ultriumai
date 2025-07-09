import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Shield, User, Lock, Unlock, Save, X, Plus, Trash2, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { format } from 'date-fns';

interface UserPermission {
  id: string;
  permission_key: string;
  permission_value: boolean;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  metadata: any;
}

interface UserWithPermissions {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  created_at: string;
  permissions: UserPermission[];
}

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard_access', label: 'Dashboard Access', description: 'Access to main dashboard' },
  { key: 'analytics_view', label: 'Analytics View', description: 'View analytics and reports' },
  { key: 'user_management', label: 'User Management', description: 'Manage other users' },
  { key: 'billing_access', label: 'Billing Access', description: 'Access billing information' },
  { key: 'api_access', label: 'API Access', description: 'Use API endpoints' },
  { key: 'export_data', label: 'Data Export', description: 'Export platform data' },
  { key: 'bulk_operations', label: 'Bulk Operations', description: 'Perform bulk operations' },
  { key: 'system_settings', label: 'System Settings', description: 'Modify system settings' },
  { key: 'audit_logs', label: 'Audit Logs', description: 'View audit logs' },
  { key: 'support_tickets', label: 'Support Tickets', description: 'Manage support tickets' },
  { key: 'file_upload', label: 'File Upload', description: 'Upload files to platform' },
  { key: 'advanced_features', label: 'Advanced Features', description: 'Access advanced features' }
];

interface UserPermissionsManagerProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export const UserPermissionsManager = ({ userId, userEmail, onClose }: UserPermissionsManagerProps) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionChanges, setPermissionChanges] = useState<{ [key: string]: boolean }>({});
  const [expirationDates, setExpirationDates] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const { logAdminAction } = useAuditLogger();

  const fetchUserPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch user permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [userId]);

  const getPermissionValue = (permissionKey: string): boolean => {
    if (permissionKey in permissionChanges) {
      return permissionChanges[permissionKey];
    }
    const permission = permissions.find(p => p.permission_key === permissionKey);
    return permission?.permission_value || false;
  };

  const handlePermissionChange = (permissionKey: string, value: boolean) => {
    setPermissionChanges(prev => ({
      ...prev,
      [permissionKey]: value
    }));
  };

  const handleExpirationChange = (permissionKey: string, date: string) => {
    setExpirationDates(prev => ({
      ...prev,
      [permissionKey]: date
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates = Object.entries(permissionChanges).map(([permissionKey, value]) => ({
        user_id: userId,
        permission_key: permissionKey,
        permission_value: value,
        expires_at: expirationDates[permissionKey] || null,
        granted_by: user?.id,
        metadata: {}
      }));

      if (updates.length > 0) {
        const { error } = await supabase
          .from('user_permissions')
          .upsert(updates, { onConflict: 'user_id,permission_key' });

        if (error) throw error;

        await logAdminAction({
          action: 'update_user_permissions',
          resource_type: 'user_permissions',
          resource_id: userId,
          resource_name: userEmail,
          metadata: { 
            permission_changes: permissionChanges,
            expiration_changes: expirationDates
          }
        });

        toast({
          title: "Success",
          description: "User permissions updated successfully",
        });

        await fetchUserPermissions();
        setPermissionChanges({});
        setExpirationDates({});
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const revokeAllPermissions = async () => {
    setSaving(true);
    try {
      const revokeUpdates = AVAILABLE_PERMISSIONS.map(async (perm) => {
        const { data: { user } } = await supabase.auth.getUser();
        return {
          user_id: userId,
          permission_key: perm.key,
          permission_value: false,
          granted_by: user?.id,
          metadata: { revoked_all: true }
        };
      });

      const resolvedUpdates = await Promise.all(revokeUpdates);
      const { error } = await supabase
        .from('user_permissions')
        .upsert(resolvedUpdates, { onConflict: 'user_id,permission_key' });

      if (error) throw error;

      await logAdminAction({
        action: 'revoke_all_permissions',
        resource_type: 'user_permissions',
        resource_id: userId,
        resource_name: userEmail,
        metadata: { revoked_permissions: AVAILABLE_PERMISSIONS.map(p => p.key) }
      });

      toast({
        title: "Success",
        description: "All permissions revoked successfully",
      });

      await fetchUserPermissions();
      setPermissionChanges({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to revoke permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(permissionChanges).length > 0 || Object.keys(expirationDates).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Permissions: {userEmail}
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage individual tool access and feature permissions
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Lock className="h-4 w-4 mr-2" />
                Revoke All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke All Permissions</AlertDialogTitle>
                <AlertDialogDescription>
                  This will revoke all permissions for {userEmail}. This action can be undone by granting permissions individually.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={revokeAllPermissions} disabled={saving}>
                  Revoke All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          
          {hasChanges && (
            <Button onClick={savePermissions} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Controls</CardTitle>
          <CardDescription>
            Enable or disable specific features and tools for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {AVAILABLE_PERMISSIONS.map((perm) => {
              const currentValue = getPermissionValue(perm.key);
              const existingPermission = permissions.find(p => p.permission_key === perm.key);
              const hasChanged = perm.key in permissionChanges;
              
              return (
                <div key={perm.key} className="flex items-center justify-between space-y-0">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={perm.key} className="text-sm font-medium">
                        {perm.label}
                      </Label>
                      {hasChanged && (
                        <Badge variant="secondary" className="text-xs">
                          Modified
                        </Badge>
                      )}
                      {existingPermission?.expires_at && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires {format(new Date(existingPermission.expires_at), 'MMM dd, yyyy')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {perm.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={perm.key}
                        checked={currentValue}
                        onCheckedChange={(checked) => handlePermissionChange(perm.key, checked)}
                      />
                      <Label htmlFor={perm.key} className="text-sm">
                        {currentValue ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    
                    <Input
                      type="date"
                      placeholder="Expiration date"
                      value={expirationDates[perm.key] || ''}
                      onChange={(e) => handleExpirationChange(perm.key, e.target.value)}
                      className="w-40"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {permissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Permission History</CardTitle>
            <CardDescription>
              Recent permission changes and grants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={permission.permission_value ? 'default' : 'secondary'}>
                        {AVAILABLE_PERMISSIONS.find(p => p.key === permission.permission_key)?.label || permission.permission_key}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {permission.permission_value ? 'Granted' : 'Revoked'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(permission.granted_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
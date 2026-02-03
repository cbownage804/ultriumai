import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContactPortalToggleProps {
  contactId: string;
  contactName: string;
  email: string;
  portalEnabled: boolean;
  portalRole: 'admin' | 'manager' | 'user';
  canViewAllCompanyTickets: boolean;
  onUpdate?: () => void;
}

export function ContactPortalToggle({
  contactId,
  contactName,
  email,
  portalEnabled,
  portalRole,
  canViewAllCompanyTickets,
  onUpdate
}: ContactPortalToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(portalEnabled);
  const [role, setRole] = useState(portalRole);
  const [canViewAll, setCanViewAll] = useState(canViewAllCompanyTickets);

  const handleTogglePortal = async (newEnabled: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('client_contacts')
        .update({ 
          portal_enabled: newEnabled,
          can_view_all_company_tickets: role === 'admin' ? true : canViewAll
        })
        .eq('id', contactId);

      if (error) throw error;

      setEnabled(newEnabled);
      toast({
        title: newEnabled ? 'Portal Access Enabled' : 'Portal Access Disabled',
        description: newEnabled 
          ? `${contactName} can now access the customer portal`
          : `${contactName}'s portal access has been revoked`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update portal access:', error);
      toast({
        title: 'Error',
        description: 'Failed to update portal access',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    setIsLoading(true);
    try {
      const isAdmin = newRole === 'admin';
      const { error } = await supabase
        .from('client_contacts')
        .update({ 
          portal_role: newRole,
          can_view_all_company_tickets: isAdmin ? true : canViewAll
        })
        .eq('id', contactId);

      if (error) throw error;

      setRole(newRole as 'admin' | 'manager' | 'user');
      if (isAdmin) setCanViewAll(true);
      
      toast({
        title: 'Role Updated',
        description: `${contactName}'s portal role is now ${newRole}`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update portal role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllChange = async (newValue: boolean) => {
    if (role === 'admin') return; // Admins always see all
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('client_contacts')
        .update({ can_view_all_company_tickets: newValue })
        .eq('id', contactId);

      if (error) throw error;

      setCanViewAll(newValue);
      toast({
        title: 'Visibility Updated',
        description: newValue 
          ? `${contactName} can now view all company tickets`
          : `${contactName} can only view their own tickets`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket visibility',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-slate-900/50 border border-cyan-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-cyan-400" />
          <div>
            <Label className="text-white font-medium">Portal Access</Label>
            <p className="text-xs text-white/50">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />}
          <Switch
            checked={enabled}
            onCheckedChange={handleTogglePortal}
            disabled={isLoading}
          />
        </div>
      </div>

      {enabled && (
        <>
          <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <Label className="text-white/80 text-sm">Portal Role</Label>
            </div>
            <Select value={role} onValueChange={handleRoleChange} disabled={isLoading}>
              <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/20 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-cyan-500/20">
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">Admin</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-300 text-xs">Manager</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-500/20 text-slate-300 text-xs">User</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-400" />
              <div>
                <Label className="text-white/80 text-sm">View All Company Tickets</Label>
                <p className="text-xs text-white/40">
                  {role === 'admin' ? 'Admins always see all tickets' : 'Allow viewing tickets from other contacts'}
                </p>
              </div>
            </div>
            <Switch
              checked={canViewAll}
              onCheckedChange={handleViewAllChange}
              disabled={isLoading || role === 'admin'}
            />
          </div>
        </>
      )}
    </div>
  );
}

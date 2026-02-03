import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, Search, Globe, ShieldCheck, Eye, Mail, 
  Phone, Loader2, UserPlus, MoreVertical, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContactPortalToggle } from './ContactPortalToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Contact {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  is_primary: boolean | null;
  portal_enabled: boolean | null;
  portal_role: string | null;
  can_view_all_company_tickets: boolean | null;
}

interface PortalContactManagerProps {
  clientId: string;
  companyName: string;
}

export function PortalContactManager({ clientId, companyName }: PortalContactManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [clientId]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('contact_name');

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableAllPortal = async () => {
    try {
      const { error } = await supabase
        .from('client_contacts')
        .update({ portal_enabled: true, portal_role: 'user' })
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: 'Portal Access Enabled',
        description: `All contacts at ${companyName} now have portal access`,
      });
      fetchContacts();
    } catch (error) {
      console.error('Failed to enable portal access:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable portal access',
        variant: 'destructive',
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const portalEnabledCount = contacts.filter(c => c.portal_enabled).length;

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-cyan-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-cyan-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Portal Users</CardTitle>
              <CardDescription>
                Manage which contacts can access the customer portal
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-500/20 text-cyan-400">
              {portalEnabledCount}/{contacts.length} enabled
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                <DropdownMenuItem onClick={handleEnableAllPortal}>
                  <Globe className="h-4 w-4 mr-2" />
                  Enable All Portal Access
                </DropdownMenuItem>
                <DropdownMenuItem onClick={fetchContacts}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Contacts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/50 border-cyan-500/20 text-white"
          />
        </div>

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No contacts found</p>
            <p className="text-white/40 text-sm">Add contacts to this customer to enable portal access</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <Collapsible
                key={contact.id}
                open={expandedContactId === contact.id}
                onOpenChange={(open) => setExpandedContactId(open ? contact.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-800/30 ${
                      expandedContactId === contact.id
                        ? 'bg-slate-800/50 border-cyan-500/30'
                        : 'bg-slate-900/30 border-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                        contact.portal_enabled 
                          ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30'
                          : 'bg-slate-700/50'
                      }`}>
                        {contact.contact_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{contact.contact_name}</span>
                          {contact.is_primary && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-xs">Primary</Badge>
                          )}
                          {contact.portal_enabled && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Portal</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.portal_enabled && (
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className={`border-purple-500/30 ${
                            contact.portal_role === 'admin' ? 'text-purple-400' :
                            contact.portal_role === 'manager' ? 'text-blue-400' :
                            'text-slate-400'
                          }`}>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {contact.portal_role || 'user'}
                          </Badge>
                          {contact.can_view_all_company_tickets && (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                              <Eye className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ContactPortalToggle
                    contactId={contact.id}
                    contactName={contact.contact_name}
                    email={contact.email}
                    portalEnabled={contact.portal_enabled ?? false}
                    portalRole={(contact.portal_role as 'admin' | 'manager' | 'user') ?? 'user'}
                    canViewAllCompanyTickets={contact.can_view_all_company_tickets ?? false}
                    onUpdate={fetchContacts}
                  />
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

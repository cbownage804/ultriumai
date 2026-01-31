import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Mail, 
  Building2, 
  Calendar, 
  Search, 
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Phone,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  business_type: string | null;
  service_provider_type: string | null;
  business_size: string | null;
  industry: string | null;
  project_type: string | null;
  product_type: string | null;
  white_labeled: string | null;
  message: string | null;
  product_interests: string[] | null;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  converted_at: string | null;
  converted_to_client_id: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  qualified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  converted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  closed: 'bg-muted text-muted-foreground border-muted',
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Clock className="h-3 w-3" />,
  contacted: <Mail className="h-3 w-3" />,
  qualified: <CheckCircle className="h-3 w-3" />,
  converted: <CheckCircle className="h-3 w-3" />,
  closed: <XCircle className="h-3 w-3" />,
};

const sourceLabels: Record<string, string> = {
  demo_request: 'Demo Request',
  newsletter: 'Newsletter',
  homepage_newsletter: 'Homepage Newsletter',
  website: 'Website',
  contact_form: 'Contact Form',
  signup: 'User Signup',
};

const productTypeLabels: Record<string, string> = {
  custom: 'Custom Solution',
  prebuilt: 'Prebuilt Solution',
};

const businessTypeLabels: Record<string, string> = {
  business: 'Business',
  'service-provider': 'Service Provider',
};

export const LeadManagementTab = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['admin-leads', statusFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase.from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Lead status updated');
    },
    onError: () => {
      toast.error('Failed to update lead status');
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      lead.email.toLowerCase().includes(search) ||
      lead.first_name?.toLowerCase().includes(search) ||
      lead.last_name?.toLowerCase().includes(search) ||
      lead.company?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === 'new').length || 0,
    contacted: leads?.filter((l) => l.status === 'contacted').length || 0,
    converted: leads?.filter((l) => l.status === 'converted').length || 0,
  };

  const exportLeads = () => {
    if (!filteredLeads?.length) return;
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Business Type', 'Industry', 'Source', 'Status', 'Date', 'Message'].join(','),
      ...filteredLeads.map((lead) =>
        [
          `"${lead.first_name || ''} ${lead.last_name || ''}"`,
          lead.email,
          lead.phone || '',
          `"${lead.company || ''}"`,
          lead.business_type || '',
          lead.industry || '',
          lead.source,
          lead.status,
          format(new Date(lead.created_at), 'yyyy-MM-dd'),
          `"${(lead.message || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Leads exported');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.contacted}</p>
                <p className="text-sm text-muted-foreground">Contacted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>View and manage incoming leads from demo requests and newsletters</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLeads}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="demo_request">Demo Request</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="homepage_newsletter">Homepage Newsletter</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : filteredLeads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads?.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {lead.first_name || lead.last_name
                              ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                              : '—'}
                          </p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{lead.company || '—'}</p>
                            {lead.business_type && (
                              <p className="text-xs text-muted-foreground">
                                {businessTypeLabels[lead.business_type] || lead.business_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lead.industry || lead.product_type || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: lead.id, status })}
                        >
                          <SelectTrigger className={`w-[120px] h-8 ${statusColors[lead.status] || ''}`}>
                            <span className="flex items-center gap-1.5">
                              {statusIcons[lead.status]}
                              <SelectValue />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(lead.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Submitted {selectedLead && format(new Date(selectedLead.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {selectedLead.first_name || selectedLead.last_name
                      ? `${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedLead.status]}>
                    {selectedLead.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                    {selectedLead.email}
                  </a>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedLead.phone}`} className="hover:underline">
                      {selectedLead.phone}
                    </a>
                  </div>
                )}
                {selectedLead.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedLead.company}
                      {selectedLead.business_type && ` (${businessTypeLabels[selectedLead.business_type] || selectedLead.business_type})`}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Industry / Interest</p>
                  <Badge variant="outline">
                    {selectedLead.industry || selectedLead.project_type || '—'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="text-sm">{sourceLabels[selectedLead.source] || selectedLead.source}</p>
                </div>
              </div>

              {selectedLead.message && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedLead.message}</p>
                </div>
              )}

              {/* Product Interests */}
              {selectedLead.product_interests && selectedLead.product_interests.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Product Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLead.product_interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" asChild>
                  <a href={`mailto:${selectedLead.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                {selectedLead.phone && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`tel:${selectedLead.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
              </div>

              {/* Convert to Customer - only show if not already converted */}
              {selectedLead.status !== 'converted' && (
                <div className="pt-2 border-t">
                  <Button 
                    variant="default" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedLead.id, status: 'converted' });
                      setSelectedLead(null);
                      toast.success('Lead marked as converted! Create their customer account in Vanguard.');
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Converted
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

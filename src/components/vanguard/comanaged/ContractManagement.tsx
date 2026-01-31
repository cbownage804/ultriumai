/**
 * Contract Management Dashboard
 * Track client contracts, SLAs, and renewals
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, addDays } from "date-fns";

interface Contract {
  id: string;
  contract_name: string;
  contract_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  renewal_notice_days: number;
  contract_value: number | null;
  billing_frequency: string | null;
  included_hours: number | null;
  overage_rate: number | null;
  notes: string | null;
}

const contractTypes = [
  { value: 'managed_services', label: 'Managed Services' },
  { value: 'break_fix', label: 'Break/Fix' },
  { value: 'project', label: 'Project-Based' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'co_managed', label: 'Co-Managed IT' },
  { value: 'sla_agreement', label: 'SLA Agreement' },
];

const billingFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One-Time' },
];

const defaultContract: Partial<Contract> = {
  contract_name: '',
  contract_type: 'managed_services',
  status: 'active',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  auto_renew: false,
  renewal_notice_days: 30,
  billing_frequency: 'monthly'
};

export const ContractManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Partial<Contract> | null>(null);

  useEffect(() => {
    fetchContracts();
  }, [user?.id]);

  const fetchContracts = async () => {
    if (!user?.id) return;

    const { data, error } = await (supabase as any)
      .from('vanguard_client_contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('end_date', { ascending: true, nullsFirst: false });

    if (data) setContracts(data as any);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.id || !editingContract?.contract_name) return;

    const payload = {
      contract_name: editingContract.contract_name,
      contract_type: editingContract.contract_type || 'managed_services',
      status: editingContract.status || 'active',
      start_date: editingContract.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: editingContract.end_date || null,
      auto_renew: editingContract.auto_renew ?? false,
      renewal_notice_days: editingContract.renewal_notice_days ?? 30,
      contract_value: editingContract.contract_value || null,
      billing_frequency: editingContract.billing_frequency || null,
      included_hours: editingContract.included_hours || null,
      overage_rate: editingContract.overage_rate || null,
      notes: editingContract.notes || null,
      user_id: user.id
    };

    let error;
    if (editingContract.id) {
      const { error: e } = await (supabase as any)
        .from('vanguard_client_contracts')
        .update(payload)
        .eq('id', editingContract.id);
      error = e;
    } else {
      const { error: e } = await (supabase as any)
        .from('vanguard_client_contracts')
        .insert([payload]);
      error = e;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save contract.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Contract saved successfully." });
      setDialogOpen(false);
      setEditingContract(null);
      fetchContracts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from('vanguard_client_contracts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Contract removed." });
      fetchContracts();
    }
  };

  const getStatusBadge = (status: string, endDate: string | null) => {
    if (endDate) {
      const daysUntilExpiry = differenceInDays(new Date(endDate), new Date());
      if (daysUntilExpiry < 0) {
        return <Badge className="bg-red-500/20 text-red-400">Expired</Badge>;
      }
      if (daysUntilExpiry <= 30) {
        return <Badge className="bg-orange-500/20 text-orange-400">Expiring Soon</Badge>;
      }
    }

    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case 'draft': return <Badge className="bg-white/20 text-white/60">Draft</Badge>;
      case 'pending_renewal': return <Badge className="bg-yellow-500/20 text-yellow-400">Pending Renewal</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default: return <Badge className="bg-white/20 text-white/60">{status}</Badge>;
    }
  };

  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const expiringContracts = contracts.filter(c => 
    c.end_date && differenceInDays(new Date(c.end_date), new Date()) <= 30 && differenceInDays(new Date(c.end_date), new Date()) >= 0
  ).length;
  const totalValue = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.contract_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Contract Management</h2>
          <p className="text-white/60">Track client contracts, SLAs, and renewals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingContract(defaultContract)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingContract?.id ? 'Edit' : 'Create'} Contract
              </DialogTitle>
            </DialogHeader>
            {editingContract && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Contract Name</Label>
                    <Input
                      value={editingContract.contract_name || ''}
                      onChange={(e) => setEditingContract({ ...editingContract, contract_name: e.target.value })}
                      placeholder="Managed Services Agreement"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Contract Type</Label>
                    <Select 
                      value={editingContract.contract_type || 'managed_services'}
                      onValueChange={(v) => setEditingContract({ ...editingContract, contract_type: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contractTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Start Date</Label>
                    <Input
                      type="date"
                      value={editingContract.start_date || ''}
                      onChange={(e) => setEditingContract({ ...editingContract, start_date: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">End Date</Label>
                    <Input
                      type="date"
                      value={editingContract.end_date || ''}
                      onChange={(e) => setEditingContract({ ...editingContract, end_date: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Status</Label>
                    <Select 
                      value={editingContract.status || 'active'}
                      onValueChange={(v) => setEditingContract({ ...editingContract, status: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Contract Value</Label>
                    <Input
                      type="number"
                      value={editingContract.contract_value || ''}
                      onChange={(e) => setEditingContract({ ...editingContract, contract_value: parseFloat(e.target.value) })}
                      placeholder="10000"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Billing Frequency</Label>
                    <Select 
                      value={editingContract.billing_frequency || 'monthly'}
                      onValueChange={(v) => setEditingContract({ ...editingContract, billing_frequency: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {billingFrequencies.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Included Hours</Label>
                    <Input
                      type="number"
                      value={editingContract.included_hours || ''}
                      onChange={(e) => setEditingContract({ ...editingContract, included_hours: parseInt(e.target.value) })}
                      placeholder="40"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <Label className="text-white/80">Auto-Renew</Label>
                    <p className="text-xs text-white/60">Automatically renew at end date</p>
                  </div>
                  <Switch
                    checked={editingContract.auto_renew}
                    onCheckedChange={(v) => setEditingContract({ ...editingContract, auto_renew: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Notes</Label>
                  <Textarea
                    value={editingContract.notes || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, notes: e.target.value })}
                    placeholder="Contract terms and conditions..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500" onClick={handleSave}>
                    Save Contract
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Active Contracts</p>
                <p className="text-2xl font-bold text-white">{activeContracts}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-400">{expiringContracts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Value</p>
                <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-cyan-400/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Contracts</p>
                <p className="text-2xl font-bold text-white">{contracts.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Contract</TableHead>
                <TableHead className="text-white/60">Type</TableHead>
                <TableHead className="text-white/60">Duration</TableHead>
                <TableHead className="text-white/60">Value</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/60 py-8">Loading...</TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/60 py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{contract.contract_name}</TableCell>
                    <TableCell className="text-white/80">
                      {contractTypes.find(t => t.value === contract.contract_type)?.label || contract.contract_type}
                    </TableCell>
                    <TableCell className="text-white/80 text-sm">
                      {format(new Date(contract.start_date), 'MMM d, yyyy')}
                      {contract.end_date && (
                        <> - {format(new Date(contract.end_date), 'MMM d, yyyy')}</>
                      )}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {contract.contract_value ? `$${contract.contract_value.toLocaleString()}` : '-'}
                      {contract.billing_frequency && (
                        <span className="text-white/40 text-xs">/{contract.billing_frequency}</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status, contract.end_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingContract(contract); setDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractManagement;

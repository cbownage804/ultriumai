/**
 * PSA Contracts & Billing
 * Atera-style contract management with SLA policies and billing integration
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  DollarSign, 
  Clock, 
  Plus, 
  Pencil, 
  Trash2,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Timer,
  Calculator,
  CreditCard,
  Receipt,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface Contract {
  id: string;
  name: string;
  customer: string;
  type: 'hourly' | 'fixed' | 'retainer' | 'block_hours' | 'per_device';
  status: 'active' | 'pending' | 'expired';
  value: number;
  startDate: string;
  endDate?: string;
  hoursIncluded?: number;
  hoursUsed?: number;
  slaPolicy: string;
  autoRenew: boolean;
}

interface SLAPolicy {
  id: string;
  name: string;
  responseTime: { critical: number; high: number; medium: number; low: number };
  resolutionTime: { critical: number; high: number; medium: number; low: number };
  businessHours: string;
  isDefault: boolean;
}

const mockContracts: Contract[] = [
  {
    id: 'CNT-001',
    name: 'Premium Support Agreement',
    customer: 'Acme Corp',
    type: 'retainer',
    status: 'active',
    value: 2500,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    hoursIncluded: 40,
    hoursUsed: 28,
    slaPolicy: 'Premium - 4 Hour Response',
    autoRenew: true,
  },
  {
    id: 'CNT-002',
    name: 'Hourly IT Support',
    customer: 'TechStart Inc',
    type: 'hourly',
    status: 'active',
    value: 150,
    startDate: '2024-02-01',
    slaPolicy: 'Standard - 8 Hour Response',
    autoRenew: false,
  },
  {
    id: 'CNT-003',
    name: 'Block Hours Package',
    customer: 'Global Solutions',
    type: 'block_hours',
    status: 'active',
    value: 3600,
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    hoursIncluded: 30,
    hoursUsed: 12,
    slaPolicy: 'Premium - 4 Hour Response',
    autoRenew: true,
  },
  {
    id: 'CNT-004',
    name: 'Managed Services',
    customer: 'Innovation Labs',
    type: 'per_device',
    status: 'pending',
    value: 25,
    startDate: '2024-04-01',
    slaPolicy: 'Standard - 8 Hour Response',
    autoRenew: true,
  },
];

const mockSLAPolicies: SLAPolicy[] = [
  {
    id: 'SLA-001',
    name: 'Premium - 4 Hour Response',
    responseTime: { critical: 1, high: 2, medium: 4, low: 8 },
    resolutionTime: { critical: 4, high: 8, medium: 24, low: 48 },
    businessHours: '24/7',
    isDefault: false,
  },
  {
    id: 'SLA-002',
    name: 'Standard - 8 Hour Response',
    responseTime: { critical: 2, high: 4, medium: 8, low: 24 },
    resolutionTime: { critical: 8, high: 24, medium: 48, low: 72 },
    businessHours: 'Mon-Fri 8AM-6PM',
    isDefault: true,
  },
  {
    id: 'SLA-003',
    name: 'Basic - Next Day Response',
    responseTime: { critical: 4, high: 8, medium: 24, low: 48 },
    resolutionTime: { critical: 24, high: 48, medium: 72, low: 120 },
    businessHours: 'Mon-Fri 9AM-5PM',
    isDefault: false,
  },
];

export function PSAContractsBilling() {
  const [contracts, setContracts] = useState(mockContracts);
  const [slaPolicies, setSlaPolicies] = useState(mockSLAPolicies);
  const [showNewContract, setShowNewContract] = useState(false);
  const [activeTab, setActiveTab] = useState("contracts");

  const getContractTypeLabel = (type: Contract['type']) => {
    switch (type) {
      case 'hourly': return 'Hourly';
      case 'fixed': return 'Fixed Term';
      case 'retainer': return 'Retainer';
      case 'block_hours': return 'Block Hours';
      case 'per_device': return 'Per Device';
      default: return type;
    }
  };

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const totalMRR = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => {
      if (c.type === 'retainer') return sum + c.value;
      if (c.type === 'block_hours' && c.hoursIncluded) return sum + (c.value / 3); // Spread over 3 months
      return sum;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contracts & Billing</h1>
          <p className="text-white/60">Manage contracts, SLAs, and billing</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-cyan-500/20 text-white">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </Button>
          <Dialog open={showNewContract} onOpenChange={setShowNewContract}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 border-cyan-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Contract</DialogTitle>
                <DialogDescription className="text-white/60">
                  Set up a new service contract with SLA terms
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Contract Name</Label>
                    <Input placeholder="e.g., Premium Support" className="bg-slate-800 border-cyan-500/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Customer</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-cyan-500/20 text-white">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/20">
                        <SelectItem value="acme">Acme Corp</SelectItem>
                        <SelectItem value="tech">TechStart Inc</SelectItem>
                        <SelectItem value="global">Global Solutions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Contract Type</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-cyan-500/20 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/20">
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="retainer">Retainer</SelectItem>
                        <SelectItem value="block_hours">Block Hours</SelectItem>
                        <SelectItem value="per_device">Per Device</SelectItem>
                        <SelectItem value="fixed">Fixed Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">SLA Policy</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-cyan-500/20 text-white">
                        <SelectValue placeholder="Select SLA" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/20">
                        {slaPolicies.map((sla) => (
                          <SelectItem key={sla.id} value={sla.id}>{sla.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Value ($)</Label>
                    <Input type="number" placeholder="0.00" className="bg-slate-800 border-cyan-500/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Start Date</Label>
                    <Input type="date" className="bg-slate-800 border-cyan-500/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">End Date</Label>
                    <Input type="date" className="bg-slate-800 border-cyan-500/20 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Auto-Renew</p>
                    <p className="text-sm text-white/50">Automatically renew when contract expires</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewContract(false)} className="border-cyan-500/20 text-white">
                    Cancel
                  </Button>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-black" onClick={() => {
                    toast.success('Contract created successfully');
                    setShowNewContract(false);
                  }}>
                    Create Contract
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Active Contracts</p>
                <p className="text-2xl font-bold text-white">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Monthly Recurring</p>
                <p className="text-2xl font-bold text-white">${totalMRR.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Hours Used</p>
                <p className="text-2xl font-bold text-white">
                  {contracts.reduce((sum, c) => sum + (c.hoursUsed || 0), 0)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Timer className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">SLA Compliance</p>
                <p className="text-2xl font-bold text-white">96.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-cyan-500/20">
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="sla">SLA Policies</TabsTrigger>
          <TabsTrigger value="rates">Rate Cards</TabsTrigger>
          <TabsTrigger value="timesheets">Time Tracking</TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg">
                      <FileText className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{contract.name}</h3>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                          {getContractTypeLabel(contract.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {contract.customer}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {contract.startDate} {contract.endDate && `→ ${contract.endDate}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {contract.slaPolicy}
                        </span>
                      </div>
                      {contract.hoursIncluded && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-white/60">Hours Used</span>
                            <span className="text-white">{contract.hoursUsed}h / {contract.hoursIncluded}h</span>
                          </div>
                          <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${((contract.hoursUsed || 0) / contract.hoursIncluded) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        ${contract.value.toLocaleString()}
                        {contract.type === 'hourly' && <span className="text-sm text-white/60">/hr</span>}
                        {contract.type === 'per_device' && <span className="text-sm text-white/60">/device</span>}
                        {(contract.type === 'retainer') && <span className="text-sm text-white/60">/mo</span>}
                      </p>
                      {contract.autoRenew && (
                        <Badge variant="outline" className="mt-1 border-emerald-500/30 text-emerald-400">
                          Auto-renew
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SLA Policies Tab */}
        <TabsContent value="sla" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
              <Plus className="h-4 w-4 mr-2" />
              New SLA Policy
            </Button>
          </div>
          {slaPolicies.map((sla) => (
            <Card key={sla.id} className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{sla.name}</h3>
                    {sla.isDefault && (
                      <Badge className="bg-cyan-500/20 text-cyan-400">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Business Hours</p>
                    <p className="text-white">{sla.businessHours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Critical Response</p>
                    <p className="text-white">{sla.responseTime.critical}h response / {sla.resolutionTime.critical}h resolution</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">High Response</p>
                    <p className="text-white">{sla.responseTime.high}h response / {sla.resolutionTime.high}h resolution</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Medium Response</p>
                    <p className="text-white">{sla.responseTime.medium}h response / {sla.resolutionTime.medium}h resolution</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Low Response</p>
                    <p className="text-white">{sla.responseTime.low}h response / {sla.resolutionTime.low}h resolution</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Rate Cards Tab */}
        <TabsContent value="rates" className="space-y-4">
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Default Rate Card</CardTitle>
              <CardDescription className="text-white/60">
                Standard billing rates for different service types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { service: 'Remote Support', rate: 125, unit: 'hour' },
                  { service: 'Onsite Support', rate: 175, unit: 'hour' },
                  { service: 'After Hours', rate: 200, unit: 'hour' },
                  { service: 'Project Work', rate: 150, unit: 'hour' },
                  { service: 'Managed Device', rate: 25, unit: 'device/mo' },
                  { service: 'Security Monitoring', rate: 15, unit: 'device/mo' },
                ].map((rate) => (
                  <div key={rate.service} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <span className="text-white">{rate.service}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">${rate.rate}</span>
                      <span className="text-white/50">/{rate.unit}</span>
                      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tracking Tab */}
        <TabsContent value="timesheets" className="space-y-4">
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Time Entries</CardTitle>
              <CardDescription className="text-white/60">
                Automatic time capture from ticket work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tech: 'Allen Conley', customer: 'Acme Corp', ticket: 'TKT-130866', duration: '1:45', billable: true, date: 'Today' },
                  { tech: 'Sarah Johnson', customer: 'TechStart Inc', ticket: 'TKT-130859', duration: '0:30', billable: true, date: 'Today' },
                  { tech: 'Mike Chen', customer: 'Global Solutions', ticket: 'TKT-130842', duration: '2:15', billable: false, date: 'Yesterday' },
                  { tech: 'Allen Conley', customer: 'Innovation Labs', ticket: 'TKT-130838', duration: '0:45', billable: true, date: 'Yesterday' },
                ].map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-cyan-500/10 rounded">
                        <Clock className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{entry.tech}</p>
                        <p className="text-sm text-white/50">{entry.customer} • {entry.ticket}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/50 text-sm">{entry.date}</span>
                      <span className="text-lg font-mono text-white">{entry.duration}</span>
                      {entry.billable ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">Billable</Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/20 text-white/50">Non-billable</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

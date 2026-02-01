import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Building2, Plus, Search, Filter, Monitor, Shield, AlertTriangle,
  MoreVertical, Users, DollarSign, Eye, Ticket, Settings, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { AddCustomerDialog } from '@/components/vanguard/AddCustomerDialog';
import { useMSP } from '@/hooks/useMSP';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

interface CustomerDisplay {
  id: string;
  name: string;
  devices: number;
  alerts: number;
  status: 'healthy' | 'warning' | 'critical';
  mrr: number;
  contacts: number;
  securityScore: number;
}

const statusColors = {
  healthy: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  critical: 'bg-red-500/20 text-red-400',
};

const scoreColors = (score: number) => {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
};

const getHealthStatus = (alerts: number): 'healthy' | 'warning' | 'critical' => {
  if (alerts >= 10) return 'critical';
  if (alerts >= 5) return 'warning';
  return 'healthy';
};

export default function VanguardCustomers() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { clients, isLoading: mspLoading, loadClients, loadMSP } = useMSP();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDisplay | null>(null);

  useEffect(() => {
    document.title = 'Customers | Ultrium Vanguard';
  }, []);

  // Transform MSP clients into display format
  const customers: CustomerDisplay[] = useMemo(() => {
    return clients.map(client => ({
      id: client.id,
      name: client.company_name,
      devices: client.endpoints || 0,
      alerts: client.alerts || 0,
      status: getHealthStatus(client.alerts || 0),
      mrr: client.monthly_rate || 0,
      contacts: 1, // Default, could be fetched separately
      securityScore: (client.alerts || 0) < 3 ? 92 : (client.alerts || 0) < 8 ? 75 : 50,
    }));
  }, [clients]);

  const totalDevices = customers.reduce((acc, c) => acc + c.devices, 0);
  const totalMRR = customers.reduce((acc, c) => acc + c.mrr, 0);
  const avgSecurityScore = customers.length > 0 
    ? Math.round(customers.reduce((acc, c) => acc + c.securityScore, 0) / customers.length)
    : 0;

  const stats = [
    { label: 'Total Customers', value: customers.length, icon: Building2, color: 'text-cyan-400' },
    { label: 'Total Devices', value: totalDevices, icon: Monitor, color: 'text-blue-400' },
    { label: 'Monthly Revenue', value: `$${totalMRR.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Avg. Security Score', value: `${avgSecurityScore}%`, icon: Shield, color: 'text-amber-400' },
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerCreated = async () => {
    // Refresh MSP and clients to show the new customer
    await loadMSP();
    await loadClients();
    toast.success('Customer added successfully');
  };

  const handleViewDashboard = (customer: CustomerDisplay) => {
    navigate(`${basePath}/customers/${customer.id}`);
  };

  const handleViewDevices = (customer: CustomerDisplay) => {
    toast.info(`Viewing devices for ${customer.name}`);
    navigate(`${basePath}/devices?customer=${customer.id}`);
  };

  const handleViewTickets = (customer: CustomerDisplay) => {
    toast.info(`Viewing tickets for ${customer.name}`);
    navigate(`${basePath}/tickets?customer=${customer.id}`);
  };

  const handleEditCustomer = (customer: CustomerDisplay) => {
    setSelectedCustomer(customer);
  };

  if (mspLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-white/60">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
            <ModuleLogo module="response" size="lg" glow />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Customers</h1>
            <p className="text-white/60 text-sm">Manage your client organizations</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
        <AddCustomerDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          onCustomerCreated={handleCustomerCreated}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input 
            placeholder="Search customers..." 
            className="pl-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Customer Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card 
              className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors cursor-pointer"
              onClick={() => handleViewDashboard(customer)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{customer.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[customer.status as keyof typeof statusColors]}>
                          {customer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                        <DropdownMenuItem 
                          className="text-white/80 hover:bg-cyan-500/10"
                          onClick={() => handleViewDashboard(customer)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white/80 hover:bg-cyan-500/10"
                          onClick={() => handleViewDevices(customer)}
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          View Devices
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white/80 hover:bg-cyan-500/10"
                          onClick={() => handleViewTickets(customer)}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          View Tickets
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-cyan-500/20" />
                        <DropdownMenuItem 
                          className="text-white/80 hover:bg-cyan-500/10"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-white/40" />
                    <span className="text-white/80 text-sm">{customer.devices} devices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-white/40" />
                    <span className="text-white/80 text-sm">{customer.contacts} contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-white/40" />
                    <span className={`text-sm ${customer.alerts > 5 ? 'text-red-400' : 'text-white/80'}`}>
                      {customer.alerts} alerts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-white/40" />
                    <span className="text-emerald-400 text-sm">${customer.mrr}/mo</span>
                  </div>
                </div>
                
                {/* Security Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Security Score</span>
                    <span className={scoreColors(customer.securityScore)}>{customer.securityScore}%</span>
                  </div>
                  <Progress 
                    value={customer.securityScore} 
                    className="h-2 bg-slate-800"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Customer: {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/60">Status</Label>
                  <Badge className={statusColors[selectedCustomer.status as keyof typeof statusColors]}>
                    {selectedCustomer.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-white/60">Security Score</Label>
                  <p className={scoreColors(selectedCustomer.securityScore)}>{selectedCustomer.securityScore}%</p>
                </div>
                <div>
                  <Label className="text-white/60">Devices</Label>
                  <p className="text-white">{selectedCustomer.devices}</p>
                </div>
                <div>
                  <Label className="text-white/60">Active Alerts</Label>
                  <p className="text-white">{selectedCustomer.alerts}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="border-cyan-500/20 text-white/80">
              Close
            </Button>
            <Button 
              onClick={() => {
                toast.success('Customer updated');
                setSelectedCustomer(null);
              }} 
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, Plus, Search, Filter, Monitor, Shield, AlertTriangle,
  CheckCircle2, MoreVertical, Users, DollarSign, TrendingUp, Eye, Ticket, Settings
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

const initialCustomers = [
  { id: '1', name: 'Acme Corporation', devices: 45, alerts: 3, status: 'healthy', mrr: 2500, contacts: 5, securityScore: 92 },
  { id: '2', name: 'TechStart Inc', devices: 28, alerts: 8, status: 'warning', mrr: 1800, contacts: 3, securityScore: 78 },
  { id: '3', name: 'GlobalTech Solutions', devices: 120, alerts: 1, status: 'healthy', mrr: 5500, contacts: 12, securityScore: 96 },
  { id: '4', name: 'DataFlow LLC', devices: 35, alerts: 15, status: 'critical', mrr: 2100, contacts: 4, securityScore: 45 },
  { id: '5', name: 'StartupXYZ', devices: 12, alerts: 0, status: 'healthy', mrr: 800, contacts: 2, securityScore: 88 },
  { id: '6', name: 'Enterprise Corp', devices: 250, alerts: 5, status: 'warning', mrr: 12000, contacts: 25, securityScore: 82 },
];

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

export default function VanguardCustomers() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState(initialCustomers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof initialCustomers[0] | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contacts: 1,
    mrr: 0,
  });

  useEffect(() => {
    document.title = 'Customers | Ultrium Vanguard';
  }, []);

  const totalDevices = customers.reduce((acc, c) => acc + c.devices, 0);
  const totalMRR = customers.reduce((acc, c) => acc + c.mrr, 0);
  const avgSecurityScore = Math.round(customers.reduce((acc, c) => acc + c.securityScore, 0) / customers.length);

  const stats = [
    { label: 'Total Customers', value: customers.length, icon: Building2, color: 'text-cyan-400' },
    { label: 'Total Devices', value: totalDevices, icon: Monitor, color: 'text-blue-400' },
    { label: 'Monthly Revenue', value: `$${totalMRR.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Avg. Security Score', value: `${avgSecurityScore}%`, icon: Shield, color: 'text-amber-400' },
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCustomer = () => {
    if (!newCustomer.name) {
      toast.error('Please enter a customer name');
      return;
    }

    const createdCustomer = {
      id: String(customers.length + 1),
      name: newCustomer.name,
      devices: 0,
      alerts: 0,
      status: 'healthy' as const,
      mrr: newCustomer.mrr,
      contacts: newCustomer.contacts,
      securityScore: 100,
    };

    setCustomers([...customers, createdCustomer]);
    setNewCustomer({ name: '', contacts: 1, mrr: 0 });
    setIsCreateDialogOpen(false);
    toast.success(`Customer "${newCustomer.name}" created successfully`);
  };

  const handleViewDashboard = (customer: typeof initialCustomers[0]) => {
    toast.info(`Opening dashboard for ${customer.name}`);
    navigate(`${basePath}/dashboard?customer=${customer.id}`);
  };

  const handleViewDevices = (customer: typeof initialCustomers[0]) => {
    toast.info(`Viewing devices for ${customer.name}`);
    navigate(`${basePath}/devices?customer=${customer.id}`);
  };

  const handleViewTickets = (customer: typeof initialCustomers[0]) => {
    toast.info(`Viewing tickets for ${customer.name}`);
    navigate(`${basePath}/tickets?customer=${customer.id}`);
  };

  const handleEditCustomer = (customer: typeof initialCustomers[0]) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Building2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-white/60 text-sm">Manage your client organizations</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-white/80">Company Name *</Label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter company name"
                  className="bg-black/40 border-cyan-500/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Initial Contacts</Label>
                  <Input
                    type="number"
                    value={newCustomer.contacts}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contacts: parseInt(e.target.value) || 1 })}
                    className="bg-black/40 border-cyan-500/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Monthly Revenue ($)</Label>
                  <Input
                    type="number"
                    value={newCustomer.mrr}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mrr: parseInt(e.target.value) || 0 })}
                    className="bg-black/40 border-cyan-500/20 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-cyan-500/20 text-white/80">
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                Add Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

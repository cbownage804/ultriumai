/**
 * Vanguard Customer Detail Page
 * Atera-style customer profile with tabbed navigation including Vanguard Atlas
 * Updated to use Vanguard Dark Glass theme
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Building2, Phone, MapPin, Hash, Star, Calendar,
  Package, AlertTriangle, Key, Paperclip, 
  MoreHorizontal, Pencil, Plus, ExternalLink, Copy,
  CheckCircle, Server, FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Map, Monitor, Users } from 'lucide-react';
import { CustomerTicketsTab } from '@/components/vanguard/CustomerTicketsTab';

// Mock customer data
const mockCustomer = {
  id: '1',
  name: 'Acme Corporation',
  logo: null,
  phone: '(555) 123-4567',
  address: '123 Business Ave, Suite 500',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94105',
  country: 'United States',
  fax: '',
  domains: ['acmecorp.com', 'acme.io'],
  website: 'https://acmecorp.com',
  sla: 'Premium - 4 hour response',
  feedback: 4.5,
  created: '2023-10-30',
  modified: '2025-01-06',
  notes: 'Key enterprise client. Primary contact is John Smith, IT Director.',
  customFields: {
    securityAudit: 'Completed',
    serviceHistory: '',
    lastVisit: '2024-12-01',
  },
  stats: {
    users: 45,
    devices: 120,
    assets: 85,
    tickets: 12,
    alerts: 3,
  }
};

// Mock users for the customer
const mockUsers = [
  { id: '1', name: 'John Smith', email: 'john.smith@acmecorp.com', role: 'IT Director', isPrimary: true },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@acmecorp.com', role: 'System Administrator', isPrimary: false },
  { id: '3', name: 'Mike Williams', email: 'mike.williams@acmecorp.com', role: 'Help Desk', isPrimary: false },
];

// Mock devices
const mockDevices = [
  { id: '1', name: 'SRV-DC01', type: 'Windows Server', status: 'online', ip: '192.168.1.10' },
  { id: '2', name: 'SRV-FILE01', type: 'Windows Server', status: 'online', ip: '192.168.1.11' },
  { id: '3', name: 'WS-JSMITH', type: 'Windows 11', status: 'online', ip: '192.168.1.101' },
];

// Mock Atlas data
const mockAtlasData = {
  documents: [
    { id: '1', title: 'Network Diagram', category: 'Infrastructure', lastUpdated: '2024-12-15' },
    { id: '2', title: 'Backup Procedures', category: 'Runbook', lastUpdated: '2024-11-20' },
    { id: '3', title: 'VPN Setup Guide', category: 'How-To', lastUpdated: '2024-10-05' },
  ],
  passwords: [
    { id: '1', name: 'Domain Admin', username: 'admin@acmecorp.local', category: 'Active Directory' },
    { id: '2', name: 'Firewall Admin', username: 'admin', category: 'Network' },
    { id: '3', name: 'M365 Admin', username: 'admin@acmecorp.onmicrosoft.com', category: 'Cloud Services' },
  ],
  configurations: [
    { id: '1', name: 'Domain Controller', type: 'Windows Server 2022', ip: '192.168.1.10' },
    { id: '2', name: 'Edge Firewall', type: 'FortiGate 60F', ip: '192.168.1.1' },
  ]
};

export default function VanguardCustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const basePath = getVanguardBasePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [customer, setCustomer] = useState(mockCustomer);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${customer.name} | Customers | Ultrium Vanguard`;
  }, [customer.name]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#050a0a]">
      {/* Header */}
      <div className="bg-black/80 border-b border-cyan-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`${basePath}/customers`)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Customer Logo/Avatar */}
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            
            <div>
              <h1 className="text-xl font-semibold text-white">{customer.name}</h1>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {customer.city}, {customer.state}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {customer.postalCode}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/30">
              <DropdownMenuItem onClick={() => toast.info('Edit customer')} className="text-white hover:bg-white/10">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black/60 border-b border-cyan-500/20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 border-0 ml-6">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="devices" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Devices
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Tickets
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Alerts
            </TabsTrigger>
            <TabsTrigger 
              value="atlas" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 flex items-center gap-1 hover:text-white"
            >
              <Map className="h-4 w-4 text-cyan-400" />
              Vanguard Atlas
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white"
            >
              Attachments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-3 gap-6">
              {/* System Fields */}
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">System fields</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-white/60">Phone</Label>
                    <span className="text-white">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <Label className="text-white/60">Address</Label>
                    <div className="text-right">
                      <span className="text-white">{customer.address}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-white/40 hover:text-cyan-400">
                        <MapPin className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Postal/Zip</Label>
                    <span className="text-white">{customer.postalCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Fax</Label>
                    <span className="text-white/40">{customer.fax || 'Enter fax'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60 flex items-center gap-1">
                      Domains
                      <span className="text-white/40 text-xs">ⓘ</span>
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{customer.domains[0]}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-cyan-400">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Website</Label>
                    <span className="text-white/40">{customer.website || 'Enter URL'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">SLA</Label>
                    <span className="text-white">{customer.sla}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Feedback</Label>
                    <div className="flex items-center gap-1">
                      {renderStars(customer.feedback)}
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-white/40">
                        <span className="text-white/40 text-xs">ⓘ</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Created</Label>
                    <span className="text-white">{customer.created}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Modified</Label>
                    <span className="text-white">{customer.modified}</span>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Custom fields</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Security audit</Label>
                    <Select defaultValue={customer.customFields.securityAudit}>
                      <SelectTrigger className="w-32 h-8 bg-white/5 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="Completed" className="text-white hover:bg-white/10">Completed</SelectItem>
                        <SelectItem value="In Progress" className="text-white hover:bg-white/10">In Progress</SelectItem>
                        <SelectItem value="Scheduled" className="text-white hover:bg-white/10">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Service history</Label>
                    <Input 
                      placeholder="Enter value" 
                      className="w-32 h-8 text-sm bg-white/5 border-cyan-500/30 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Last visit</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{customer.customFields.lastVisit}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-cyan-400">
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Notes</h3>
                <Textarea 
                  value={customer.notes}
                  onChange={(e) => setCustomer({...customer, notes: e.target.value})}
                  className="min-h-[200px] resize-none bg-white/5 border-cyan-500/30 text-white placeholder:text-white/40"
                  placeholder="Add notes..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Users ({mockUsers.length})</CardTitle>
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{user.name}</span>
                            {user.isPrimary && (
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Primary</Badge>
                            )}
                          </div>
                          <span className="text-sm text-white/60">{user.email}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-white/70">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Devices ({mockDevices.length})</CardTitle>
                <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" onClick={() => navigate(`${basePath}/devices?customer=${customerId}`)}>
                  View All Devices
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Monitor className="h-5 w-5 text-white/40" />
                        <div>
                          <span className="font-medium text-white">{device.name}</span>
                          <div className="text-sm text-white/60">{device.type}</div>
                        </div>
                      </div>
                      <code className="text-sm text-cyan-400">{device.ip}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-white/60">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assets documented yet</p>
                  <Button variant="outline" className="mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-0">
            <CustomerTicketsTab 
              customerId={customerId || ''} 
              customerName={customer.name}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Active Alerts ({customer.stats.alerts})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-white/60">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No critical alerts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vanguard Atlas Tab */}
          <TabsContent value="atlas" className="mt-0">
            <div className="grid grid-cols-3 gap-6">
              {/* Documents */}
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <FileText className="h-4 w-4 text-teal-500" />
                    Documents
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-white/40 hover:text-cyan-400">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockAtlasData.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10 cursor-pointer"
                      >
                        <div className="font-medium text-sm text-white">{doc.title}</div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge className="bg-white/10 text-white/70 text-xs">{doc.category}</Badge>
                          <span className="text-xs text-white/50">{doc.lastUpdated}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                    onClick={() => navigate(`${basePath}/atlas?org=${customerId}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Vanguard Atlas
                  </Button>
                </CardContent>
              </Card>

              {/* Passwords */}
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Key className="h-4 w-4 text-amber-500" />
                    Passwords
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-white/40 hover:text-cyan-400">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockAtlasData.passwords.map((pwd) => (
                      <div 
                        key={pwd.id} 
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-white">{pwd.name}</div>
                          <Badge className="bg-white/10 text-white/70 text-xs">{pwd.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-xs text-cyan-400">{pwd.username}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-white/40 hover:text-cyan-400"
                            onClick={() => copyToClipboard(pwd.username, pwd.id)}
                          >
                            {copiedId === pwd.id ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Configurations */}
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Server className="h-4 w-4 text-blue-500" />
                    Configurations
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-white/40 hover:text-cyan-400">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockAtlasData.configurations.map((config) => (
                      <div 
                        key={config.id} 
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-white">{config.name}</div>
                          <Badge variant="outline" className="text-xs border-white/20 text-white/70">{config.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-xs text-cyan-400">{config.ip}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-white/40 hover:text-cyan-400"
                            onClick={() => copyToClipboard(config.ip, `config-${config.id}`)}
                          >
                            {copiedId === `config-${config.id}` ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-white/60">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attachments yet</p>
                  <Button variant="outline" className="mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                    <Plus className="h-4 w-4 mr-1" />
                    Upload Attachment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

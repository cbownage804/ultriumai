/**
 * Vanguard Customer Detail Page
 * Atera-style customer profile with tabbed navigation including Vanguard Atlas
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Building2, Phone, MapPin, Hash, Globe, Star, Calendar,
  Users, Monitor, Package, Ticket, AlertTriangle, Key, Paperclip, 
  Home, MoreHorizontal, Pencil, Plus, Mail, ExternalLink, Copy,
  CheckCircle, Server, FileText, Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Map } from 'lucide-react';

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
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`${basePath}/customers`)}
              className="text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Customer Logo/Avatar */}
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
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
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info('Edit customer')}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 border-0 ml-6">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="devices" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              Devices
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              Tickets
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              Alerts
            </TabsTrigger>
            <TabsTrigger 
              value="atlas" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-4 py-3 flex items-center gap-1"
            >
              <Map className="h-4 w-4 text-cyan-400" />
              Vanguard Atlas
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3"
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
              <div>
                <h3 className="font-medium text-gray-900 mb-4">System fields</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Phone</Label>
                    <span className="text-gray-900">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <Label className="text-gray-500">Address</Label>
                    <div className="text-right">
                      <span className="text-gray-900">{customer.address}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                        <MapPin className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Postal/Zip</Label>
                    <span className="text-gray-900">{customer.postalCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Fax</Label>
                    <span className="text-gray-400">{customer.fax || 'Enter fax'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-500 flex items-center gap-1">
                      Domains
                      <span className="text-gray-400 text-xs">ⓘ</span>
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900">{customer.domains[0]}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Website</Label>
                    <span className="text-gray-400">{customer.website || 'Enter URL'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">SLA</Label>
                    <span className="text-gray-900">{customer.sla}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-500">Feedback</Label>
                    <div className="flex items-center gap-1">
                      {renderStars(customer.feedback)}
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                        <span className="text-gray-400 text-xs">ⓘ</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Created</Label>
                    <span className="text-gray-900">{customer.created}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Modified</Label>
                    <span className="text-gray-900">{customer.modified}</span>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Custom fields</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-500">Security audit</Label>
                    <Select defaultValue={customer.customFields.securityAudit}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-500">Service history</Label>
                    <Input 
                      placeholder="Enter value" 
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-500">Last visit</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900">{customer.customFields.lastVisit}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Notes</h3>
                <Textarea 
                  value={customer.notes}
                  onChange={(e) => setCustomer({...customer, notes: e.target.value})}
                  className="min-h-[200px] resize-none"
                  placeholder="Add notes..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users ({mockUsers.length})</CardTitle>
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-teal-100 text-teal-700">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            {user.isPrimary && (
                              <Badge className="bg-teal-100 text-teal-700">Primary</Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Devices ({mockDevices.length})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate(`${basePath}/devices?customer=${customerId}`)}>
                  View All Devices
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Monitor className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="font-medium">{device.name}</span>
                          <div className="text-sm text-gray-500">{device.type}</div>
                        </div>
                      </div>
                      <code className="text-sm text-teal-600">{device.ip}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assets documented yet</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Open Tickets ({customer.stats.tickets})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate(`${basePath}/tickets?customer=${customerId}`)}>
                  View All Tickets
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>View tickets for this customer</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts ({customer.stats.alerts})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-500" />
                    Documents
                  </CardTitle>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockAtlasData.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="font-medium text-sm">{doc.title}</div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className="text-xs">{doc.category}</Badge>
                          <span className="text-xs text-gray-500">{doc.lastUpdated}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-cyan-600 border-cyan-200"
                    onClick={() => navigate(`${basePath}/atlas?org=${customerId}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Vanguard Atlas
                  </Button>
                </CardContent>
              </Card>

              {/* Passwords */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4 text-amber-500" />
                    Passwords
                  </CardTitle>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockAtlasData.passwords.map((pwd) => (
                      <div 
                        key={pwd.id} 
                        className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{pwd.name}</div>
                          <Badge variant="secondary" className="text-xs">{pwd.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-xs text-teal-600">{pwd.username}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    Configurations
                  </CardTitle>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockAtlasData.configurations.map((config) => (
                      <div 
                        key={config.id} 
                        className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{config.name}</div>
                          <Badge variant="outline" className="text-xs">{config.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-xs text-teal-600">{config.ip}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
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
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attachments yet</p>
                  <Button variant="outline" className="mt-4">
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

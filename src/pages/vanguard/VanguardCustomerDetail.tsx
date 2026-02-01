/**
 * Vanguard Customer Detail Page
 * Uses real customer data from database via useVanguardCustomer hook
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
import { 
  ArrowLeft, Building2, Phone, MapPin, Globe,
  Package, AlertTriangle, Key, 
  MoreHorizontal, Pencil, Plus, ExternalLink, Copy,
  CheckCircle, Server, FileText, Loader2
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
import { CustomerAgentDownload } from '@/components/vanguard/CustomerAgentDownload';
import { useVanguardCustomer } from '@/hooks/useVanguardCustomer';

export default function VanguardCustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const basePath = getVanguardBasePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const { customer, contacts, devices, ticketCount, isLoading, error } = useVanguardCustomer(customerId);

  useEffect(() => {
    if (customer) {
      document.title = `${customer.company_name} | Customers | Ultrium Vanguard`;
    }
  }, [customer?.company_name]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span>Loading customer...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto text-white/30 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Customer Not Found</h2>
          <p className="text-white/60 mb-4">The customer you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate(`${basePath}/customers`)} className="bg-cyan-600 hover:bg-cyan-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold text-white">{customer.company_name}</h1>
              <div className="flex items-center gap-4 text-sm text-white/60">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </span>
                )}
                {customer.domain && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {customer.domain}
                  </span>
                )}
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
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="devices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white">
              Devices
            </TabsTrigger>
            <TabsTrigger value="tickets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 hover:text-white">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="atlas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-white/60 px-4 py-3 flex items-center gap-1 hover:text-white">
              <Map className="h-4 w-4 text-cyan-400" />
              Vanguard Atlas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer Info */}
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Customer Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-white/60">Company</Label>
                    <span className="text-white">{customer.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Contact</Label>
                    <span className="text-white">{customer.contact_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Email</Label>
                    <span className="text-white">{customer.contact_email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between">
                      <Label className="text-white/60">Phone</Label>
                      <span className="text-white">{customer.phone}</span>
                    </div>
                  )}
                  {customer.domain && (
                    <div className="flex justify-between">
                      <Label className="text-white/60">Domain</Label>
                      <span className="text-white">{customer.domain}</span>
                    </div>
                  )}
                  {customer.business_size && (
                    <div className="flex justify-between">
                      <Label className="text-white/60">Business Size</Label>
                      <span className="text-white capitalize">{customer.business_size}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Label className="text-white/60">Monthly Rate</Label>
                    <span className="text-white">${customer.monthly_rate}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Status</Label>
                    <Badge className={customer.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Endpoints</Label>
                    <span className="text-2xl font-bold text-cyan-400">{customer.endpoints || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Active Alerts</Label>
                    <span className="text-2xl font-bold text-amber-400">{customer.alerts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Tickets</Label>
                    <span className="text-2xl font-bold text-purple-400">{ticketCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Health Status</Label>
                    <Badge className={
                      customer.health_status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                      customer.health_status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {customer.health_status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Timeline</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-white/60">Created</Label>
                    <span className="text-white">{new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-white/60">Last Updated</Label>
                    <span className="text-white">{new Date(customer.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Users ({contacts.length})</CardTitle>
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No contacts added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                              {contact.contact_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{contact.contact_name}</span>
                              {contact.is_primary && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Primary</Badge>
                              )}
                            </div>
                            <span className="text-sm text-white/60">{contact.email}</span>
                          </div>
                        </div>
                        {contact.role && (
                          <Badge variant="outline" className="border-white/20 text-white/70">{contact.role}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="mt-0 space-y-6">
            <CustomerAgentDownload 
              customerId={customerId || ''} 
              customerName={customer.company_name} 
            />
            
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Devices ({devices.length})</CardTitle>
                <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" onClick={() => navigate(`${basePath}/devices?customer=${customerId}`)}>
                  View All Devices
                </Button>
              </CardHeader>
              <CardContent>
                {devices.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No devices registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-cyan-500/10 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <Monitor className="h-5 w-5 text-white/40" />
                          <div>
                            <span className="font-medium text-white">{device.hostname}</span>
                            {device.device_type && (
                              <div className="text-sm text-white/60">{device.device_type}</div>
                            )}
                          </div>
                        </div>
                        {device.ip_address && (
                          <code className="text-sm text-cyan-400">{device.ip_address}</code>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-0">
            <CustomerTicketsTab 
              customerId={customerId || ''} 
              customerName={customer.company_name}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-0">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Active Alerts ({customer.alerts || 0})</CardTitle>
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
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-500" />
                  Vanguard Atlas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-white/60">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documentation added yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => navigate(`${basePath}/atlas?org=${customerId}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Vanguard Atlas
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

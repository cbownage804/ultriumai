/**
 * Vanguard Customer Detail Page
 * Datto-style vertical sidebar navigation
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, Building2, Phone, Globe,
  AlertTriangle, 
  MoreHorizontal, Pencil, ExternalLink,
  Monitor, Users, FileText, Loader2,
  LayoutDashboard, Ticket, Bell, Map, ShieldCheck,
  ChevronDown, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { CustomerTicketsTab } from '@/components/vanguard/CustomerTicketsTab';
import { CustomerAgentDownload } from '@/components/vanguard/CustomerAgentDownload';
import { useVanguardCustomer } from '@/hooks/useVanguardCustomer';
import { PortalContactManager, CompanySafeSuiteSettings } from '@/components/vanguard/portal';
import { PortalUserManagement } from '@/components/vanguard/PortalUserManagement';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

export default function VanguardCustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const basePath = getVanguardBasePath();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { customer, contacts, devices, ticketCount, endpointCount, alertCount, isLoading, error } = useVanguardCustomer(customerId);

  useEffect(() => {
    if (customer) {
      document.title = `${customer.company_name} | Customers | Ultrium Vanguard`;
    }
  }, [customer?.company_name]);

  const sidebarGroups: SidebarGroup[] = [
    {
      label: customer?.company_name || 'Customer',
      defaultOpen: true,
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'devices', label: 'Devices', icon: Monitor, badge: endpointCount },
        { id: 'tickets', label: 'Tickets', icon: Ticket, badge: ticketCount },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
      ],
    },
    {
      label: 'Management',
      defaultOpen: true,
      items: [
        { id: 'portal', label: 'Portal Access', icon: Globe },
        { id: 'atlas', label: 'Documentation', icon: FileText },
      ],
    },
  ];

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
    <div className="min-h-screen bg-[#050a0a] flex">
      {/* Vertical Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0a1929]/80 border-r border-cyan-500/20 flex flex-col h-screen sticky top-0">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-cyan-500/20">
          <button
            onClick={() => navigate(`${basePath}/customers`)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors w-full mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sites</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{customer.company_name}</p>
              <p className="text-xs text-white/40 truncate">{customer.domain || customer.contact_email}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sidebarGroups.map((group) => (
            <SidebarGroupComponent
              key={group.label}
              group={group}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-2 w-2 rounded-full',
              customer.is_active ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-xs text-white/50">{customer.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <div className="bg-black/60 border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm text-white/50">
            Sites / <span className="text-cyan-400">{customer.company_name}</span> / <span className="text-white">{sidebarGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/30">
              <DropdownMenuItem onClick={() => navigate(`${basePath}/customers/${customerId}/edit`)} className="text-white hover:bg-white/10">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Customer Information</h3>
                <div className="space-y-4">
                  <DetailRow label="Company" value={customer.company_name} />
                  <DetailRow label="Contact" value={customer.contact_name} />
                  <DetailRow label="Email" value={customer.contact_email} />
                  {customer.phone && <DetailRow label="Phone" value={customer.phone} />}
                  {customer.domain && <DetailRow label="Domain" value={customer.domain} />}
                  {customer.business_size && <DetailRow label="Business Size" value={customer.business_size} />}
                  <DetailRow label="Monthly Rate" value={`$${customer.monthly_rate}/mo`} />
                  <div className="flex justify-between">
                    <Label className="text-white/60">Status</Label>
                    <Badge className={customer.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Endpoints</Label>
                    <span className="text-2xl font-bold text-cyan-400">{endpointCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60">Active Alerts</Label>
                    <span className="text-2xl font-bold text-amber-400">{alertCount}</span>
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

              <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-6">
                <h3 className="font-medium text-white mb-4">Timeline</h3>
                <div className="space-y-4">
                  <DetailRow label="Created" value={new Date(customer.created_at).toLocaleDateString()} />
                  <DetailRow label="Last Updated" value={new Date(customer.updated_at).toLocaleDateString()} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <PortalUserManagement 
                clientId={customerId || ''} 
                clientName={customer.company_name}
              />
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Contacts ({contacts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
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
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'tickets' && (
            <CustomerTicketsTab 
              customerId={customerId || ''} 
              customerName={customer.company_name}
            />
          )}

          {activeTab === 'alerts' && (
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
          )}

          {activeTab === 'portal' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortalContactManager 
                clientId={customerId || ''} 
                companyName={customer.company_name}
              />
              <CompanySafeSuiteSettings 
                clientId={customerId || ''} 
                companyName={customer.company_name}
              />
            </div>
          )}

          {activeTab === 'atlas' && (
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
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Label className="text-white/60">{label}</Label>
      <span className="text-white">{value}</span>
    </div>
  );
}

function SidebarGroupComponent({ group, activeTab, onSelect }: { group: SidebarGroup; activeTab: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
      >
        <span>{group.label}</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="space-y-0.5 px-1">
          {group.items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md transition-colors',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span className={cn(
                    'ml-auto text-xs px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/50'
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

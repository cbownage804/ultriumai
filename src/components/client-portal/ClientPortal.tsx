/**
 * Atera-style Client Portal
 * Enhanced customer portal with ticketing, knowledge base synced with SafeDoc, and branding
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Bell, 
  FileText, 
  HelpCircle, 
  Settings,
  Server,
  Shield,
  Cloud,
  Monitor,
  Activity,
  DollarSign,
  Clock,
  BookOpen,
  MessageSquare,
  Calendar,
  Ticket as TicketIcon
} from "lucide-react";
import safedocLogo from '@/assets/logos/logo-safedoc.png';
import { format } from "date-fns";
import { PortalTicketList, type Ticket } from "./PortalTicketList";
import { PortalKnowledgeBase, type KBArticle } from "./PortalKnowledgeBase";

interface Service {
  id: string;
  service_name: string;
  service_description?: string;
  service_type: string;
  service_status: 'active' | 'inactive' | 'maintenance' | 'degraded' | 'outage';
  service_health: number;
  monthly_cost?: number;
  contract_end_date?: string;
  last_check_at: string;
}

interface PortalNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  starts_at: string;
  expires_at?: string;
  affected_services: string[];
}

const ClientPortal = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KBArticle[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    category: "general",
  });

  useEffect(() => {
    if (user) {
      fetchPortalData();
    }
  }, [user]);

  const fetchPortalData = async () => {
    setLoading(true);
    
    // Demo ticket data in Atera style
    setTickets([
      {
        id: '1',
        ticket_number: '13',
        title: 'New employee onboarding',
        description: 'Need to set up accounts and equipment for new hire starting Monday',
        customer_name: 'Aix University',
        contact_name: 'James Myler',
        technician_name: 'Allen Conley',
        status: 'open',
        priority: 'critical',
        created_at: new Date(Date.now() - 360000).toISOString(),
        updated_at: new Date(Date.now() - 720000).toISOString(),
      },
      {
        id: '2',
        ticket_number: '525',
        title: 'Recurring problem with Dell XP 13 900 and display drivers',
        description: 'Display driver crashes intermittently, especially when using external monitors',
        customer_name: 'Aix University',
        contact_name: 'Leslie Warren',
        technician_name: 'Allen Conley',
        status: 'open',
        priority: 'critical',
        created_at: new Date(Date.now() - 1440000).toISOString(),
        updated_at: new Date(Date.now() - 1440000).toISOString(),
      },
      {
        id: '3',
        ticket_number: '1233',
        title: 'New employee onboarding',
        description: 'Setting up workstation for new marketing team member',
        customer_name: 'IT Max LTD',
        contact_name: 'Joel Nair',
        technician_name: 'Allen Conley',
        status: 'open',
        priority: 'critical',
        created_at: new Date(Date.now() - 2160000).toISOString(),
        updated_at: new Date(Date.now() - 720000).toISOString(),
      },
      {
        id: '4',
        ticket_number: '30',
        title: 'Access to the finance database folder',
        description: 'Request access to shared drive for finance reports',
        customer_name: 'Aix University',
        contact_name: 'Travis Taylor',
        technician_name: 'Allen Conley',
        status: 'open',
        priority: 'low',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);

    // Demo services
    setServices([
      {
        id: '1',
        service_name: 'Email Security',
        service_description: 'Advanced email security with spam filtering and threat protection',
        service_type: 'security',
        service_status: 'active',
        service_health: 98,
        monthly_cost: 299.99,
        contract_end_date: '2024-12-31',
        last_check_at: new Date().toISOString(),
      },
      {
        id: '2',
        service_name: 'Cloud Backup',
        service_description: 'Automated daily backups to secure cloud storage',
        service_type: 'backup',
        service_status: 'active',
        service_health: 100,
        monthly_cost: 149.99,
        last_check_at: new Date().toISOString(),
      },
      {
        id: '3',
        service_name: 'Network Monitoring',
        service_description: '24/7 network monitoring and alerting',
        service_type: 'monitoring',
        service_status: 'maintenance',
        service_health: 85,
        monthly_cost: 199.99,
        last_check_at: new Date().toISOString(),
      }
    ]);

    // Demo KB articles synced with SafeDoc
    setKnowledgeBase([
      {
        id: '1',
        title: 'How to Set Up Email Forwarding',
        content: 'Follow these steps to set up email forwarding in Outlook. First, open Outlook and navigate to Settings. Click on "Mail" and then "Forwarding". Enter the email address you want to forward to and save your changes.',
        category: 'How-To Guides',
        tags: ['email', 'outlook', 'forwarding'],
        is_featured: true,
        view_count: 145,
        helpful_count: 42,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'kb',
      },
      {
        id: '2',
        title: 'Best Practices for Password Management',
        content: 'Learn how to create and manage secure passwords. Use a minimum of 12 characters, include uppercase, lowercase, numbers, and symbols. Never reuse passwords across different accounts.',
        category: 'Getting Started',
        tags: ['security', 'passwords', 'best-practices'],
        is_featured: true,
        view_count: 278,
        helpful_count: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'kb',
      },
      {
        id: '3',
        title: 'Network Diagram - Main Office',
        content: 'This document provides a comprehensive overview of the main office network topology, including router configurations, VLAN assignments, and firewall rules.',
        category: 'How-To Guides',
        tags: ['network', 'infrastructure', 'documentation'],
        is_featured: false,
        view_count: 67,
        helpful_count: 23,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'safedoc',
      },
      {
        id: '4',
        title: 'VPN Setup Guide',
        content: 'Step-by-step instructions for configuring VPN access on Windows, Mac, and mobile devices. Includes troubleshooting tips for common connection issues.',
        category: 'How-To Guides',
        tags: ['vpn', 'remote-access', 'security'],
        is_featured: true,
        view_count: 192,
        helpful_count: 56,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'safedoc',
      },
      {
        id: '5',
        title: 'What to do if you receive a suspicious email?',
        content: 'If you receive a suspicious email, do not click any links or download attachments. Report it immediately using the "Report Phishing" button in Outlook or forward it to security@company.com.',
        category: 'FAQ',
        tags: ['security', 'phishing', 'email'],
        is_featured: false,
        view_count: 89,
        helpful_count: 34,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'kb',
      },
      {
        id: '6',
        title: 'Backup Verification Procedures',
        content: 'Daily backup verification checklist and procedures for ensuring data integrity. Includes steps for testing restore processes.',
        category: 'Troubleshooting',
        tags: ['backup', 'disaster-recovery', 'runbook'],
        is_featured: false,
        view_count: 34,
        helpful_count: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'safedoc',
      },
    ]);

    setNotifications([
      {
        id: '1',
        notification_type: 'maintenance',
        title: 'Scheduled Maintenance: Network Monitoring',
        message: 'Network monitoring services will be offline for maintenance from 2:00 AM to 4:00 AM EST.',
        severity: 'warning',
        starts_at: new Date().toISOString(),
        affected_services: ['Network Monitoring'],
      }
    ]);

    setLoading(false);
  };

  const handleSubmitTicket = async () => {
    if (!user || !newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const demoTicket: Ticket = {
      id: Date.now().toString(),
      ticket_number: Math.floor(Math.random() * 9000 + 1000).toString(),
      title: newTicket.title,
      description: newTicket.description,
      customer_name: 'Your Organization',
      contact_name: user.email,
      status: 'open',
      priority: newTicket.priority as Ticket['priority'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTickets(prev => [demoTicket, ...prev]);
    setShowNewTicketDialog(false);
    setNewTicket({
      title: "",
      description: "",
      priority: "medium",
      category: "general",
    });

    toast({
      title: "Ticket Created",
      description: `Ticket #${demoTicket.ticket_number} has been submitted successfully.`,
    });
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'infrastructure': return Server;
      case 'security': return Shield;
      case 'backup': return Cloud;
      case 'monitoring': return Monitor;
      case 'support': return HelpCircle;
      default: return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'degraded': return 'bg-orange-100 text-orange-800';
      case 'outage': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMonthlyCost = services.reduce((sum, service) => sum + (service.monthly_cost || 0), 0);
  const activeServices = services.filter(s => s.service_status === 'active').length;
  const averageHealth = services.length > 0 ? 
    Math.round(services.reduce((sum, s) => sum + s.service_health, 0) / services.length) : 100;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
          <p className="text-muted-foreground">Open and track tickets, access your knowledge base, and manage services</p>
        </div>
        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit New Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue or request and we'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Support</SelectItem>
                      <SelectItem value="hardware">Hardware Issue</SelectItem>
                      <SelectItem value="software">Software Issue</SelectItem>
                      <SelectItem value="network">Network/Connectivity</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="access">Access Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Subject *</Label>
                <Input
                  id="title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide as much detail as possible..."
                  rows={5}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitTicket} className="bg-teal-500 hover:bg-teal-600">
                  Submit Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`border-l-4 ${
              notification.severity === 'critical' ? 'border-l-red-500' :
              notification.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Bell className={`h-5 w-5 mt-0.5 ${
                    notification.severity === 'critical' ? 'text-red-500' :
                    notification.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.affected_services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {notification.affected_services.map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TicketIcon className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-sm font-medium">Open Tickets</p>
                <p className="text-2xl font-bold">{openTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Services</p>
                <p className="text-2xl font-bold">{activeServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Health Score</p>
                <p className="text-2xl font-bold">{averageHealth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Monthly Cost</p>
                <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="tickets" className="flex items-center gap-1">
            <TicketIcon className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-1">
            <Server className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab - Atera Style */}
        <TabsContent value="tickets" className="space-y-4">
          <PortalTicketList 
            tickets={tickets}
            onNewTicket={() => setShowNewTicketDialog(true)}
            onViewTicket={(ticket) => {
              toast({
                title: `Ticket #${ticket.ticket_number}`,
                description: ticket.title,
              });
            }}
            isCustomerView={true}
          />
        </TabsContent>

        {/* Knowledge Base Tab - Synced with SafeDoc */}
        <TabsContent value="knowledge" className="space-y-4">
          <PortalKnowledgeBase
            articles={knowledgeBase}
            customerId={user?.id}
            portalBranding={{
              companyName: 'Knowledge Base',
              primaryColor: '#0d9488'
            }}
            onViewArticle={() => {
              /* view tracking handled elsewhere */
            }}
            onMarkHelpful={(articleId) => {
              setKnowledgeBase(prev => prev.map(a => 
                a.id === articleId 
                  ? { ...a, helpful_count: a.helpful_count + 1 }
                  : a
              ));
              toast({
                title: "Thank you!",
                description: "Your feedback helps us improve.",
              });
            }}
          />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {services.map((service) => {
              const IconComponent = getServiceIcon(service.service_type);
              return (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-teal-50 rounded-lg">
                          <IconComponent className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{service.service_name}</h3>
                            <Badge className={getStatusColor(service.service_status)}>
                              {service.service_status}
                            </Badge>
                          </div>
                          {service.service_description && (
                            <p className="text-muted-foreground mb-3">{service.service_description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Health: {service.service_health}%</span>
                            {service.monthly_cost && (
                              <span>Monthly: ${service.monthly_cost}</span>
                            )}
                            {service.contract_end_date && (
                              <span>Contract ends: {format(new Date(service.contract_end_date), 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{service.service_health}%</div>
                        <div className="text-xs text-muted-foreground">Health Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-teal-500" />
                  <span>Contact Support</span>
                </CardTitle>
                <CardDescription>
                  Get help from our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Emergency Support</p>
                  <p className="text-2xl font-bold text-red-600">1-800-EMERGENCY</p>
                  <p className="text-xs text-muted-foreground">24/7 for critical issues</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">General Support</p>
                  <p className="text-lg font-semibold">support@yourcompany.com</p>
                  <p className="text-xs text-muted-foreground">Response within 4 hours</p>
                </div>
                <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={() => setShowNewTicketDialog(true)}>
                  Submit Support Request
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-teal-500" />
                  <span>Support Hours</span>
                </CardTitle>
                <CardDescription>
                  When you can reach our team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Monday - Friday</span>
                    <span>8:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday</span>
                    <span>9:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sunday</span>
                    <span>Emergency Only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">After Hours</span>
                    <span>Emergency Support Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPortal;

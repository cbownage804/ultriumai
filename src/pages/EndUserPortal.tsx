import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Globe,
  Ticket,
  Heart,
  BookOpen,
  Shield,
  Loader2,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Monitor,
  HardDrive,
  Wifi,
  ShieldCheck,
  Lock,
  FileText,
  Send,
  Phone,
  Mail,
  ExternalLink,
  Scan,
  Eye,
  MapPin,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface PortalSettings {
  portal_name: string;
  welcome_message: string;
  primary_color: string;
  enable_tickets: boolean;
  enable_health_status: boolean;
  enable_knowledge_base: boolean;
  enable_safepass: boolean;
  safepass_subscription_required: boolean;
  enable_safescan: boolean;
  safescan_subscription_required: boolean;
  enable_safeweb: boolean;
  safeweb_subscription_required: boolean;
  enable_safetrack: boolean;
  safetrack_subscription_required: boolean;
  support_email: string;
  support_phone: string;
  portal_logo_url?: string;
  msp_user_id?: string;
  portal_settings_id?: string;
}

// End-User Portal - Self-service interface for customers
export default function EndUserPortal() {
  const [searchParams] = useSearchParams();
  const portalKey = searchParams.get("portal_key");
  const initialTab = searchParams.get("tab") || "dashboard";
  const isEmbedded = searchParams.get("embedded") === "true";

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [customerEmail, setCustomerEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [safePassOpen, setSafePassOpen] = useState(false);
  const [safeScanOpen, setSafeScanOpen] = useState(false);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>({
    portal_name: "IT Support Portal",
    welcome_message: "Welcome! How can we help you today?",
    primary_color: "#0891b2",
    enable_tickets: true,
    enable_health_status: true,
    enable_knowledge_base: true,
    enable_safepass: true,
    safepass_subscription_required: true,
    enable_safescan: true,
    safescan_subscription_required: true,
    enable_safeweb: true,
    safeweb_subscription_required: true,
    enable_safetrack: true,
    safetrack_subscription_required: true,
    support_email: "support@example.com",
    support_phone: "+1 (555) 123-4567",
  });

  // Demo data
  const [tickets] = useState([
    {
      id: "TKT-001",
      subject: "Cannot connect to VPN",
      status: "open",
      priority: "high",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      last_update: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: "TKT-002",
      subject: "Email sync issues on mobile",
      status: "in_progress",
      priority: "medium",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      last_update: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "TKT-003",
      subject: "Password reset request",
      status: "resolved",
      priority: "low",
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000),
      last_update: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
  ]);

  const [deviceHealth] = useState({
    status: "healthy",
    lastScan: new Date(Date.now() - 4 * 60 * 60 * 1000),
    cpu: 23,
    memory: 58,
    disk: 45,
    antivirus: {
      status: "active",
      lastUpdate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      definitions: "Current",
    },
    backup: {
      status: "success",
      lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000),
      nextScheduled: new Date(Date.now() + 18 * 60 * 60 * 1000),
    },
    network: {
      status: "connected",
      ip: "192.168.1.105",
      speed: "1 Gbps",
    },
  });

  const [kbArticles] = useState([
    { id: 1, title: "How to Connect to VPN", category: "Network", views: 1234 },
    { id: 2, title: "Setting Up Email on Mobile Devices", category: "Email", views: 892 },
    { id: 3, title: "Password Reset Guide", category: "Security", views: 567 },
    { id: 4, title: "Troubleshooting Printer Issues", category: "Hardware", views: 445 },
  ]);

  useEffect(() => {
    const loadPortalSettings = async () => {
      if (portalKey) {
        try {
          const { data, error } = await supabase
            .from("vanguard_portal_settings")
            .select("*")
            .eq("portal_key", portalKey)
            .maybeSingle();

          if (data) {
            setPortalSettings({
              portal_name: data.portal_name || "IT Support Portal",
              welcome_message: data.welcome_message || "Welcome! How can we help you today?",
              primary_color: data.primary_color || "#0891b2",
              enable_tickets: data.enable_tickets ?? true,
              enable_health_status: data.enable_health_status ?? true,
              enable_knowledge_base: data.enable_knowledge_base ?? true,
              enable_safepass: data.enable_safepass ?? false,
              safepass_subscription_required: data.safepass_subscription_required ?? true,
              enable_safescan: data.enable_safescan ?? false,
              safescan_subscription_required: data.safescan_subscription_required ?? true,
              enable_safeweb: data.enable_safeweb ?? false,
              safeweb_subscription_required: data.safeweb_subscription_required ?? true,
              enable_safetrack: data.enable_safetrack ?? false,
              safetrack_subscription_required: data.safetrack_subscription_required ?? true,
              support_email: data.support_email || "",
              support_phone: data.support_phone || "",
              portal_logo_url: data.portal_logo_url,
              msp_user_id: data.user_id,
              portal_settings_id: data.id,
            });
          }
        } catch (err) {
          console.error("Error loading portal settings:", err);
        }
      }
      setIsLoading(false);
    };

    loadPortalSettings();
  }, [portalKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerEmail && accessCode) {
      setIsAuthenticated(true);
    }
  };

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    description: "",
  });

  const handleSubmitTicket = async () => {
    if (!newTicket.subject || !newTicket.description || !portalSettings.portal_settings_id) return;

    try {
      // Submit ticket with portal_settings_id to route to correct MSP
      const { error } = await supabase.from("vanguard_portal_tickets").insert({
        portal_settings_id: portalSettings.portal_settings_id,
        portal_key: portalKey,
        subject: newTicket.subject,
        category: newTicket.category,
        priority: newTicket.priority,
        description: newTicket.description,
        submitted_via: isEmbedded ? "tray_app" : "web",
        status: "open",
      });

      if (error) throw error;

      setNewTicket({ subject: "", category: "general", priority: "medium", description: "" });
      setActiveTab("tickets");
    } catch (err) {
      console.error("Failed to submit ticket:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 border-cyan-500/30">
            <CardHeader className="text-center pb-2">
              <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl text-white">{portalSettings.portal_name}</CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to access your support portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Email Address</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Access Code</Label>
                  <Input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Enter your access code"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Contact your IT administrator if you don't have an access code
                  </p>
                </div>
                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Sign In
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-center text-sm text-slate-400 mb-3">Need help?</p>
                <div className="flex justify-center gap-4 text-sm">
                  <a
                    href={`mailto:${portalSettings.support_email}`}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Mail className="h-4 w-4" />
                    Email Support
                  </a>
                  <a
                    href={`tel:${portalSettings.support_phone}`}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Phone className="h-4 w-4" />
                    Call Us
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/50 border-b border-cyan-500/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{portalSettings.portal_name}</h1>
              <p className="text-xs text-slate-400">{customerEmail}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAuthenticated(false)}
            className="text-slate-400 hover:text-white"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Welcome Message */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-slate-800/60 border-cyan-500/30 mb-6">
            <CardContent className="p-6">
              <p className="text-lg text-white">{portalSettings.welcome_message}</p>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-cyan-500/20 mb-6">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-500/20">
                <Monitor className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              {portalSettings.enable_tickets && (
                <TabsTrigger value="tickets" className="data-[state=active]:bg-cyan-500/20">
                  <Ticket className="h-4 w-4 mr-2" />
                  My Tickets
                </TabsTrigger>
              )}
              {portalSettings.enable_tickets && (
                <TabsTrigger value="new-ticket" className="data-[state=active]:bg-cyan-500/20">
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </TabsTrigger>
              )}
              {portalSettings.enable_health_status && (
                <TabsTrigger value="health" className="data-[state=active]:bg-cyan-500/20">
                  <Heart className="h-4 w-4 mr-2" />
                  System Health
                </TabsTrigger>
              )}
              {portalSettings.enable_knowledge_base && (
                <TabsTrigger value="kb" className="data-[state=active]:bg-cyan-500/20">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Knowledge Base
                </TabsTrigger>
              )}
              {portalSettings.enable_safepass && (
                <TabsTrigger value="safepass" className="data-[state=active]:bg-amber-500/20">
                  <Lock className="h-4 w-4 mr-2" />
                  SafePass
                </TabsTrigger>
              )}
              {portalSettings.enable_safescan && (
                <TabsTrigger value="safescan" className="data-[state=active]:bg-red-500/20">
                  <Scan className="h-4 w-4 mr-2" />
                  SafeScan
                </TabsTrigger>
              )}
              {portalSettings.enable_safeweb && (
                <TabsTrigger value="safeweb" className="data-[state=active]:bg-blue-500/20">
                  <Eye className="h-4 w-4 mr-2" />
                  SafeWeb
                </TabsTrigger>
              )}
              {portalSettings.enable_safetrack && (
                <TabsTrigger value="safetrack" className="data-[state=active]:bg-green-500/20">
                  <MapPin className="h-4 w-4 mr-2" />
                  SafeTrack
                </TabsTrigger>
              )}
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-cyan-400" />
                      Open Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-cyan-400">
                      {tickets.filter((t) => t.status !== "resolved").length}
                    </div>
                    <p className="text-sm text-slate-400">
                      {tickets.filter((t) => t.status === "resolved").length} resolved
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-400" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Healthy
                    </Badge>
                    <p className="text-sm text-slate-400 mt-2">
                      Last scan: {format(deviceHealth.lastScan, "MMM d, h:mm a")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-purple-400" />
                      Backup Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Protected
                    </Badge>
                    <p className="text-sm text-slate-400 mt-2">
                      Last backup: {format(deviceHealth.backup.lastBackup, "MMM d, h:mm a")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Tickets */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Recent Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tickets.slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div>
                          <p className="text-white font-medium">{ticket.subject}</p>
                          <p className="text-xs text-slate-400">
                            {ticket.id} • Created {format(ticket.created_at, "MMM d")}
                          </p>
                        </div>
                        <Badge
                          className={
                            ticket.status === "resolved"
                              ? "bg-green-500/20 text-green-400"
                              : ticket.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-amber-500/20 text-amber-400"
                          }
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">My Support Tickets</CardTitle>
                    <Button
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700"
                      onClick={() => setActiveTab("new-ticket")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Ticket
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
                              <Badge
                                variant="outline"
                                className={
                                  ticket.priority === "high"
                                    ? "border-red-500/50 text-red-400"
                                    : ticket.priority === "medium"
                                    ? "border-amber-500/50 text-amber-400"
                                    : "border-slate-500/50 text-slate-400"
                                }
                              >
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-white font-medium">{ticket.subject}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Last updated: {format(ticket.last_update, "MMM d, h:mm a")}
                            </p>
                          </div>
                          <Badge
                            className={
                              ticket.status === "resolved"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : ticket.status === "in_progress"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }
                          >
                            {ticket.status === "in_progress" ? "In Progress" : ticket.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* New Ticket Tab */}
            <TabsContent value="new-ticket">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Create New Ticket</CardTitle>
                  <CardDescription className="text-slate-400">
                    Describe your issue and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Subject</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Category</Label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Support</SelectItem>
                          <SelectItem value="network">Network Issues</SelectItem>
                          <SelectItem value="email">Email Problems</SelectItem>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Priority</Label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - No rush</SelectItem>
                          <SelectItem value="medium">Medium - Affects my work</SelectItem>
                          <SelectItem value="high">High - Cannot work</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Description</Label>
                    <Textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white min-h-[150px]"
                      placeholder="Please provide as much detail as possible..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setActiveTab("tickets")}>
                      Cancel
                    </Button>
                    <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleSubmitTicket}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Status Tab */}
            <TabsContent value="health">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-cyan-400" />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">CPU Usage</span>
                        <span className="text-white">{deviceHealth.cpu}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${deviceHealth.cpu}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Memory Usage</span>
                        <span className="text-white">{deviceHealth.memory}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${deviceHealth.memory}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Disk Usage</span>
                        <span className="text-white">{deviceHealth.disk}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${deviceHealth.disk}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-400" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-white">Antivirus Active</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">Current</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-white">Firewall Enabled</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">Protected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-white">Windows Updates</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">Up to Date</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-purple-400" />
                      Backup Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="text-white font-medium">Last Backup Successful</p>
                          <p className="text-sm text-slate-400">
                            {format(deviceHealth.backup.lastBackup, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                        <Clock className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-slate-300">Next Scheduled</p>
                          <p className="text-sm text-slate-400">
                            {format(deviceHealth.backup.nextScheduled, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-blue-400" />
                      Network Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                        <span className="text-slate-300">Connection</span>
                        <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                        <span className="text-slate-300">IP Address</span>
                        <span className="text-white font-mono">{deviceHealth.network.ip}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                        <span className="text-slate-300">Speed</span>
                        <span className="text-white">{deviceHealth.network.speed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="kb">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Knowledge Base</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Search articles..." className="pl-10 bg-slate-800/50 border-slate-700 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {kbArticles.map((article) => (
                      <div
                        key={article.id}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium hover:text-cyan-400 transition-colors">
                              {article.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{article.category}</Badge>
                              <span className="text-xs text-slate-400">{article.views} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SafePass Tab */}
            <TabsContent value="safepass">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-amber-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">SafePass Password Manager</CardTitle>
                      <CardDescription className="text-slate-400">
                        Securely access and manage your passwords
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {portalSettings.safepass_subscription_required ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-amber-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        SafeSuite Subscription Required
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto mb-6">
                        SafePass password manager is available with an active SafeSuite subscription.
                        Contact your IT administrator to upgrade.
                      </p>
                      <Button className="bg-amber-600 hover:bg-amber-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More About SafeSuite
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-amber-400" />
                          <span className="text-white">Access your password vault</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => setSafePassOpen(true)}
                          >
                            Open Here
                          </Button>
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => window.open('/safesuite/safepass', '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Web
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SafeScan Tab */}
            <TabsContent value="safescan">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-red-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Scan className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">SafeScan Vulnerability Scanner</CardTitle>
                      <CardDescription className="text-slate-400">
                        Scan your devices for security vulnerabilities
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {portalSettings.safescan_subscription_required ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <Scan className="h-8 w-8 text-red-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        SafeSuite Subscription Required
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto mb-6">
                        SafeScan vulnerability scanner is available with an active SafeSuite subscription.
                        Contact your IT administrator to upgrade.
                      </p>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More About SafeSuite
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-3">
                          <Scan className="h-5 w-5 text-red-400" />
                          <span className="text-white">Run a security scan on your devices</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => setSafeScanOpen(true)}
                          >
                            Open Here
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => window.open('/safesuite/safescan', '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Web
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SafeWeb Tab - Opens to Web */}
            <TabsContent value="safeweb">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-blue-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">SafeWeb Dark Web Monitoring</CardTitle>
                      <CardDescription className="text-slate-400">
                        Monitor the dark web for your exposed credentials
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {portalSettings.safeweb_subscription_required ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <Eye className="h-8 w-8 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        SafeSuite Subscription Required
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto mb-6">
                        SafeWeb dark web monitoring is available with an active SafeSuite subscription.
                        Contact your IT administrator to upgrade.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More About SafeSuite
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-start gap-3">
                          <Eye className="h-5 w-5 text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-white font-medium">Dark Web Monitoring Dashboard</p>
                            <p className="text-sm text-slate-400 mt-1">
                              SafeWeb opens in the full web application for comprehensive dark web monitoring and alerts.
                            </p>
                          </div>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.open('/safesuite/safeweb', '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open SafeWeb
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SafeTrack Tab - Opens to Web */}
            <TabsContent value="safetrack">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-green-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">SafeTrack Asset Manager</CardTitle>
                      <CardDescription className="text-slate-400">
                        Track assets and manage warranties
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {portalSettings.safetrack_subscription_required ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-8 w-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        SafeSuite Subscription Required
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto mb-6">
                        SafeTrack asset management is available with an active SafeSuite subscription.
                        Contact your IT administrator to upgrade.
                      </p>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More About SafeSuite
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-white font-medium">Asset & Warranty Management</p>
                            <p className="text-sm text-slate-400 mt-1">
                              SafeTrack opens in the full web application for comprehensive asset tracking and warranty management.
                            </p>
                          </div>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => window.open('/safesuite/safetrack', '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open SafeTrack
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* SafePass Popup Modal */}
      <Dialog open={safePassOpen} onOpenChange={setSafePassOpen}>
        <DialogContent className="max-w-4xl h-[80vh] bg-slate-900 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-400" />
              SafePass Password Manager
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">SafePass Vault</h3>
            <p className="text-slate-400 mb-6">Your passwords would load here in the embedded view.</p>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => window.open('/safesuite/safepass', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Full Window
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SafeScan Popup Modal */}
      <Dialog open={safeScanOpen} onOpenChange={setSafeScanOpen}>
        <DialogContent className="max-w-4xl h-[80vh] bg-slate-900 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Scan className="h-5 w-5 text-red-400" />
              SafeScan Vulnerability Scanner
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Scan className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Security Scanner</h3>
            <p className="text-slate-400 mb-6">Your vulnerability scan would run here in the embedded view.</p>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => window.open('/safesuite/safescan', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Full Window
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {portalSettings.portal_name}. Powered by Vanguard.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={`mailto:${portalSettings.support_email}`}
              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              {portalSettings.support_email}
            </a>
            <a
              href={`tel:${portalSettings.support_phone}`}
              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              {portalSettings.support_phone}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

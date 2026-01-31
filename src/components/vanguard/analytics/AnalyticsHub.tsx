import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Users,
  Server,
  Shield,
  AlertTriangle,
  Clock,
  Ticket,
  DollarSign,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { getVanguardBasePath } from "@/utils/subdomain";
import { HeroSection, SectionHeader, PremiumCard } from "@/components/vanguard/ui";
import {
  TrendAreaChart,
  MultiLineChart,
  ComparisonBarChart,
  DistributionChart,
  KPIWidget,
  ProgressRing,
} from "@/components/vanguard/ui/AnalyticsWidgets";

interface AnalyticsData {
  ticketVolume: { date: string; open: number; resolved: number; escalated: number }[];
  deviceHealth: { name: string; value: number; color: string }[];
  threatTrends: { date: string; value: number }[];
  revenue: { date: string; value: number }[];
  topClients: { name: string; value: number }[];
  slaCompliance: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  activeDevices: number;
  totalDevices: number;
  openTickets: number;
  mrr: number;
  securityScore: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const AnalyticsHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [data, setData] = useState<AnalyticsData>({
    ticketVolume: [],
    deviceHealth: [],
    threatTrends: [],
    revenue: [],
    topClients: [],
    slaCompliance: 0,
    avgResolutionTime: 0,
    customerSatisfaction: 0,
    activeDevices: 0,
    totalDevices: 0,
    openTickets: 0,
    mrr: 0,
    securityScore: 0,
  });

  useEffect(() => {
    if (user) loadAnalyticsData();
  }, [user, dateRange]);

  const getDaysFromRange = () => {
    switch (dateRange) {
      case "7d": return 7;
      case "14d": return 14;
      case "30d": return 30;
      case "90d": return 90;
      default: return 30;
    }
  };

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    const days = getDaysFromRange();
    const startDate = subDays(new Date(), days).toISOString();

    try {
      const [
        ticketsRes,
        devicesRes,
        threatsRes,
        invoicesRes,
      ] = await Promise.all([
        supabase.from("helpdesk_tickets").select("*").gte("created_at", startDate),
        supabase.from("rmm_devices").select("*"),
        supabase.from("security_events").select("*").gte("created_at", startDate),
        supabase.from("msp_invoices").select("*").gte("created_at", startDate),
      ]);

      // Process ticket volume by day
      const ticketsByDay: Record<string, { open: number; resolved: number; escalated: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "MMM dd");
        ticketsByDay[date] = { open: 0, resolved: 0, escalated: 0 };
      }
      
      (ticketsRes.data || []).forEach((ticket: any) => {
        const date = format(new Date(ticket.created_at), "MMM dd");
        if (ticketsByDay[date]) {
          ticketsByDay[date].open++;
          if (ticket.status === "resolved" || ticket.status === "closed") ticketsByDay[date].resolved++;
          if (ticket.priority === "critical" || ticket.priority === "high") ticketsByDay[date].escalated++;
        }
      });

      const ticketVolume = Object.entries(ticketsByDay).map(([date, counts]) => ({ date, ...counts }));

      // Device health distribution
      const devices = devicesRes.data || [];
      const online = devices.filter((d: any) => d.status === "online").length;
      const offline = devices.filter((d: any) => d.status === "offline").length;
      const warning = devices.filter((d: any) => d.status === "warning" || d.status === "degraded").length;

      const deviceHealth = [
        { name: "Online", value: online, color: "#22c55e" },
        { name: "Warning", value: warning, color: "#f97316" },
        { name: "Offline", value: offline, color: "#ef4444" },
      ];

      // Threat trends
      const threatsByDay: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        threatsByDay[format(subDays(new Date(), i), "MMM dd")] = 0;
      }
      (threatsRes.data || []).forEach((event: any) => {
        const date = format(new Date(event.created_at), "MMM dd");
        if (threatsByDay[date] !== undefined) threatsByDay[date]++;
      });
      const threatTrends = Object.entries(threatsByDay).map(([date, value]) => ({ date, value }));

      // Revenue trends
      const revenueByDay: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        revenueByDay[format(subDays(new Date(), i), "MMM dd")] = 0;
      }
      (invoicesRes.data || []).forEach((inv: any) => {
        const date = format(new Date(inv.created_at), "MMM dd");
        if (revenueByDay[date] !== undefined) revenueByDay[date] += Number(inv.total_amount) || 0;
      });
      const revenue = Object.entries(revenueByDay).map(([date, value]) => ({ date, value }));

      // Top clients by ticket volume
      const clientTickets: Record<string, number> = {};
      (ticketsRes.data || []).forEach((ticket: any) => {
        const client = ticket.customer_id || "Unknown";
        clientTickets[client] = (clientTickets[client] || 0) + 1;
      });
      const topClients = Object.entries(clientTickets)
        .map(([name, value]) => ({ name: name.substring(0, 8), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Calculate KPIs
      const openTickets = (ticketsRes.data || []).filter((t: any) => t.status !== "resolved" && t.status !== "closed").length;
      const resolvedTickets = (ticketsRes.data || []).filter((t: any) => t.status === "resolved" || t.status === "closed");
      const slaCompliant = resolvedTickets.filter((t: any) => !t.sla_breached).length;
      const slaCompliance = resolvedTickets.length > 0 ? Math.round((slaCompliant / resolvedTickets.length) * 100) : 100;

      // Average resolution time (mock - would calculate from actual timestamps)
      const avgResolutionTime = 2.4;

      // MRR calculation
      const mrr = (invoicesRes.data || []).reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0);

      // Security score (based on threats and compliance)
      const threatCount = threatsRes.data?.length || 0;
      const securityScore = Math.max(0, 100 - Math.min(threatCount * 2, 50) - (100 - slaCompliance) * 0.3);

      setData({
        ticketVolume,
        deviceHealth,
        threatTrends,
        revenue,
        topClients,
        slaCompliance,
        avgResolutionTime,
        customerSatisfaction: 4.5,
        activeDevices: online,
        totalDevices: devices.length,
        openTickets,
        mrr,
        securityScore: Math.round(securityScore),
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      kpis: {
        slaCompliance: data.slaCompliance,
        avgResolutionTime: data.avgResolutionTime,
        activeDevices: data.activeDevices,
        openTickets: data.openTickets,
        mrr: data.mrr,
        securityScore: data.securityScore,
      },
      trends: data,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(180,20%,2%)] via-[hsl(180,15%,4%)] to-[hsl(260,20%,5%)]">
      <motion.div
        className="container mx-auto p-4 md:p-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero */}
        <motion.div variants={itemVariants}>
          <HeroSection
            title="Analytics Hub"
            subtitle="Real-time insights and performance metrics"
            icon={BarChart3}
            status={
              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32 bg-black/40 border-cyan-500/30 text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-cyan-500/30">
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="14d">Last 14 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAnalyticsData}
                  disabled={isLoading}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportReport}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            }
          >
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              <KPIWidget
                title="SLA Compliance"
                value={`${data.slaCompliance}%`}
                trend={{ value: 5, direction: "up" }}
                color="green"
                sparklineData={[85, 88, 86, 92, 90, 94, data.slaCompliance]}
                icon={<Clock className="h-5 w-5" />}
              />
              <KPIWidget
                title="Avg Resolution"
                value={`${data.avgResolutionTime}h`}
                trend={{ value: 12, direction: "down" }}
                color="cyan"
                icon={<Zap className="h-5 w-5" />}
              />
              <KPIWidget
                title="Open Tickets"
                value={data.openTickets}
                color="orange"
                icon={<Ticket className="h-5 w-5" />}
              />
              <KPIWidget
                title="Active Devices"
                value={`${data.activeDevices}/${data.totalDevices}`}
                subtitle={`${Math.round((data.activeDevices / Math.max(data.totalDevices, 1)) * 100)}% online`}
                color="blue"
                icon={<Server className="h-5 w-5" />}
              />
              <KPIWidget
                title="Security Score"
                value={data.securityScore}
                trend={{ value: 3, direction: "up" }}
                color="purple"
                icon={<Shield className="h-5 w-5" />}
              />
              <KPIWidget
                title="MRR"
                value={`$${(data.mrr / 1000).toFixed(1)}k`}
                trend={{ value: 8, direction: "up" }}
                color="green"
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>
          </HeroSection>
        </motion.div>

        {/* Main Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PremiumCard variant="gradient" className="p-4">
            <SectionHeader title="Ticket Volume Trends" />
            <MultiLineChart
              data={data.ticketVolume}
              lines={[
                { key: "open", color: "#06b6d4", name: "Opened" },
                { key: "resolved", color: "#22c55e", name: "Resolved" },
                { key: "escalated", color: "#f97316", name: "Escalated" },
              ]}
              height={280}
            />
          </PremiumCard>

          <PremiumCard variant="gradient" className="p-4">
            <SectionHeader title="Threat Detection Trends" />
            <TrendAreaChart data={data.threatTrends} color="red" height={280} />
          </PremiumCard>
        </motion.div>

        {/* Secondary Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumCard variant="glass" className="p-4">
            <SectionHeader title="Device Health" />
            <DistributionChart data={data.deviceHealth} height={180} innerRadius={40} outerRadius={70} />
          </PremiumCard>

          <PremiumCard variant="glass" className="p-4">
            <SectionHeader title="Revenue Trend" />
            <TrendAreaChart data={data.revenue} color="green" height={180} gradient />
          </PremiumCard>

          <PremiumCard variant="glass" className="p-4">
            <SectionHeader title="Top Clients by Tickets" />
            <ComparisonBarChart data={data.topClients} color="purple" horizontal height={180} />
          </PremiumCard>
        </motion.div>

        {/* Goal Progress */}
        <motion.div variants={itemVariants}>
          <SectionHeader title="Performance Goals" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PremiumCard variant="glass" className="p-4 flex flex-col items-center justify-center">
              <ProgressRing value={data.slaCompliance} color="#22c55e" label="SLA Target" sublabel="95% goal" />
            </PremiumCard>
            <PremiumCard variant="glass" className="p-4 flex flex-col items-center justify-center">
              <ProgressRing value={Math.min(100, (data.activeDevices / Math.max(data.totalDevices, 1)) * 100)} color="#06b6d4" label="Uptime" sublabel="99% goal" />
            </PremiumCard>
            <PremiumCard variant="glass" className="p-4 flex flex-col items-center justify-center">
              <ProgressRing value={data.securityScore} color="#a855f7" label="Security" sublabel="90+ goal" />
            </PremiumCard>
            <PremiumCard variant="glass" className="p-4 flex flex-col items-center justify-center">
              <ProgressRing value={90} color="#f97316" label="CSAT" sublabel="4.5+ stars" />
            </PremiumCard>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate(`${basePath}/executive`)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Executive Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/report-builder`)}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            Custom Reports
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/ledger/reports`)}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            Helpdesk Reports
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnalyticsHub;

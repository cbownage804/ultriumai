import { Badge } from "@/components/ui/badge";
import { Shield, Search, Bug, AlertTriangle, CheckCircle, TrendingUp, Network, Eye } from "lucide-react";
import { PremiumCard, StatCard } from "./ui/PremiumCard";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SecurityMetrics {
  totalScans: number;
  criticalIssues: number;
  highPriorityIssues: number;
  totalFindings: number;
  agentCount: number;
  onlineAgentCount: number;
}

interface VanguardOverviewProps {
  metrics: SecurityMetrics;
}

// Module card for the overview grid
interface ModuleOverviewCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'yellow' | 'blue' | 'teal';
  stats: Array<{
    label: string;
    value: string | number;
    badge?: boolean;
    badgeVariant?: 'default' | 'destructive' | 'outline';
  }>;
}

const accentStyles = {
  cyan: {
    border: 'border-l-cyan-500',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    glow: 'shadow-cyan-500/10',
  },
  purple: {
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  green: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    glow: 'shadow-green-500/10',
  },
  orange: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    glow: 'shadow-orange-500/10',
  },
  red: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
  yellow: {
    border: 'border-l-yellow-500',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    glow: 'shadow-yellow-500/10',
  },
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  teal: {
    border: 'border-l-teal-500',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    glow: 'shadow-teal-500/10',
  },
};

function ModuleOverviewCard({ icon: Icon, title, description, accentColor, stats }: ModuleOverviewCardProps) {
  const styles = accentStyles[accentColor];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 p-4",
        "border-l-4 transition-all duration-300 hover:shadow-lg",
        styles.border,
        styles.glow
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-lg", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-white/50">{description}</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-xs text-white/60">{stat.label}</span>
            {stat.badge ? (
              <Badge 
                variant={stat.badgeVariant || 'default'}
                className={cn(
                  "text-xs",
                  stat.badgeVariant === 'destructive' && "bg-red-500/20 text-red-400 border-red-500/30",
                  stat.badgeVariant === 'outline' && "bg-transparent border-white/20 text-white/60",
                  !stat.badgeVariant && "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                )}
              >
                {stat.value}
              </Badge>
            ) : (
              <span className="text-xs font-medium text-white/80">{stat.value}</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.02] pointer-events-none" />
    </motion.div>
  );
}

export const VanguardOverview = ({ metrics }: VanguardOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Core Security Metrics - Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Network Agents"
          value={metrics.agentCount}
          subtitle={`${metrics.onlineAgentCount} online`}
          icon={Shield}
          color="green"
          trend={metrics.onlineAgentCount > 0 ? { value: Math.round((metrics.onlineAgentCount / Math.max(metrics.agentCount, 1)) * 100), direction: 'up' } : undefined}
        />
        
        <StatCard
          title="Critical Issues"
          value={metrics.criticalIssues}
          subtitle="Require attention"
          icon={AlertTriangle}
          color="red"
        />
        
        <StatCard
          title="High Priority"
          value={metrics.highPriorityIssues}
          subtitle="High severity findings"
          icon={Bug}
          color="orange"
        />
        
        <StatCard
          title="Total Findings"
          value={metrics.totalFindings}
          subtitle="All severity levels"
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      {/* Security Modules Overview - Premium Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ModuleOverviewCard
          icon={Search}
          title="Threat Detection"
          description="AI-powered vulnerability scanning & analysis"
          accentColor="cyan"
          stats={[
            { label: 'Critical Issues', value: metrics.criticalIssues, badge: true, badgeVariant: 'destructive' },
            { label: 'High Priority', value: metrics.highPriorityIssues, badge: true },
            { label: 'Total Scans', value: metrics.totalScans },
          ]}
        />

        <ModuleOverviewCard
          icon={Eye}
          title="SOC Operations"
          description="24/7 security monitoring & incident response"
          accentColor="blue"
          stats={[
            { label: 'Active Alerts', value: metrics.criticalIssues + metrics.highPriorityIssues, badge: true },
            { label: 'Total Findings', value: metrics.totalFindings },
            { label: 'Scans Completed', value: metrics.totalScans },
          ]}
        />

        <ModuleOverviewCard
          icon={Network}
          title="Network Security"
          description="Internal network scanning & agent monitoring"
          accentColor="purple"
          stats={[
            { label: 'Network Agents', value: `${metrics.onlineAgentCount} Online`, badge: true },
            { label: 'Total Agents', value: metrics.agentCount },
            { label: 'Vulnerabilities', value: metrics.totalFindings },
          ]}
        />

        <ModuleOverviewCard
          icon={CheckCircle}
          title="Compliance"
          description="Regulatory compliance & audit management"
          accentColor="yellow"
          stats={[
            { label: 'Status', value: 'Pending Setup', badge: true, badgeVariant: 'outline' },
            { label: 'Frameworks', value: 'Not configured' },
            { label: 'Controls', value: '—' },
          ]}
        />

        <ModuleOverviewCard
          icon={TrendingUp}
          title="Analytics & Reports"
          description="Security intelligence & executive reporting"
          accentColor="teal"
          stats={[
            { 
              label: 'Risk Score', 
              value: metrics.criticalIssues > 0 ? 'High' : metrics.highPriorityIssues > 0 ? 'Medium' : 'Low', 
              badge: true,
              badgeVariant: metrics.criticalIssues > 0 ? 'destructive' : undefined
            },
            { label: 'Active Issues', value: metrics.criticalIssues + metrics.highPriorityIssues },
            { label: 'Total Scans', value: metrics.totalScans },
          ]}
        />
      </div>
    </div>
  );
};

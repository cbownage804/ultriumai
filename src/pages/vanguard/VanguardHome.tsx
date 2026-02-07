import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Monitor, 
  Target, 
  Eye, 
  FileCheck, 
  BarChart3,
  ArrowRight,
  Activity,
  AlertTriangle,
  Mic,
  Bell,
  Calendar,
  Zap,
  TrendingUp,
  Cpu,
  Network,
  Lock,
  FileSearch,
  Users,
  Settings,
  Database,
  Layers,
  Globe,
  Boxes,
  LineChart,
  Building2,
  Store,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVanguardData } from '@/hooks/useVanguardData';
import { useVanguardAgents } from '@/hooks/useVanguardAgents';
import { getVanguardBasePath } from '@/utils/subdomain';
import { VanguardDataStatus, VanguardEmptyState } from '@/components/vanguard/VanguardEmptyState';
import { ProductTour } from '@/components/onboarding';
import { VANGUARD_HOME_TOUR_STEPS } from '@/config/productTours';
import { HeroSection, StatusIndicator, StatCard, ModuleCard, SectionHeader, PremiumCard } from '@/components/vanguard/ui';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function VanguardHome() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { metrics, isLoading: metricsLoading } = useVanguardData();
  const { agents, isLoading: agentsLoading } = useVanguardAgents();

  useEffect(() => {
    document.title = 'Vanguard | Security Operations Platform';
  }, []);

  const quickStats = [
    {
      title: 'Active Devices',
      value: agents?.filter(a => a.status === 'online').length || 0,
      subtitle: `of ${agents?.length || 0} total`,
      icon: Monitor,
      color: 'cyan' as const,
      trend: { value: 12, direction: 'up' as const },
    },
    {
      title: 'Threats Detected',
      value: metrics?.realTimeThreats || 0,
      subtitle: 'Last 24 hours',
      icon: AlertTriangle,
      color: 'red' as const,
    },
    {
      title: 'Security Score',
      value: `${metrics?.securityScore || 0}%`,
      subtitle: 'Overall health',
      icon: Shield,
      color: 'green' as const,
      trend: { value: 5, direction: 'up' as const },
    },
    {
      title: 'Alerts Today',
      value: metrics?.behavioralAlerts || 0,
      subtitle: 'Pending review',
      icon: Activity,
      color: 'orange' as const,
    },
  ];

  const coreModules = [
    {
      title: 'SOC Dashboard',
      description: 'Real-time security operations center with threat monitoring',
      icon: BarChart3,
      path: `${basePath}/dashboard`,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Device Management',
      description: 'Monitor and manage your Vanguard agents',
      icon: Monitor,
      path: `${basePath}/devices`,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Threat Detection',
      description: 'AI-powered threat detection and analysis',
      icon: Target,
      path: `${basePath}/threats`,
      gradient: 'from-red-500 to-orange-600',
    },
    {
      title: 'SOC Operations',
      description: 'Security operations center management',
      icon: Eye,
      path: `${basePath}/soc`,
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Penetration Testing',
      description: 'Automated vulnerability scanning',
      icon: Lock,
      path: `${basePath}/pentest`,
      gradient: 'from-orange-500 to-amber-600',
    },
    {
      title: 'Compliance Center',
      description: 'Compliance monitoring and reporting',
      icon: FileCheck,
      path: `${basePath}/compliance`,
      gradient: 'from-green-500 to-emerald-600',
    },
  ];

  const advancedModules = [
    { title: 'Analytics Hub', icon: LineChart, path: `${basePath}/analytics`, gradient: 'from-cyan-500 to-blue-600' },
    { title: 'Threat Intelligence', icon: Globe, path: `${basePath}/threat-intel`, gradient: 'from-red-600 to-orange-500' },
    { title: 'User Behavior', icon: Users, path: `${basePath}/user-behavior`, gradient: 'from-violet-500 to-purple-600' },
    { title: 'Dark Web Monitor', icon: Eye, path: `${basePath}/dark-web`, gradient: 'from-gray-700 to-gray-900' },
    { title: 'SIEM Dashboard', icon: Layers, path: `${basePath}/siem`, gradient: 'from-cyan-500 to-blue-600' },
    { title: 'Patch Management', icon: Cpu, path: `${basePath}/patches`, gradient: 'from-emerald-500 to-green-600' },
    { title: 'Backup Monitor', icon: Database, path: `${basePath}/backups`, gradient: 'from-amber-500 to-yellow-600' },
    { title: 'Network Topology', icon: Network, path: `${basePath}/network`, gradient: 'from-indigo-500 to-blue-600' },
    { title: 'Asset Inventory', icon: Boxes, path: `${basePath}/assets`, gradient: 'from-teal-500 to-cyan-600' },
    { title: 'Executive Reports', icon: LineChart, path: `${basePath}/executive`, gradient: 'from-slate-600 to-slate-800' },
    { title: 'Compliance Scorecards', icon: FileSearch, path: `${basePath}/scorecard`, gradient: 'from-lime-500 to-green-600' },
    { title: 'Report Builder', icon: FileCheck, path: `${basePath}/report-builder`, gradient: 'from-pink-500 to-rose-600' },
    { title: 'Multi-Tenant', icon: Building2, path: `${basePath}/tenants`, gradient: 'from-sky-500 to-blue-600' },
    { title: 'API Marketplace', icon: Store, path: `${basePath}/marketplace`, gradient: 'from-fuchsia-500 to-purple-600' },
    { title: 'Incident Playbooks', icon: BookOpen, path: `${basePath}/playbooks`, gradient: 'from-rose-500 to-red-600' },
  ];

  const featuredCapabilities = [
    {
      title: 'AI Voice Assistant',
      description: 'Hands-free ticket management with voice commands',
      icon: Mic,
      path: `${basePath}/helpdesk?tab=voice`,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Push Notifications',
      description: 'Real-time alerts for SLA breaches and escalations',
      icon: Bell,
      path: `${basePath}/helpdesk?tab=notifications`,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Client Portal',
      description: 'Appointment booking and real-time ticket chat',
      icon: Calendar,
      path: `${basePath}/helpdesk?tab=portal`,
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Advanced Automations',
      description: 'Scheduled tasks, webhooks, and workflow triggers',
      icon: Zap,
      path: `${basePath}/helpdesk?tab=automations`,
      gradient: 'from-emerald-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(180,20%,2%)] via-[hsl(180,15%,4%)] to-[hsl(260,20%,5%)]">
      <motion.div 
        className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants}>
          <HeroSection
            title="Welcome to Vanguard"
            subtitle="Your unified security operations platform"
            icon={Shield}
            status={
              <StatusIndicator 
                online={agents?.filter(a => a.status === 'online').length || 0}
                total={agents?.length || 0}
              />
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-tour="quick-stats">
              {quickStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>
          </HeroSection>
        </motion.div>

        {/* Core Modules Grid */}
        <motion.div variants={itemVariants}>
          <SectionHeader title="Security Modules" subtitle="Core platform capabilities" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {coreModules.map((module, index) => {
              const tourId = module.title.toLowerCase().replace(/\s+/g, '-');
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  data-tour={tourId === 'soc-dashboard' ? 'soc-dashboard' : tourId === 'device-management' ? 'devices' : tourId === 'threat-detection' ? 'threat-detection' : undefined}
                >
                  <ModuleCard
                    title={module.title}
                    description={module.description}
                    icon={module.icon}
                    gradient={module.gradient}
                    onClick={() => navigate(module.path)}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Featured Capabilities */}
        <motion.div variants={itemVariants}>
          <SectionHeader title="Featured Capabilities" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featuredCapabilities.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 * index }}
              >
                <ModuleCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  gradient={feature.gradient}
                  onClick={() => navigate(feature.path)}
                  badge={undefined}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Advanced Features Grid */}
        <motion.div variants={itemVariants} data-tour="advanced-features">
          <SectionHeader title="Advanced Features" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 md:gap-3">
            {advancedModules.map((module, index) => (
              <PremiumCard
                key={index}
                variant="glass"
                hoverEffect="glow"
                className="cursor-pointer group p-3"
                onClick={() => navigate(module.path)}
              >
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${module.gradient} mb-2 group-hover:shadow-glow transition-shadow`} />
                <div className="flex items-center gap-2">
                  <module.icon className="h-4 w-4 text-white/70 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors truncate">
                    {module.title}
                  </span>
                </div>
              </PremiumCard>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 md:gap-4"
        >
          <Button 
            onClick={() => navigate(`${basePath}/setup`)} 
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/25"
          >
            <Monitor className="h-4 w-4 mr-2" />
            Add New Device
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`${basePath}/dashboard`)} 
            className="w-full sm:w-auto border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Full Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Product Tour */}
        <ProductTour 
          tourId="vanguard-intro" 
          steps={VANGUARD_HOME_TOUR_STEPS}
          autoStart={true}
        />
      </motion.div>
    </div>
  );
}

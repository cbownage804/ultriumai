import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVanguardData } from '@/hooks/useVanguardData';
import { useVanguardAgents } from '@/hooks/useVanguardAgents';
import { getVanguardBasePath } from '@/utils/subdomain';
import { VanguardDataStatus, VanguardEmptyState } from '@/components/vanguard/VanguardEmptyState';
import { ProductTour } from '@/components/onboarding';
import { VANGUARD_TOUR_STEPS } from '@/config/productTours';


export default function VanguardHome() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { metrics, isLoading: metricsLoading } = useVanguardData();
  const { agents, isLoading: agentsLoading } = useVanguardAgents();

  useEffect(() => {
    document.title = 'Ultrium Vanguard | Security Platform';
  }, []);

  const quickStats = [
    {
      title: 'Active Devices',
      value: agents?.filter(a => a.status === 'online').length || 0,
      total: agents?.length || 0,
      icon: Monitor,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Threats Detected',
      value: metrics?.realTimeThreats || 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Security Score',
      value: `${metrics?.securityScore || 0}%`,
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Alerts Today',
      value: metrics?.behavioralAlerts || 0,
      icon: Activity,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  const modules = [
    {
      title: 'Dashboard',
      description: 'Overview of your security posture and real-time metrics',
      icon: BarChart3,
      path: `${basePath}/dashboard`,
      color: 'from-primary to-primary/70'
    },
    {
      title: 'Devices',
      description: 'Manage and monitor your Vanguard agents',
      icon: Monitor,
      path: `${basePath}/devices`,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Threat Detection',
      description: 'AI-powered threat detection and analysis',
      icon: Target,
      path: `${basePath}/threats`,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'SOC Operations',
      description: 'Security operations center management',
      icon: Eye,
      path: `${basePath}/soc`,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Penetration Testing',
      description: 'Automated vulnerability scanning and pen testing',
      icon: Shield,
      path: `${basePath}/pentest`,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Compliance',
      description: 'Compliance monitoring and reporting',
      icon: FileCheck,
      path: `${basePath}/compliance`,
      color: 'from-green-500 to-green-600'
    }
  ];

  const advancedModules = [
    {
      title: 'Threat Intelligence',
      description: 'Real-time threat feeds and IOC lookups',
      path: `${basePath}/threat-intel`,
      color: 'from-red-600 to-orange-500'
    },
    {
      title: 'User Behavior Analytics',
      description: 'Detect anomalous user activities',
      path: `${basePath}/user-behavior`,
      color: 'from-violet-500 to-purple-600'
    },
    {
      title: 'Dark Web Monitoring',
      description: 'Monitor for leaked credentials and data',
      path: `${basePath}/dark-web`,
      color: 'from-gray-800 to-gray-900'
    },
    {
      title: 'SIEM Dashboard',
      description: 'Security event log aggregation',
      path: `${basePath}/siem`,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      title: 'Patch Management',
      description: 'Track and deploy security patches',
      path: `${basePath}/patches`,
      color: 'from-emerald-500 to-green-600'
    },
    {
      title: 'Backup Monitoring',
      description: 'Ensure backup integrity and compliance',
      path: `${basePath}/backups`,
      color: 'from-amber-500 to-yellow-600'
    },
    {
      title: 'Network Topology',
      description: 'Visualize your network infrastructure',
      path: `${basePath}/network`,
      color: 'from-indigo-500 to-blue-600'
    },
    {
      title: 'Asset Inventory',
      description: 'Complete asset management and tracking',
      path: `${basePath}/assets`,
      color: 'from-teal-500 to-cyan-600'
    },
    {
      title: 'Executive Dashboard',
      description: 'High-level security metrics for leadership',
      path: `${basePath}/executive`,
      color: 'from-slate-600 to-slate-800'
    },
    {
      title: 'Compliance Scorecards',
      description: 'Track compliance across frameworks',
      path: `${basePath}/scorecard`,
      color: 'from-lime-500 to-green-600'
    },
    {
      title: 'Report Builder',
      description: 'Create custom security reports',
      path: `${basePath}/report-builder`,
      color: 'from-pink-500 to-rose-600'
    },
    {
      title: 'Multi-Tenant Management',
      description: 'Manage multiple client environments',
      path: `${basePath}/tenants`,
      color: 'from-sky-500 to-blue-600'
    },
    {
      title: 'API Marketplace',
      description: 'Integrate with security tools and APIs',
      path: `${basePath}/marketplace`,
      color: 'from-fuchsia-500 to-purple-600'
    },
    {
      title: 'Incident Playbooks',
      description: 'Automated incident response workflows',
      path: `${basePath}/playbooks`,
      color: 'from-rose-500 to-red-600'
    }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border p-4 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold">Welcome to Vanguard</h1>
                <p className="text-sm md:text-base text-muted-foreground">Your unified security operations platform</p>
              </div>
            </div>
            <VanguardDataStatus 
              hasAgents={agents.length > 0}
              onlineAgents={agents.filter(a => a.status === 'online').length}
              totalAgents={agents.length}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4 md:mt-6" data-tour="quick-stats">
            {quickStats.map((stat, index) => (
              <Card key={index} className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Security Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {modules.map((module, index) => {
            const tourId = module.title.toLowerCase().replace(/\s+/g, '-');
            return (
              <Card 
                key={index} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(module.path)}
                data-tour={tourId === 'dashboard' ? 'soc-dashboard' : tourId === 'devices' ? 'devices' : tourId === 'threat-detection' ? 'threat-detection' : undefined}
              >
                <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                  <div className={`inline-flex p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${module.color} w-fit mb-1 md:mb-2`}>
                    <module.icon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                  </div>
                  <CardTitle className="text-sm md:text-lg flex items-center justify-between">
                    <span className="line-clamp-1">{module.title}</span>
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm line-clamp-2">{module.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Advanced Modules Grid */}
      <div data-tour="advanced-features">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Advanced Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {advancedModules.map((module, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
                <div className={`h-2 rounded-full bg-gradient-to-r ${module.color} mb-2`} />
                <CardTitle className="text-sm md:text-base flex items-center justify-between">
                  <span className="line-clamp-1">{module.title}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <Button onClick={() => navigate(`${basePath}/setup`)} className="w-full sm:w-auto">
          <Monitor className="h-4 w-4 mr-2" />
          Add New Device
        </Button>
        <Button variant="outline" onClick={() => navigate(`${basePath}/dashboard`)} className="w-full sm:w-auto">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Full Dashboard
        </Button>
      </div>

      {/* Product Tour */}
      <ProductTour 
        tourId="vanguard-intro" 
        steps={VANGUARD_TOUR_STEPS}
        autoStart={true}
      />
    </div>
  );
}

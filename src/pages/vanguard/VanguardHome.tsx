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

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Welcome to Vanguard</h1>
              <p className="text-muted-foreground">Your unified security operations platform</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {quickStats.map((stat, index) => (
              <Card key={index} className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Security Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-3">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${module.color} w-fit mb-2`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg flex items-center justify-between">
                  {module.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => navigate(`${basePath}/setup`)}>
          <Monitor className="h-4 w-4 mr-2" />
          Add New Device
        </Button>
        <Button variant="outline" onClick={() => navigate(`${basePath}/dashboard`)}>
          <BarChart3 className="h-4 w-4 mr-2" />
          View Full Dashboard
        </Button>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, FileText, Shield, Calendar, GitBranch, Ticket,
  ArrowRight, Building2, Server, BookOpen, Monitor, Sparkles, Brain,
  ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { getVanguardBasePath } from '@/utils/subdomain';

const reportCategories = [
  {
    title: 'Executive Summary',
    description: 'AI-generated cross-module executive report with insights and recommendations',
    icon: Brain,
    path: '/executive-report',
    badge: 'AI Enhanced',
    color: 'purple',
    module: 'All Modules',
  },
  {
    title: 'Helpdesk Reports',
    description: 'Ticket volume, SLA compliance, resolution times, and technician performance',
    icon: Ticket,
    path: '/helpdesk-reports',
    badge: null,
    color: 'indigo',
    module: 'Response',
  },
  {
    title: 'Compliance Reports',
    description: 'Framework compliance from Comply — SOC 2, HIPAA, ISO 27001, evidence status',
    icon: ClipboardCheck,
    path: '/compliance-reports',
    badge: 'AI Enhanced',
    color: 'emerald',
    module: 'Comply',
  },
  {
    title: 'Security Analytics',
    description: 'Threat intelligence, vulnerability findings, and security posture from Pursuit & Recon',
    icon: Shield,
    path: '/security-reports',
    badge: null,
    color: 'red',
    module: 'Pursuit / Recon',
  },
  {
    title: 'SaaS Security Reports',
    description: 'M365 & Google Workspace alert trends, risky users, and SaaS posture from Sentinel',
    icon: AlertTriangle,
    path: '/sentinel-reports',
    badge: 'AI Enhanced',
    color: 'amber',
    module: 'Sentinel',
  },
  {
    title: 'Fleet & RMM Reports',
    description: 'Device health, patch compliance, agent status, and endpoint metrics from Horizon',
    icon: Monitor,
    path: '/fleet-reports',
    badge: null,
    color: 'cyan',
    module: 'Horizon',
  },
  {
    title: 'Documentation Reports',
    description: 'Atlas documentation coverage, gaps, staleness analysis, and audit trail',
    icon: BookOpen,
    path: '/atlas-reports',
    badge: 'AI Enhanced',
    color: 'teal',
    module: 'Atlas',
  },
  {
    title: 'Attack Path Visualization',
    description: 'Analyze potential attack vectors and exposure chains',
    icon: GitBranch,
    path: '/attack-paths',
    badge: 'Advanced',
    color: 'red',
    module: 'Pursuit',
  },
  {
    title: 'Advanced Analytics',
    description: 'KPI tracking, trend analysis, cross-module performance dashboards',
    icon: BarChart3,
    path: '/advanced-analytics',
    badge: null,
    color: 'blue',
    module: 'All Modules',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
};

export default function VanguardReports() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

  useEffect(() => {
    document.title = 'Reports | Vanguard Ledger';
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20">
          <ModuleLogo module="ledger" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Ledger</h1>
          <p className="text-muted-foreground">Unified reporting across all Vanguard modules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCategories.map((category) => {
          const colors = colorClasses[category.color] || colorClasses.cyan;
          return (
            <Card 
              key={category.title}
              className={`bg-black/40 border ${colors.border} hover:border-opacity-60 transition-all duration-200 cursor-pointer group`}
              onClick={() => navigate(`${basePath}${category.path}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <category.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">
                      {category.module}
                    </Badge>
                    {category.badge && (
                      <Badge variant="outline" className={`${colors.border} ${colors.text} text-[10px]`}>
                        {category.badge === 'AI Enhanced' && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
                        {category.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg text-foreground group-hover:text-cyan-300 transition-colors">
                  {category.title}
                </CardTitle>
                <CardDescription>
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className={`w-full justify-between ${colors.text}`}>
                  Open Report
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

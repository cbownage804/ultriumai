import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Shield, 
  Calendar,
  GitBranch,
  Ticket,
  ArrowRight
} from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { getVanguardBasePath } from '@/utils/subdomain';

const reportCategories = [
  {
    title: 'Helpdesk Reports',
    description: 'Ticket volume, SLA compliance, and technician performance',
    icon: Ticket,
    path: '/helpdesk-reports',
    badge: null,
    color: 'purple'
  },
  {
    title: 'Security Analytics',
    description: 'Security posture and threat intelligence reporting',
    icon: Shield,
    path: '/security-reports',
    badge: null,
    color: 'cyan'
  },
  {
    title: 'Scheduled Scans',
    description: 'Manage automated scanning schedules',
    icon: Calendar,
    path: '/scheduled-scans',
    badge: null,
    color: 'amber'
  },
  {
    title: 'Compliance Reports',
    description: 'Generate compliance and audit reports',
    icon: FileText,
    path: '/compliance-reports',
    badge: null,
    color: 'emerald'
  },
  {
    title: 'Attack Path Visualization',
    description: 'Analyze potential attack vectors and exposure',
    icon: GitBranch,
    path: '/attack-paths',
    badge: 'Advanced',
    color: 'red'
  },
];

export default function VanguardReports() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

  useEffect(() => {
    document.title = 'Reports | Vanguard Ledger';
  }, []);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
      cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
      amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
      emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20">
          <ModuleLogo module="ledger" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Ledger</h1>
          <p className="text-slate-400">Compliance, reporting, and audit trails</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCategories.map((category) => {
          const colors = getColorClasses(category.color);
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
                  {category.badge && (
                    <Badge variant="outline" className={`${colors.border} ${colors.text} text-xs`}>
                      {category.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg text-white group-hover:text-cyan-300 transition-colors">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-between ${colors.text} hover:${colors.bg}`}
                >
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

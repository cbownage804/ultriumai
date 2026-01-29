import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Bug,
  Wifi,
  Settings,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EndpointCompliance {
  id: string;
  hostname: string;
  os: string;
  overallScore: number;
  cisScore: number;
  encryptionStatus: 'encrypted' | 'partial' | 'not_encrypted';
  avStatus: 'active' | 'outdated' | 'disabled';
  firewallStatus: 'enabled' | 'disabled' | 'partial';
  patchScore: number;
  lastScan?: string;
  complianceChecks: any[];
}

function ScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { svg: 'w-16 h-16', text: 'text-lg', stroke: '6', r: '28' },
    md: { svg: 'w-24 h-24', text: 'text-2xl', stroke: '8', r: '40' },
    lg: { svg: 'w-32 h-32', text: 'text-3xl', stroke: '10', r: '56' },
  };
  const s = sizes[size];
  const circumference = 2 * Math.PI * parseInt(s.r);
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex">
      <svg className={cn(s.svg, 'transform -rotate-90')}>
        <circle
          cx="50%"
          cy="50%"
          r={s.r}
          stroke="currentColor"
          strokeWidth={s.stroke}
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx="50%"
          cy="50%"
          r={s.r}
          stroke="currentColor"
          strokeWidth={s.stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            score >= 80 ? 'text-green-500' :
            score >= 60 ? 'text-yellow-500' : 'text-red-500'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(s.text, 'font-bold')}>{score}%</span>
      </div>
    </div>
  );
}

export function EndpointComplianceDashboard() {
  const { user } = useAuth();
  const [endpoints, setEndpoints] = useState<EndpointCompliance[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointCompliance | null>(null);
  const [periodFilter, setPeriodFilter] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEndpoints();
    }
  }, [user]);

  const loadEndpoints = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_endpoint_compliance')
        .select('*')
        .eq('user_id', user.id)
        .order('overall_score', { ascending: true });

      if (error) throw error;

      if (data) {
        setEndpoints(data.map((e: any) => ({
          id: e.id,
          hostname: e.hostname,
          os: e.os || 'Unknown',
          overallScore: e.overall_score || 0,
          cisScore: e.cis_score || 0,
          encryptionStatus: e.encryption_status || 'not_encrypted',
          avStatus: e.av_status || 'disabled',
          firewallStatus: e.firewall_status || 'disabled',
          patchScore: e.patch_score || 0,
          lastScan: e.last_scan_at,
          complianceChecks: e.compliance_checks || []
        })));
      }
    } catch (error) {
      console.error('Error loading endpoints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate fleet-wide stats
  const avgScore = endpoints.length > 0 
    ? Math.round(endpoints.reduce((sum, e) => sum + e.overallScore, 0) / endpoints.length)
    : 0;
  const avgCisScore = endpoints.length > 0
    ? Math.round(endpoints.reduce((sum, e) => sum + e.cisScore, 0) / endpoints.length)
    : 0;
  const encryptedCount = endpoints.filter(e => e.encryptionStatus === 'encrypted').length;
  const avActiveCount = endpoints.filter(e => e.avStatus === 'active').length;
  const firewallEnabledCount = endpoints.filter(e => e.firewallStatus === 'enabled').length;
  const criticalCount = endpoints.filter(e => e.overallScore < 50).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4 text-center">
            <ScoreGauge score={avgScore} size="sm" />
            <p className="text-xs text-muted-foreground mt-2">Fleet Score</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4 text-center">
            <ScoreGauge score={avgCisScore} size="sm" />
            <p className="text-xs text-muted-foreground mt-2">CIS Benchmark</p>
          </CardContent>
        </Card>

        <Card className={cn(
          encryptedCount === endpoints.length && endpoints.length > 0
            ? "border-green-500/30 bg-green-500/5" 
            : "border-yellow-500/30 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{encryptedCount}/{endpoints.length}</p>
                <p className="text-xs text-muted-foreground">Encrypted</p>
              </div>
              <Lock className="h-6 w-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          avActiveCount === endpoints.length && endpoints.length > 0
            ? "border-green-500/30 bg-green-500/5" 
            : "border-yellow-500/30 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{avActiveCount}/{endpoints.length}</p>
                <p className="text-xs text-muted-foreground">AV Active</p>
              </div>
              <Bug className="h-6 w-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          firewallEnabledCount === endpoints.length && endpoints.length > 0
            ? "border-green-500/30 bg-green-500/5" 
            : "border-yellow-500/30 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{firewallEnabledCount}/{endpoints.length}</p>
                <p className="text-xs text-muted-foreground">Firewall On</p>
              </div>
              <Wifi className="h-6 w-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-500" />
                Endpoint Compliance
              </CardTitle>
              <CardDescription>Security posture across your fleet</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>OS</TableHead>
                <TableHead className="text-center">Overall</TableHead>
                <TableHead className="text-center">CIS</TableHead>
                <TableHead className="text-center">Encryption</TableHead>
                <TableHead className="text-center">Antivirus</TableHead>
                <TableHead className="text-center">Firewall</TableHead>
                <TableHead className="text-center">Patches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No endpoint compliance data yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map(endpoint => (
                  <TableRow 
                    key={endpoint.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <TableCell className="font-medium">{endpoint.hostname}</TableCell>
                    <TableCell className="text-muted-foreground">{endpoint.os}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "font-bold",
                        endpoint.overallScore >= 80 ? "bg-green-500/20 text-green-500" :
                        endpoint.overallScore >= 60 ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-red-500/20 text-red-500"
                      )}>
                        {endpoint.overallScore}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{endpoint.cisScore}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {endpoint.encryptionStatus === 'encrypted' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : endpoint.encryptionStatus === 'partial' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {endpoint.avStatus === 'active' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : endpoint.avStatus === 'outdated' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {endpoint.firewallStatus === 'enabled' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : endpoint.firewallStatus === 'partial' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{endpoint.patchScore}%</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
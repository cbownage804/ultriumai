import { useState } from 'react';
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
  ShieldX,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  FileText,
  Zap,
  Monitor,
  HardDrive,
  Wifi,
  Bug
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '@/lib/utils';

interface ComplianceCheck {
  id: string;
  name: string;
  category: 'encryption' | 'antivirus' | 'firewall' | 'updates' | 'policy' | 'cis';
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  details: string;
  lastChecked: string;
  remediationLink?: string;
}

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
  lastScan: string;
  checks: ComplianceCheck[];
}

interface TrendData {
  date: string;
  score: number;
  passed: number;
  failed: number;
}

// Mock data
const mockEndpoints: EndpointCompliance[] = [
  {
    id: '1',
    hostname: 'WS-ADMIN-001',
    os: 'Windows 11 Pro',
    overallScore: 92,
    cisScore: 88,
    encryptionStatus: 'encrypted',
    avStatus: 'active',
    firewallStatus: 'enabled',
    patchScore: 95,
    lastScan: '2024-01-15T10:30:00Z',
    checks: [
      { id: '1', name: 'BitLocker Encryption', category: 'encryption', status: 'pass', details: 'All drives encrypted with AES-256', lastChecked: '2024-01-15T10:30:00Z' },
      { id: '2', name: 'Windows Defender Active', category: 'antivirus', status: 'pass', details: 'Real-time protection enabled', lastChecked: '2024-01-15T10:30:00Z' },
      { id: '3', name: 'Windows Firewall', category: 'firewall', status: 'pass', details: 'All profiles enabled', lastChecked: '2024-01-15T10:30:00Z' },
      { id: '4', name: 'Windows Update Current', category: 'updates', status: 'pass', details: 'Last updated 2 days ago', lastChecked: '2024-01-15T10:30:00Z' },
      { id: '5', name: 'Password Policy', category: 'policy', status: 'pass', details: 'Meets complexity requirements', lastChecked: '2024-01-15T10:30:00Z' },
      { id: '6', name: 'CIS L1 - Account Lockout', category: 'cis', status: 'warning', details: 'Lockout threshold not configured', lastChecked: '2024-01-15T10:30:00Z', remediationLink: '#' },
    ],
  },
  {
    id: '2',
    hostname: 'WS-DEV-002',
    os: 'Windows 11 Pro',
    overallScore: 68,
    cisScore: 62,
    encryptionStatus: 'partial',
    avStatus: 'outdated',
    firewallStatus: 'enabled',
    patchScore: 72,
    lastScan: '2024-01-15T09:15:00Z',
    checks: [
      { id: '1', name: 'BitLocker Encryption', category: 'encryption', status: 'warning', details: 'Only C: drive encrypted', lastChecked: '2024-01-15T09:15:00Z', remediationLink: '#' },
      { id: '2', name: 'Windows Defender Active', category: 'antivirus', status: 'warning', details: 'Definitions outdated (7 days)', lastChecked: '2024-01-15T09:15:00Z', remediationLink: '#' },
      { id: '3', name: 'Windows Firewall', category: 'firewall', status: 'pass', details: 'All profiles enabled', lastChecked: '2024-01-15T09:15:00Z' },
      { id: '4', name: 'Windows Update Current', category: 'updates', status: 'fail', details: '5 updates pending (2 critical)', lastChecked: '2024-01-15T09:15:00Z', remediationLink: '#' },
      { id: '5', name: 'CIS L1 - UAC Settings', category: 'cis', status: 'fail', details: 'UAC disabled', lastChecked: '2024-01-15T09:15:00Z', remediationLink: '#' },
    ],
  },
  {
    id: '3',
    hostname: 'SRV-DC-001',
    os: 'Windows Server 2022',
    overallScore: 95,
    cisScore: 94,
    encryptionStatus: 'encrypted',
    avStatus: 'active',
    firewallStatus: 'enabled',
    patchScore: 98,
    lastScan: '2024-01-15T08:00:00Z',
    checks: [
      { id: '1', name: 'BitLocker Encryption', category: 'encryption', status: 'pass', details: 'All drives encrypted', lastChecked: '2024-01-15T08:00:00Z' },
      { id: '2', name: 'Windows Defender Active', category: 'antivirus', status: 'pass', details: 'Real-time protection enabled', lastChecked: '2024-01-15T08:00:00Z' },
      { id: '3', name: 'Windows Firewall', category: 'firewall', status: 'pass', details: 'Domain profile active', lastChecked: '2024-01-15T08:00:00Z' },
      { id: '4', name: 'Windows Update Current', category: 'updates', status: 'pass', details: 'Fully patched', lastChecked: '2024-01-15T08:00:00Z' },
      { id: '5', name: 'CIS L2 - Audit Policies', category: 'cis', status: 'pass', details: 'All audit policies configured', lastChecked: '2024-01-15T08:00:00Z' },
    ],
  },
  {
    id: '4',
    hostname: 'WS-SALES-003',
    os: 'Windows 10 Pro',
    overallScore: 45,
    cisScore: 38,
    encryptionStatus: 'not_encrypted',
    avStatus: 'disabled',
    firewallStatus: 'disabled',
    patchScore: 52,
    lastScan: '2024-01-14T16:45:00Z',
    checks: [
      { id: '1', name: 'BitLocker Encryption', category: 'encryption', status: 'fail', details: 'No encryption enabled', lastChecked: '2024-01-14T16:45:00Z', remediationLink: '#' },
      { id: '2', name: 'Windows Defender Active', category: 'antivirus', status: 'fail', details: 'Antivirus disabled', lastChecked: '2024-01-14T16:45:00Z', remediationLink: '#' },
      { id: '3', name: 'Windows Firewall', category: 'firewall', status: 'fail', details: 'All profiles disabled', lastChecked: '2024-01-14T16:45:00Z', remediationLink: '#' },
      { id: '4', name: 'Windows Update Current', category: 'updates', status: 'fail', details: '12 updates pending', lastChecked: '2024-01-14T16:45:00Z', remediationLink: '#' },
      { id: '5', name: 'CIS L1 - Remote Desktop', category: 'cis', status: 'fail', details: 'RDP exposed without NLA', lastChecked: '2024-01-14T16:45:00Z', remediationLink: '#' },
    ],
  },
];

const mockTrendData: TrendData[] = [
  { date: 'Dec 15', score: 72, passed: 45, failed: 18 },
  { date: 'Dec 22', score: 74, passed: 47, failed: 16 },
  { date: 'Dec 29', score: 71, passed: 44, failed: 19 },
  { date: 'Jan 5', score: 76, passed: 48, failed: 15 },
  { date: 'Jan 12', score: 78, passed: 50, failed: 13 },
  { date: 'Jan 15', score: 75, passed: 48, failed: 15 },
];

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
  const [endpoints] = useState<EndpointCompliance[]>(mockEndpoints);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointCompliance | null>(null);
  const [periodFilter, setPeriodFilter] = useState('30');

  // Calculate fleet-wide stats
  const avgScore = Math.round(endpoints.reduce((sum, e) => sum + e.overallScore, 0) / endpoints.length);
  const avgCisScore = Math.round(endpoints.reduce((sum, e) => sum + e.cisScore, 0) / endpoints.length);
  const encryptedCount = endpoints.filter(e => e.encryptionStatus === 'encrypted').length;
  const avActiveCount = endpoints.filter(e => e.avStatus === 'active').length;
  const firewallEnabledCount = endpoints.filter(e => e.firewallStatus === 'enabled').length;
  const criticalCount = endpoints.filter(e => e.overallScore < 50).length;

  const categoryIcons = {
    encryption: Lock,
    antivirus: Bug,
    firewall: Wifi,
    updates: RefreshCw,
    policy: Settings,
    cis: Shield,
  };

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
          encryptedCount === endpoints.length 
            ? "border-green-500/30 bg-green-500/5" 
            : "border-yellow-500/30 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{encryptedCount}/{endpoints.length}</p>
                <p className="text-xs text-muted-foreground">Encrypted</p>
              </div>
              <Lock className={cn(
                "h-6 w-6",
                encryptedCount === endpoints.length ? "text-green-500" : "text-yellow-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          avActiveCount === endpoints.length 
            ? "border-green-500/30 bg-green-500/5" 
            : "border-yellow-500/30 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{avActiveCount}/{endpoints.length}</p>
                <p className="text-xs text-muted-foreground">AV Active</p>
              </div>
              <ShieldCheck className={cn(
                "h-6 w-6",
                avActiveCount === endpoints.length ? "text-green-500" : "text-yellow-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          firewallEnabledCount === endpoints.length 
            ? "border-green-500/30 bg-green-500/5" 
            : "border-yellow-500/30 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{firewallEnabledCount}/{endpoints.length}</p>
                <p className="text-xs text-muted-foreground">Firewall On</p>
              </div>
              <Wifi className={cn(
                "h-6 w-6",
                firewallEnabledCount === endpoints.length ? "text-green-500" : "text-yellow-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          criticalCount > 0 
            ? "border-red-500/30 bg-red-500/5" 
            : "border-green-500/30 bg-green-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
              <AlertTriangle className={cn(
                "h-6 w-6",
                criticalCount > 0 ? "text-red-500" : "text-green-500"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compliance Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-500" />
                  Endpoint Compliance Status
                </CardTitle>
                <CardDescription>Click a device for detailed breakdown</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>CIS</TableHead>
                  <TableHead>Encryption</TableHead>
                  <TableHead>AV</TableHead>
                  <TableHead>Firewall</TableHead>
                  <TableHead>Patches</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map(endpoint => (
                  <TableRow 
                    key={endpoint.id} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedEndpoint?.id === endpoint.id && "bg-muted/50"
                    )}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{endpoint.hostname}</p>
                          <p className="text-xs text-muted-foreground">{endpoint.os}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-lg font-bold",
                          endpoint.overallScore >= 80 ? "text-green-500" :
                          endpoint.overallScore >= 60 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {endpoint.overallScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={endpoint.cisScore >= 80 ? 'default' : endpoint.cisScore >= 60 ? 'secondary' : 'destructive'}>
                        {endpoint.cisScore}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {endpoint.encryptionStatus === 'encrypted' ? (
                        <Lock className="h-5 w-5 text-green-500" />
                      ) : endpoint.encryptionStatus === 'partial' ? (
                        <Lock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Unlock className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {endpoint.avStatus === 'active' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : endpoint.avStatus === 'outdated' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {endpoint.firewallStatus === 'enabled' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : endpoint.firewallStatus === 'partial' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <Progress 
                          value={endpoint.patchScore} 
                          className={cn(
                            "h-2",
                            endpoint.patchScore >= 90 ? "[&>div]:bg-green-500" :
                            endpoint.patchScore >= 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                          )} 
                        />
                        <p className="text-xs text-muted-foreground text-right mt-1">{endpoint.patchScore}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                        <Zap className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Device Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-500" />
              {selectedEndpoint ? selectedEndpoint.hostname : 'Device Details'}
            </CardTitle>
            {selectedEndpoint && (
              <CardDescription>{selectedEndpoint.os}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedEndpoint ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ScoreGauge score={selectedEndpoint.overallScore} size="lg" />
                </div>

                <div className="space-y-3">
                  {selectedEndpoint.checks.map(check => {
                    const Icon = categoryIcons[check.category];
                    return (
                      <div 
                        key={check.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          check.status === 'pass' && "border-green-500/30 bg-green-500/5",
                          check.status === 'warning' && "border-yellow-500/30 bg-yellow-500/5",
                          check.status === 'fail' && "border-red-500/30 bg-red-500/5",
                          check.status === 'unknown' && "border-muted"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <Icon className={cn(
                              "h-4 w-4 mt-0.5",
                              check.status === 'pass' && "text-green-500",
                              check.status === 'warning' && "text-yellow-500",
                              check.status === 'fail' && "text-red-500",
                              check.status === 'unknown' && "text-muted-foreground"
                            )} />
                            <div>
                              <p className="text-sm font-medium">{check.name}</p>
                              <p className="text-xs text-muted-foreground">{check.details}</p>
                            </div>
                          </div>
                          {check.status === 'pass' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : check.status === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : check.status === 'fail' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : null}
                        </div>
                        {check.remediationLink && check.status !== 'pass' && (
                          <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-xs">
                            View Remediation Steps →
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Remediate
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rescan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a device to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
                Compliance Trends
              </CardTitle>
              <CardDescription>Fleet-wide compliance score over time</CardDescription>
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#scoreGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Non-Compliant Alerts */}
      {criticalCount > 0 && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="h-5 w-5" />
              Non-Compliant Devices Requiring Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {endpoints.filter(e => e.overallScore < 50).map(endpoint => (
                <div 
                  key={endpoint.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/10"
                >
                  <div className="flex items-center gap-3">
                    <ShieldX className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{endpoint.hostname}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {endpoint.overallScore}% • {endpoint.checks.filter(c => c.status === 'fail').length} failed checks
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedEndpoint(endpoint)}>
                      View Details
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Zap className="h-4 w-4 mr-2" />
                      Remediate Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

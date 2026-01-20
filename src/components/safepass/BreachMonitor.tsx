import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSafePass } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Eye,
  Loader2,
  Search,
  Lock,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface BreachScan {
  id: string;
  scan_type: string;
  total_entries_scanned: number;
  compromised_count: number;
  weak_count: number;
  reused_count: number;
  overall_score: number;
  scan_results: any;
  completed_at: string;
}

interface ScanResult {
  entryId: string;
  title: string;
  issues: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export const BreachMonitor = () => {
  const { user } = useAuth();
  const { entries, getEntryPassword } = useSafePass();
  const { isUnlocked } = useMasterPassword();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<BreachScan | null>(null);
  const [scanHistory, setScanHistory] = useState<BreachScan[]>([]);
  const [currentResults, setCurrentResults] = useState<ScanResult[]>([]);

  const loadScanHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_breach_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setScanHistory(data || []);
      if (data && data.length > 0) {
        setLastScan(data[0]);
        const scanResults = data[0].scan_results as { results?: ScanResult[] } | null;
        if (scanResults?.results) {
          setCurrentResults(scanResults.results);
        }
      }
    } catch (error) {
      console.error('Failed to load scan history');
    }
  }, [user]);

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  const runBreachScan = async () => {
    if (!user || !isUnlocked || entries.length === 0) {
      toast.error('Unlock vault and add passwords first');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    const results: ScanResult[] = [];
    const passwordMap = new Map<string, string[]>();

    try {
      // Analyze each password
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        setScanProgress(Math.round(((i + 1) / entries.length) * 100));

        const password = await getEntryPassword(entry);
        if (password === '[Locked]' || password === '[Decryption Error]') continue;

        const issues: string[] = [];
        let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

        // Check password strength
        const strength = entry.password_strength_score;
        if (strength < 40) {
          issues.push('Very weak password');
          severity = 'critical';
        } else if (strength < 60) {
          issues.push('Weak password');
          severity = severity === 'low' ? 'high' : severity;
        }

        // Check for password reuse
        const existingEntries = passwordMap.get(password);
        if (existingEntries) {
          issues.push(`Reused across ${existingEntries.length + 1} accounts`);
          if (severity !== 'critical') severity = 'high';
          existingEntries.push(entry.title);
        } else {
          passwordMap.set(password, [entry.title]);
        }

        // Check password age (simulated - would need actual change date)
        const createdAt = new Date(entry.created_at);
        const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated > 180) {
          issues.push('Password older than 6 months');
          if (severity === 'low') severity = 'medium';
        }

        // Check common patterns
        if (/^[a-z]+$/.test(password) || /^[0-9]+$/.test(password)) {
          issues.push('Uses only single character type');
          if (severity !== 'critical') severity = 'high';
        }

        if (issues.length > 0) {
          results.push({
            entryId: entry.id,
            title: entry.title,
            issues,
            severity
          });
        }
      }

      // Calculate statistics
      const compromisedCount = results.filter(r => r.severity === 'critical').length;
      const weakCount = results.filter(r => r.issues.some(i => i.includes('weak'))).length;
      const reusedCount = results.filter(r => r.issues.some(i => i.includes('Reused'))).length;
      const overallScore = entries.length > 0 
        ? Math.max(0, 100 - Math.round((results.length / entries.length) * 100))
        : 100;

      // Save scan results
      const { error } = await supabase
        .from('safepass_breach_scans')
        .insert([{
          user_id: user.id,
          scan_type: 'manual',
          total_entries_scanned: entries.length,
          compromised_count: compromisedCount,
          weak_count: weakCount,
          reused_count: reusedCount,
          overall_score: overallScore,
          scan_results: { results } as any
        }]);

      if (error) throw error;

      setCurrentResults(results);
      toast.success('Security scan complete');
      loadScanHistory();
    } catch (error) {
      console.error('Scan failed');
      toast.error('Scan failed');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Vault Locked</h3>
        <p className="text-muted-foreground">
          Unlock your vault to run security scans
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Breach Monitor</h2>
          <p className="text-muted-foreground">
            Scan your passwords for security vulnerabilities
          </p>
        </div>
        <Button 
          onClick={runBreachScan} 
          disabled={isScanning || entries.length === 0}
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Run Security Scan
            </>
          )}
        </Button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analyzing passwords...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-4xl font-bold ${getScoreColor(lastScan?.overall_score || 100)}`}>
              {lastScan?.overall_score || 100}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">Security Score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{lastScan?.compromised_count || 0}</div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{lastScan?.weak_count || 0}</div>
                <p className="text-sm text-muted-foreground">Weak Passwords</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{lastScan?.reused_count || 0}</div>
                <p className="text-sm text-muted-foreground">Reused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      {currentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Security Issues ({currentResults.length})
            </CardTitle>
            <CardDescription>
              Passwords that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {currentResults.map((result) => (
                  <div 
                    key={result.entryId}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{result.title}</h4>
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                    </div>
                    <ul className="space-y-1">
                      {result.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scan History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan) => (
                <div 
                  key={scan.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      scan.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                      scan.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {scan.overall_score >= 80 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        Score: {scan.overall_score}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {scan.total_entries_scanned} passwords scanned
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(scan.completed_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues State */}
      {!isScanning && currentResults.length === 0 && lastScan && (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
          <p className="text-muted-foreground">
            No security issues detected in your passwords
          </p>
        </Card>
      )}
    </div>
  );
};

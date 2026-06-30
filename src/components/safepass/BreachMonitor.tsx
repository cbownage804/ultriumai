import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVault } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { supabase } from '@/integrations/supabase/client';
import { BreachCheckService, EmailBreachResult } from '@/services/breachCheckService';
import { BreachRecommendationDialog, BreachFindingDetails } from './BreachRecommendationDialog';
import { ScanHistory } from './ScanHistory';
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
  XCircle,
  ShieldAlert,
  ChevronRight
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
  username?: string;
  issues: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  emailBreaches?: EmailBreachResult['breaches'];
  passwordBreachCount?: number;
}

export const BreachMonitor = () => {
  const { user } = useAuth();
  const { getEntryPassword, loadAllEntries } = useVault();
  const { isUnlocked } = useMasterPassword();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [lastScan, setLastScan] = useState<BreachScan | null>(null);
  const [allScans, setAllScans] = useState<BreachScan[]>([]);
  const [currentResults, setCurrentResults] = useState<ScanResult[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<BreachFindingDetails | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const loadScans = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_breach_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setAllScans(data as BreachScan[]);
        const latest = data[0];
        setLastScan(latest as BreachScan);
        const scanResults = latest.scan_results as { results?: ScanResult[] } | null;
        if (scanResults?.results) {
          setCurrentResults(scanResults.results);
        }
      } else {
        setAllScans([]);
        setLastScan(null);
        setCurrentResults([]);
      }
    } catch (error) {
      console.error('Failed to load scans');
    }
  }, [user]);

  const handleScanSelect = (scan: BreachScan) => {
    setLastScan(scan);
    const scanResults = scan.scan_results as { results?: ScanResult[] } | null;
    if (scanResults?.results) {
      setCurrentResults(scanResults.results);
    } else {
      setCurrentResults([]);
    }
  };

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // Load all entries on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchEntries = async () => {
      if (user && isUnlocked) {
        try {
          const entries = await loadAllEntries();
          if (isMounted) {
            setAllEntries(entries);
          }
        } catch (error) {
          console.error('Error loading entries:', error);
        }
      }
    };
    fetchEntries();
    
    return () => { isMounted = false; };
  }, [user?.id, isUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const runBreachScan = async () => {
    if (!user || !isUnlocked) {
      toast.error('Unlock vault first');
      return;
    }
    
    // Fetch fresh entries
    const entries = await loadAllEntries();
    setAllEntries(entries);
    
    if (entries.length === 0) {
      toast.error('No passwords found to scan');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStage('Decrypting passwords...');
    const results: ScanResult[] = [];
    const passwordMap = new Map<string, string[]>();

    try {
      // First pass: collect all passwords and usernames for breach checking
      const passwordsToCheck: { id: string; password: string; username: string; entry: any }[] = [];
      
      for (const entry of entries) {
        const password = await getEntryPassword(entry);
        if (password !== '[Locked]' && password !== '[Decryption Error]') {
          // Username/email is in encrypted_data after decryption or in the entry itself
          const encryptedData = entry.encrypted_data || {};
          const username = encryptedData.username || encryptedData.email || entry.url || '';
          passwordsToCheck.push({ 
            id: entry.id, 
            password, 
            username,
            entry 
          });
        }
      }
      
      setScanProgress(15);
      setScanStage('Checking passwords against breach databases...');
      
      // Check all passwords against breach database (HIBP)
      const passwordBreachResults = await BreachCheckService.checkPasswords(
        passwordsToCheck.map(p => ({ id: p.id, password: p.password }))
      );
      
      setScanProgress(45);
      setScanStage('Checking email accounts for breaches...');
      
      // Check emails/usernames against breach database (HIBP + Dehashed)
      const emailsToCheck = passwordsToCheck
        .filter(p => p.username && p.username.includes('@'))
        .map(p => ({ id: p.id, email: p.username }));
      
      const emailBreachResults = emailsToCheck.length > 0 
        ? await BreachCheckService.checkEmails(emailsToCheck, user.id)
        : new Map();
      
      setScanProgress(75);
      setScanStage('Analyzing security risks...');
      
      // Analyze each entry
      for (let i = 0; i < passwordsToCheck.length; i++) {
        const { id, password, username, entry } = passwordsToCheck[i];
        setScanProgress(75 + Math.round(((i + 1) / passwordsToCheck.length) * 25));

        const issues: string[] = [];
        let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let passwordBreachCount = 0;
        let emailBreaches: EmailBreachResult['breaches'] = [];

        // Check if password was found in breach database
        const passwordBreachResult = passwordBreachResults.get(id);
        if (passwordBreachResult?.breached) {
          issues.push(`Password found in ${passwordBreachResult.count.toLocaleString()} data breaches`);
          passwordBreachCount = passwordBreachResult.count;
          severity = 'critical';
        }

        // Check if email was found in breaches
        const emailBreachResult = emailBreachResults.get(id);
        if (emailBreachResult?.breached) {
          issues.push(`Account email found in ${emailBreachResult.breaches.length} breach${emailBreachResult.breaches.length > 1 ? 'es' : ''}`);
          emailBreaches = emailBreachResult.breaches;
          if (severity !== 'critical') severity = 'high';
        }

        // Check password strength
        const strength = entry.password_strength_score;
        if (strength < 40) {
          issues.push('Very weak password');
          if (severity !== 'critical') severity = 'critical';
        } else if (strength < 60) {
          issues.push('Weak password');
          if (severity === 'low') severity = 'high';
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

        // Check password age
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
            username,
            issues,
            severity,
            emailBreaches,
            passwordBreachCount
          });
        }
      }
      // Calculate statistics
      const breachedCount = results.filter(r => r.issues.some(i => i.includes('data breaches'))).length;
      const compromisedCount = results.filter(r => r.severity === 'critical').length;
      const weakCount = results.filter(r => r.issues.some(i => i.toLowerCase().includes('weak'))).length;
      const reusedCount = results.filter(r => r.issues.some(i => i.includes('Reused'))).length;
      
      // Score calculation: breached passwords heavily penalize the score
      let overallScore = 100;
      if (entries.length > 0) {
        // Each breached password: -30 points
        // Each weak password: -15 points  
        // Each reused password: -10 points
        const penalty = (breachedCount * 30) + (weakCount * 15) + (reusedCount * 10);
        overallScore = Math.max(0, 100 - penalty);
      }

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
      loadScans();
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Breach Monitor</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Scan your passwords for security vulnerabilities
          </p>
        </div>
        <Button 
          onClick={runBreachScan} 
          disabled={isScanning}
          className="bg-primary hover:bg-primary text-black w-full sm:w-auto touch-target"
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
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>
                  {scanProgress < 20 ? 'Decrypting...' :
                   scanProgress < 60 ? 'Checking breaches...' :
                   'Analyzing security...'}
                </span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Score Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className={`text-2xl sm:text-4xl font-bold ${getScoreColor(lastScan?.overall_score || 100)}`}>
              {lastScan?.overall_score || 100}%
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 shrink-0" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{lastScan?.compromised_count || 0}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Breached</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{lastScan?.weak_count || 0}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Weak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{lastScan?.reused_count || 0}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Reused</p>
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
              <AlertTriangle className="h-5 w-5 text-primary" />
              Security Issues ({currentResults.length})
            </CardTitle>
            <CardDescription>
              Click on an issue to get AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {currentResults.map((result) => (
                  <button 
                    key={result.entryId}
                    onClick={() => {
                      setSelectedFinding({
                        entryId: result.entryId,
                        title: result.title,
                        username: result.username,
                        issues: result.issues,
                        severity: result.severity,
                        emailBreaches: result.emailBreaches,
                        passwordBreachCount: result.passwordBreachCount
                      });
                      setShowRecommendation(true);
                    }}
                    className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{result.title}</h4>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
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
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Last Scan Info */}
      {lastScan && (
        <div className="text-center text-sm text-muted-foreground">
          Viewing scan from {formatDistanceToNow(new Date(lastScan.completed_at), { addSuffix: true })} • {lastScan.total_entries_scanned} passwords checked
        </div>
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

      {/* Scan History */}
      {allScans.length > 0 && (
        <ScanHistory 
          scans={allScans} 
          onScanDeleted={loadScans}
          onScanSelect={handleScanSelect}
        />
      )}

      {/* AI Recommendations Dialog */}
      <BreachRecommendationDialog
        finding={selectedFinding}
        open={showRecommendation}
        onOpenChange={setShowRecommendation}
      />
    </div>
  );
};

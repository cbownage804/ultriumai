import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { useVault } from '@/hooks/useSafePass';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Lock,
  Loader2,
  TrendingUp,
  Key,
  Clock,
  Copy as CopyIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface PasswordIssue {
  id: string;
  title: string;
  type: 'weak' | 'reused' | 'breached' | 'old';
  severity: 'critical' | 'warning' | 'info';
  password?: string;
}

export const PasswordHealthDashboard = () => {
  const { user } = useAuth();
  const { isUnlocked, masterPassword } = useMasterPassword();
  const { getEntryPassword, loadAllEntries } = useVault();
  
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    strong: 0,
    medium: 0,
    weak: 0,
    reused: 0,
    old: 0
  });
  const [issues, setIssues] = useState<PasswordIssue[]>([]);

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

  const analyzePasswords = async (entries: any[]) => {
    if (!isUnlocked || entries.length === 0) {
      setLoading(false);
      return;
    }

    setScanning(true);
    const passwordMap = new Map<string, string[]>();
    const issuesList: PasswordIssue[] = [];
    let strongCount = 0;
    let mediumCount = 0;
    let weakCount = 0;
    let reusedCount = 0;
    let oldCount = 0;

    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));

    for (const entry of entries) {
      try {
        const password = await getEntryPassword(entry);
        if (!password) continue;

        const strength = calculatePasswordStrength(password);
        
        // Track password reuse
        const existing = passwordMap.get(password);
        if (existing) {
          existing.push(entry.title);
          reusedCount++;
        } else {
          passwordMap.set(password, [entry.title]);
        }

        // Categorize by strength
        if (strength >= 80) {
          strongCount++;
        } else if (strength >= 50) {
          mediumCount++;
        } else {
          weakCount++;
          issuesList.push({
            id: entry.id,
            title: entry.title,
            type: 'weak',
            severity: strength < 30 ? 'critical' : 'warning'
          });
        }

        // Check age
        const createdAt = new Date(entry.created_at);
        if (createdAt < sixMonthsAgo) {
          oldCount++;
          if (issuesList.length < 10) {
            issuesList.push({
              id: entry.id,
              title: entry.title,
              type: 'old',
              severity: 'info'
            });
          }
        }
      } catch (error) {
        console.error('Error analyzing password');
      }
    }

    // Add reused password issues
    passwordMap.forEach((titles, password) => {
      if (titles.length > 1 && issuesList.length < 15) {
        titles.forEach(title => {
          issuesList.push({
            id: `reused-${title}`,
            title,
            type: 'reused',
            severity: 'warning'
          });
        });
      }
    });

    // Calculate health score
    const total = entries.length;
    const score = total > 0 
      ? Math.round(
          ((strongCount * 100) + (mediumCount * 60) + (weakCount * 20)) / total
          - (reusedCount * 5)
          - (oldCount * 2)
        )
      : 0;

    setStats({
      total,
      strong: strongCount,
      medium: mediumCount,
      weak: weakCount,
      reused: reusedCount,
      old: oldCount
    });
    setIssues(issuesList.slice(0, 10));
    setHealthScore(Math.max(0, Math.min(100, score)));
    setLoading(false);
    setScanning(false);
  };

  // Load all entries on mount and when vault is unlocked
  useEffect(() => {
    let isMounted = true;
    
    const fetchAndAnalyze = async () => {
      if (!isUnlocked || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const entries = await loadAllEntries();
        if (!isMounted) return;
        
        setAllEntries(entries);
        
        if (entries.length > 0) {
          await analyzePasswords(entries);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching entries:', error);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchAndAnalyze();
    
    return () => { isMounted = false; };
  }, [isUnlocked, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRescan = async () => {
    setScanning(true);
    const entries = await loadAllEntries();
    setAllEntries(entries);
    await analyzePasswords(entries);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-primary';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'weak':
        return 'Weak Password';
      case 'reused':
        return 'Reused Password';
      case 'breached':
        return 'Breached';
      case 'old':
        return 'Needs Update';
      default:
        return type;
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Vault Locked</h3>
        <p className="text-muted-foreground">Unlock your vault to view password health</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <Card className="p-10 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-violet-400/70" />
        <h3 className="text-lg font-semibold mb-2">I'll grade every password you save</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Once your first password lands in the vault, I'll score its strength, check for reuse, and flag anything overdue for rotation — right here.
        </p>
      </Card>

    );
  }

  // Ray's narrated review — the "screenshot moment" summary.
  const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' =
    healthScore >= 80 ? 'LOW' : healthScore >= 50 ? 'MODERATE' : 'HIGH';
  const riskColor =
    riskLevel === 'LOW'
      ? 'text-emerald-400'
      : riskLevel === 'MODERATE'
      ? 'text-amber-400'
      : 'text-red-400';
  const reviewLines = [
    `${stats.total} password${stats.total === 1 ? '' : 's'} reviewed`,
    stats.weak === 0
      ? 'No weak passwords'
      : `${stats.weak} weak password${stats.weak === 1 ? '' : 's'} found`,
    stats.reused === 0
      ? 'No reused passwords'
      : `${stats.reused} reused password${stats.reused === 1 ? '' : 's'} found`,
    stats.old === 0
      ? 'Nothing overdue for rotation'
      : `${stats.old} password${stats.old === 1 ? '' : 's'} over 6 months old`,
    issues.length === 0 ? 'No immediate action needed' : `${issues.length} item${issues.length === 1 ? '' : 's'} worth your attention`,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password Health
          </h3>
          <p className="text-muted-foreground text-sm">Security analysis of your passwords</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRescan}
          disabled={scanning}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Rescan'}
        </Button>
      </div>

      {/* Ray's narrated review — the "screenshot moment" */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="wrayth-chamfer border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] via-card to-card p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
          <motion.span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          Review complete
        </div>
        <p className="mt-2 text-sm text-foreground/90">
          Here's what I found in your vault.
        </p>
        <ul className="mt-4 space-y-1.5">
          {reviewLines.map((line, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.06 * i }}
              className="flex items-start gap-2 text-sm text-foreground/85"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
              <span>{line}</span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Estimated risk</div>
            <div className={`text-2xl font-semibold tracking-tight ${riskColor}`}>{riskLevel}</div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-violet-300 hover:text-violet-200 hover:bg-violet-500/10"
              onClick={() => {
                const summary = [
                  `Wrayth — Ray's vault review`,
                  ``,
                  ...reviewLines.map((l) => `• ${l}`),
                  ``,
                  `Estimated risk: ${riskLevel}`,
                  `— Ray`,
                ].join('\n');
                navigator.clipboard.writeText(summary).then(
                  () => toast.success('Summary copied — ready to paste anywhere'),
                  () => toast.error('Copy failed'),
                );
              }}
            >
              <CopyIcon className="h-3.5 w-3.5 mr-1.5" />
              Copy summary
            </Button>
            <p className="text-xs text-muted-foreground italic">I'll keep watching.</p>
          </div>
        </div>

      </motion.div>


      {/* Health Score */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Health Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(healthScore)}`}>
                  {healthScore}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <p className={`text-sm font-medium mt-1 ${getScoreColor(healthScore)}`}>
                {getScoreLabel(healthScore)}
              </p>
            </div>
            
            {/* Score Ring */}
            <div className="relative h-24 w-24">
              <svg className="transform -rotate-90 h-24 w-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/20"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                  className={getScoreColor(healthScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className={`h-8 w-8 ${getScoreColor(healthScore)}`} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.strong}</p>
                <p className="text-xs text-muted-foreground">Strong</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.medium}</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.weak}</p>
                <p className="text-xs text-muted-foreground">Weak</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CopyIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.reused}</p>
                <p className="text-xs text-muted-foreground">Duplicate</p>
              </div>

            </div>
          </Card>
        </motion.div>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password Strength Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Strong ({stats.strong})
              </span>
              <span>{stats.total > 0 ? Math.round((stats.strong / stats.total) * 100) : 0}%</span>
            </div>
            <Progress value={stats.total > 0 ? (stats.strong / stats.total) * 100 : 0} className="h-2 bg-muted" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                Medium ({stats.medium})
              </span>
              <span>{stats.total > 0 ? Math.round((stats.medium / stats.total) * 100) : 0}%</span>
            </div>
            <Progress value={stats.total > 0 ? (stats.medium / stats.total) * 100 : 0} className="h-2 bg-muted" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                Weak ({stats.weak})
              </span>
              <span>{stats.total > 0 ? Math.round((stats.weak / stats.total) * 100) : 0}%</span>
            </div>
            <Progress value={stats.total > 0 ? (stats.weak / stats.total) * 100 : 0} className="h-2 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Issues Found ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(issue.type)}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {issue.severity}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Tips for Better Password Security</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Use at least 12 characters with mixed case, numbers, and symbols</li>
                <li>• Never reuse passwords across different accounts</li>
                <li>• Update passwords every 6 months for sensitive accounts</li>
                <li>• Enable two-factor authentication wherever possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

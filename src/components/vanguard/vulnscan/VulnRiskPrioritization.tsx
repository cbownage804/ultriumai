import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, TrendingUp, ShieldAlert, Zap, 
  Target, Users, Clock, ExternalLink 
} from "lucide-react";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  description: string | null;
  severity: string;
  cve_id: string | null;
  cvss_score: number | null;
  affected_service: string | null;
  port: number | null;
  solution: string | null;
  status: string | null;
  discovered_at: string;
  patched_at: string | null;
  device_id: string | null;
}

interface RiskScore {
  vulnerability: Vulnerability;
  riskScore: number;
  exploitabilityScore: number;
  impactScore: number;
  ageScore: number;
  factors: string[];
}

interface VulnRiskPrioritizationProps {
  vulnerabilities: Vulnerability[];
  onSelectVuln: (vuln: Vulnerability) => void;
}

// Known exploited CVEs (simplified - in production, this would come from CISA KEV catalog)
const KNOWN_EXPLOITED_CVES = [
  'CVE-2017-0144', // EternalBlue
  'CVE-2019-0708', // BlueKeep
  'CVE-2020-1472', // Zerologon
  'CVE-2021-44228', // Log4Shell
  'CVE-2021-26855', // ProxyLogon
  'CVE-2023-27997', // FortiOS
  'CVE-2023-3519', // Citrix
  'CVE-2024-1709', // ConnectWise
];

// Critical services that increase risk
const CRITICAL_SERVICES = [
  'smb', 'rdp', 'ssh', 'http', 'https', 'ldap', 'kerberos', 
  'dns', 'ftp', 'sql', 'mysql', 'postgres', 'mongodb'
];

export function VulnRiskPrioritization({ vulnerabilities, onSelectVuln }: VulnRiskPrioritizationProps) {
  const rankedVulnerabilities = useMemo(() => {
    return vulnerabilities
      .filter(v => v.status !== 'patched')
      .map(vuln => calculateRiskScore(vuln))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
  }, [vulnerabilities]);

  const riskDistribution = useMemo(() => {
    const critical = rankedVulnerabilities.filter(r => r.riskScore >= 9).length;
    const high = rankedVulnerabilities.filter(r => r.riskScore >= 7 && r.riskScore < 9).length;
    const medium = rankedVulnerabilities.filter(r => r.riskScore >= 4 && r.riskScore < 7).length;
    const low = rankedVulnerabilities.filter(r => r.riskScore < 4).length;
    return { critical, high, medium, low };
  }, [rankedVulnerabilities]);

  function calculateRiskScore(vuln: Vulnerability): RiskScore {
    const factors: string[] = [];
    
    // Base CVSS score (0-10)
    let baseScore = vuln.cvss_score || 5;
    
    // Exploitability multiplier
    let exploitabilityScore = 0.5;
    if (vuln.cve_id && KNOWN_EXPLOITED_CVES.includes(vuln.cve_id)) {
      exploitabilityScore = 1.0;
      factors.push('Known exploited vulnerability (CISA KEV)');
    } else if (vuln.severity === 'critical') {
      exploitabilityScore = 0.8;
      factors.push('Critical severity - likely exploit available');
    }
    
    // Impact based on service
    let impactScore = 0.5;
    const service = vuln.affected_service?.toLowerCase() || '';
    if (CRITICAL_SERVICES.some(s => service.includes(s))) {
      impactScore = 0.9;
      factors.push(`Critical service: ${vuln.affected_service}`);
    }
    
    // Network exposure (common exposed ports)
    const exposedPorts = [21, 22, 23, 80, 443, 445, 3389, 3306, 5432];
    if (vuln.port && exposedPorts.includes(vuln.port)) {
      impactScore = Math.min(impactScore + 0.2, 1.0);
      factors.push(`Commonly exposed port: ${vuln.port}`);
    }
    
    // Age factor - older vulnerabilities that are unpatched are higher risk
    const ageInDays = Math.floor((Date.now() - new Date(vuln.discovered_at).getTime()) / (1000 * 60 * 60 * 24));
    let ageScore = 0.5;
    if (ageInDays > 90) {
      ageScore = 1.0;
      factors.push(`Unpatched for ${ageInDays} days`);
    } else if (ageInDays > 30) {
      ageScore = 0.8;
      factors.push(`Open for ${ageInDays} days`);
    }
    
    // Calculate final risk score
    const riskScore = Math.min(
      baseScore * 0.4 + 
      exploitabilityScore * 10 * 0.25 + 
      impactScore * 10 * 0.25 + 
      ageScore * 10 * 0.1,
      10
    );
    
    return {
      vulnerability: vuln,
      riskScore: Math.round(riskScore * 10) / 10,
      exploitabilityScore: Math.round(exploitabilityScore * 100),
      impactScore: Math.round(impactScore * 100),
      ageScore: Math.round(ageScore * 100),
      factors
    };
  }

  const getRiskColor = (score: number) => {
    if (score >= 9) return 'text-red-500 bg-red-500/10';
    if (score >= 7) return 'text-orange-500 bg-orange-500/10';
    if (score >= 4) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-blue-500 bg-blue-500/10';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 9) return 'Critical';
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  if (rankedVulnerabilities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No open vulnerabilities to prioritize</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{riskDistribution.critical}</p>
                <p className="text-xs text-muted-foreground">Critical Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-500">{riskDistribution.high}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-500">{riskDistribution.medium}</p>
                <p className="text-xs text-muted-foreground">Medium Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{riskDistribution.low}</p>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prioritized Vulnerabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Risk-Prioritized Vulnerabilities
          </CardTitle>
          <CardDescription>
            Ranked by exploitability, impact, and age factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rankedVulnerabilities.map((ranked, index) => (
            <div 
              key={ranked.vulnerability.id}
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onSelectVuln(ranked.vulnerability)}
            >
              {/* Rank Number */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRiskColor(ranked.riskScore)}`}>
                {index + 1}
              </div>
              
              {/* Vulnerability Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{ranked.vulnerability.title}</span>
                  {ranked.vulnerability.cve_id && (
                    <a 
                      href={`https://nvd.nist.gov/vuln/detail/${ranked.vulnerability.cve_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ranked.vulnerability.cve_id}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                
                {/* Risk Factors */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {ranked.factors.map((factor, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
                
                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Exploitability</span>
                      <span>{ranked.exploitabilityScore}%</span>
                    </div>
                    <Progress value={ranked.exploitabilityScore} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Impact</span>
                      <span>{ranked.impactScore}%</span>
                    </div>
                    <Progress value={ranked.impactScore} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Age Factor</span>
                      <span>{ranked.ageScore}%</span>
                    </div>
                    <Progress value={ranked.ageScore} className="h-1.5" />
                  </div>
                </div>
              </div>
              
              {/* Risk Score */}
              <div className={`flex flex-col items-center p-3 rounded-lg ${getRiskColor(ranked.riskScore)}`}>
                <span className="text-2xl font-bold">{ranked.riskScore}</span>
                <span className="text-xs">{getRiskLabel(ranked.riskScore)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

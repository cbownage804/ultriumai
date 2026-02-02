import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  RefreshCw,
  Loader2,
  Monitor,
  Shield,
  HardDrive,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceScore {
  deviceId: string;
  deviceName: string;
  overallScore: number;
  categories: {
    security: { score: number; issues: string[] };
    patching: { score: number; issues: string[] };
    encryption: { score: number; issues: string[] };
    configuration: { score: number; issues: string[] };
  };
  lastAssessed: Date;
}

interface ComplianceScorecardsProps {
  agents: any[];
}

export function ComplianceScorecards({ agents }: ComplianceScorecardsProps) {
  const [scores, setScores] = useState<ComplianceScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<ComplianceScore | null>(null);

  useEffect(() => {
    loadScores();
  }, [agents]);

  const loadScores = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockScores: ComplianceScore[] = agents.slice(0, 6).map((agent, i) => {
      const security = 70 + Math.random() * 30;
      const patching = 60 + Math.random() * 40;
      const encryption = Math.random() > 0.3 ? 100 : 0;
      const configuration = 75 + Math.random() * 25;
      const overall = (security + patching + encryption + configuration) / 4;
      
      return {
        deviceId: agent.id,
        deviceName: agent.device_name || `Device ${i + 1}`,
        overallScore: Math.round(overall),
        categories: {
          security: {
            score: Math.round(security),
            issues: security < 80 ? ['Windows Defender real-time protection disabled', 'Firewall exceptions detected'] : [],
          },
          patching: {
            score: Math.round(patching),
            issues: patching < 80 ? ['15 pending Windows updates', 'Critical update KB5034441 missing'] : [],
          },
          encryption: {
            score: Math.round(encryption),
            issues: encryption < 100 ? ['BitLocker not enabled on system drive'] : [],
          },
          configuration: {
            score: Math.round(configuration),
            issues: configuration < 80 ? ['Password policy not enforced'] : [],
          },
        },
        lastAssessed: new Date(Date.now() - Math.random() * 86400000),
      };
    });
    
    setScores(mockScores);
    setIsLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((acc, s) => acc + s.overallScore, 0) / scores.length)
    : 0;

  const criticalDevices = scores.filter(s => s.overallScore < 70).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Compliance Scorecards
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Fleet Average</div>
              <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                {averageScore}%
              </div>
            </div>
            {criticalDevices > 0 && (
              <Badge variant="destructive">{criticalDevices} critical</Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadScores} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Assess
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid gap-4 md:grid-cols-2">
              {scores.map((score) => (
                <Card 
                  key={score.deviceId}
                  className="p-4 cursor-pointer hover:bg-accent/50"
                  onClick={() => setSelectedDevice(score)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{score.deviceName}</h4>
                        <p className="text-xs text-muted-foreground">
                          Last assessed: {score.lastAssessed.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(score.overallScore)}`}>
                        {score.overallScore}%
                      </div>
                      {getScoreBadge(score.overallScore)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Security</span>
                          <span className={getScoreColor(score.categories.security.score)}>
                            {score.categories.security.score}%
                          </span>
                        </div>
                        <Progress value={score.categories.security.score} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Patching</span>
                          <span className={getScoreColor(score.categories.patching.score)}>
                            {score.categories.patching.score}%
                          </span>
                        </div>
                        <Progress value={score.categories.patching.score} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Encryption</span>
                          <span className={getScoreColor(score.categories.encryption.score)}>
                            {score.categories.encryption.score}%
                          </span>
                        </div>
                        <Progress value={score.categories.encryption.score} className="h-2" />
                      </div>
                    </div>
                  </div>
                  
                  {score.overallScore < 80 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        {Object.values(score.categories).reduce((acc, c) => acc + c.issues.length, 0)} issues found
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Server, 
  Download, 
  ArrowRight, 
  AlertCircle,
  Wifi,
  Lock
} from "lucide-react";
import { getVanguardBasePath } from "@/utils/subdomain";

interface VanguardEmptyStateProps {
  feature: string;
  description?: string;
}

export function VanguardEmptyState({ feature, description }: VanguardEmptyStateProps) {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="relative mb-6">
          <div className="p-4 rounded-full bg-muted/50">
            <Server className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-destructive/10 border-2 border-background">
            <Wifi className="h-4 w-4 text-destructive" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">No Vanguard Agents Connected</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {description || `${feature} requires at least one Vanguard agent to be deployed and connected to your account.`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button onClick={() => navigate(`${basePath}/setup`)} className="gap-2">
            <Download className="h-4 w-4" />
            Deploy Vanguard Agent
          </Button>
          <Button variant="outline" onClick={() => navigate(`${basePath}/devices`)} className="gap-2">
            <Server className="h-4 w-4" />
            View Devices
          </Button>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 max-w-lg">
          <div className="flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Why do I need an agent?</p>
              <p className="text-muted-foreground">
                Vanguard agents run on your network to provide real-time threat detection, 
                vulnerability scanning, and endpoint protection. Without agents, security 
                features cannot access your infrastructure.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VanguardFeatureLockedProps {
  feature: string;
  reason: string;
  agentCount?: number;
  onlineCount?: number;
}

export function VanguardFeatureLocked({ feature, reason, agentCount = 0, onlineCount = 0 }: VanguardFeatureLockedProps) {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Lock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium">{feature}</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {agentCount > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30">
              {onlineCount}/{agentCount} online
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(`${basePath}/devices`)}>
            Manage Devices
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface VanguardDataStatusProps {
  hasAgents: boolean;
  onlineAgents: number;
  totalAgents: number;
}

export function VanguardDataStatus({ hasAgents, onlineAgents, totalAgents }: VanguardDataStatusProps) {
  if (!hasAgents) {
    return (
      <Badge variant="outline" className="gap-1.5 text-destructive border-destructive/30">
        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        No Data - Deploy Agent
      </Badge>
    );
  }

  if (onlineAgents === 0) {
    return (
      <Badge variant="outline" className="gap-1.5 text-amber-500 border-amber-500/30">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        {totalAgents} Agents Offline
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-green-500 border-green-500/30">
      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      {onlineAgents}/{totalAgents} Agents Online
    </Badge>
  );
}

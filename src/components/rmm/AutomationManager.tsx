import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Play, Settings, CheckCircle, Clock } from "lucide-react";

interface AutomationScript {
  name: string;
  status: string;
  lastRun: string;
  success: number;
  nextRun: string;
}

interface AutomationManagerProps {
  scripts: AutomationScript[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <Play className="h-4 w-4 text-blue-500" />;
    case 'scheduled': return <Clock className="h-4 w-4 text-purple-500" />;
    case 'idle': return <CheckCircle className="h-4 w-4 text-gray-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export const AutomationManager = ({ scripts }: AutomationManagerProps) => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Scripts & Automation
        </CardTitle>
        <CardDescription>Automated tasks and their execution status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scripts.map((script) => (
            <div key={script.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(script.status)}
                  <div>
                    <h4 className="font-medium">{script.name}</h4>
                    <p className="text-sm text-muted-foreground">Last run: {script.lastRun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">{script.success}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <Badge variant={script.status === 'running' ? 'default' : 'secondary'}>
                    {script.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Next execution: {script.nextRun}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7">
                    <Play className="h-3 w-3 mr-1" />
                    Run Now
                  </Button>
                  <Button size="sm" variant="outline" className="h-7">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
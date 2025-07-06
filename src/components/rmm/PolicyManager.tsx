import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, Clock } from "lucide-react";

interface PolicyData {
  name: string;
  status: string;
  compliance: number;
  lastUpdate: string;
}

interface PolicyManagerProps {
  policies: PolicyData[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export const PolicyManager = ({ policies }: PolicyManagerProps) => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Policies
        </CardTitle>
        <CardDescription>Compliance and enforcement status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(policy.status)}
                  <div>
                    <h4 className="font-medium">{policy.name}</h4>
                    <p className="text-sm text-muted-foreground">Updated {policy.lastUpdate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{policy.compliance}%</div>
                    <div className="text-xs text-muted-foreground">Compliance</div>
                  </div>
                  <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                    {policy.status}
                  </Badge>
                </div>
              </div>
              <Progress value={policy.compliance} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
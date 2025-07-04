import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DeploymentAnalytics = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Analytics</CardTitle>
        <CardDescription>
          Track usage and performance of your deployed GPT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">Total Interactions</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">342</div>
            <div className="text-sm text-muted-foreground">Unique Users</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">98.5%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentAnalytics;
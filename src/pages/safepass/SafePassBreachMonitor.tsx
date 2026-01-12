import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

export default function SafePassBreachMonitor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Breach Monitor</h1>
        <p className="text-muted-foreground">
          Daily automated scans against breach databases using Dehashed
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Automated Daily Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Breach monitoring is active</p>
            <p className="text-muted-foreground">Your passwords are scanned daily against known breaches</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

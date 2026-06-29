import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface SafeScanAppProps {
  isWhiteLabeled?: boolean;
  brandName?: string;
  hideHeader?: boolean;
}

export function SafeScanApp({ brandName = 'SafeScan' }: SafeScanAppProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{brandName} Device Scanner</CardTitle>
              <CardDescription>Scan your devices for security risks and misconfigurations.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The {brandName} agent watches device health, patch status, and vulnerable services.
            Install the agent on each endpoint to begin reporting.
          </p>
          <Button>Download SafeScan agent</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SafeScanApp;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ScanAppProps {
  isWhiteLabeled?: boolean;
  brandName?: string;
  hideHeader?: boolean;
}

export function ScanApp({ brandName = 'Scan' }: ScanAppProps) {
  const handleDownload = () => {
    toast.info(`${brandName} agent installer is coming soon — we'll email you the moment it's ready.`);
  };
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
          <Button onClick={handleDownload}>Notify me when the {brandName} agent ships</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ScanApp;

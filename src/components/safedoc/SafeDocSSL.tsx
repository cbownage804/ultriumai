import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';
import { useSafeDocIT } from '@/hooks/useSafeDocIT';

export function SafeDocSSL({ organizationId }: { organizationId?: string }) {
  const { sslCertificates } = useSafeDocIT(organizationId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">SSL Certificates</h2>
        <Button><Plus className="h-4 w-4 mr-2" />Add Certificate</Button>
      </div>
      <div className="grid gap-2">
        {sslCertificates.map((cert: any) => (
          <Card key={cert.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-400" />
              <div><p className="font-medium">{cert.domain}</p><p className="text-xs text-muted-foreground">Expires: {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString() : 'Unknown'}</p></div>
            </CardContent>
          </Card>
        ))}
        {sslCertificates.length === 0 && <p className="text-muted-foreground text-center py-8">No SSL certificates tracked.</p>}
      </div>
    </div>
  );
}

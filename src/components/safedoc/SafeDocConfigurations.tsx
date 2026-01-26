import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Plus } from 'lucide-react';
import { useSafeDocIT } from '@/hooks/useSafeDocIT';

export function SafeDocConfigurations({ organizationId }: { organizationId?: string }) {
  const { configurations } = useSafeDocIT(organizationId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Configurations</h2>
        <Button><Plus className="h-4 w-4 mr-2" />Add Configuration</Button>
      </div>
      <div className="grid gap-2">
        {configurations.map((cfg: any) => (
          <Card key={cfg.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Server className="h-5 w-5 text-cyan-400" />
              <div><p className="font-medium">{cfg.name}</p><p className="text-xs text-muted-foreground">{cfg.configuration_type}</p></div>
            </CardContent>
          </Card>
        ))}
        {configurations.length === 0 && <p className="text-muted-foreground text-center py-8">No configurations yet.</p>}
      </div>
    </div>
  );
}

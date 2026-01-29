import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { useVanguardAtlas } from '@/hooks/useVanguardAtlas';

export function AtlasRunbooks({ organizationId }: { organizationId?: string }) {
  const { runbooks } = useVanguardAtlas(organizationId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Runbooks / SOPs</h2>
        <Button><Plus className="h-4 w-4 mr-2" />Create Runbook</Button>
      </div>
      <div className="grid gap-2">
        {runbooks.map((rb: any) => (
          <Card key={rb.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-pink-400" />
              <div><p className="font-medium">{rb.title}</p><p className="text-xs text-muted-foreground">{rb.category || 'General'}</p></div>
            </CardContent>
          </Card>
        ))}
        {runbooks.length === 0 && <p className="text-muted-foreground text-center py-8">No runbooks yet.</p>}
      </div>
    </div>
  );
}

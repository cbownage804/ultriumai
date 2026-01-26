import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, AlertTriangle } from 'lucide-react';
import { useSafeDocIT } from '@/hooks/useSafeDocIT';

export function SafeDocExpirations({ organizationId }: { organizationId?: string }) {
  const { expirations } = useSafeDocIT(organizationId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Expirations Dashboard</h2>
        <Button><Plus className="h-4 w-4 mr-2" />Track Expiration</Button>
      </div>
      <div className="grid gap-2">
        {expirations.map((exp: any) => {
          const days = Math.ceil((new Date(exp.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isExpiring = days <= 30 && days > 0;
          const isExpired = days <= 0;
          return (
            <Card key={exp.id} className={isExpired ? 'border-red-500/50' : isExpiring ? 'border-amber-500/50' : ''}>
              <CardContent className="p-4 flex items-center gap-3">
                {isExpired || isExpiring ? <AlertTriangle className={`h-5 w-5 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                <div className="flex-1"><p className="font-medium">{exp.item_name}</p><p className="text-xs text-muted-foreground">{exp.item_type}</p></div>
                <p className={`text-sm font-medium ${isExpired ? 'text-red-400' : isExpiring ? 'text-amber-400' : ''}`}>{isExpired ? 'Expired' : `${days} days`}</p>
              </CardContent>
            </Card>
          );
        })}
        {expirations.length === 0 && <p className="text-muted-foreground text-center py-8">No expirations tracked.</p>}
      </div>
    </div>
  );
}

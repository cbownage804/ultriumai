import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Plus } from 'lucide-react';
import { useSafeDocIT } from '@/hooks/useSafeDocIT';

export function SafeDocPasswords({ organizationId }: { organizationId?: string }) {
  const { passwords } = useSafeDocIT(organizationId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Passwords</h2>
        <Button><Plus className="h-4 w-4 mr-2" />Add Password</Button>
      </div>
      <div className="grid gap-2">
        {passwords.map((pwd: any) => (
          <Card key={pwd.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Key className="h-5 w-5 text-amber-400" />
              <div><p className="font-medium">{pwd.name}</p><p className="text-xs text-muted-foreground">{pwd.username || 'No username'}</p></div>
            </CardContent>
          </Card>
        ))}
        {passwords.length === 0 && <p className="text-muted-foreground text-center py-8">No passwords stored.</p>}
      </div>
    </div>
  );
}

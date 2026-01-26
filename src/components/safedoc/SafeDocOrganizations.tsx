import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';
import { useSafeDoc } from '@/hooks/useSafeDoc';

export function SafeDocOrganizations({ selectedOrg, onSelectOrg }: { selectedOrg?: string; onSelectOrg: (id: string) => void }) {
  const { organizations } = useSafeDoc();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <Button><Plus className="h-4 w-4 mr-2" />Add Organization</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map(org => (
          <Card key={org.id} className="cursor-pointer hover:border-primary" onClick={() => onSelectOrg(org.id)}>
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-400" />
              <div><p className="font-medium">{org.name}</p><p className="text-sm text-muted-foreground">{org.description || 'No description'}</p></div>
            </CardContent>
          </Card>
        ))}
        {organizations.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No organizations yet. Create your first one!</p>}
      </div>
    </div>
  );
}

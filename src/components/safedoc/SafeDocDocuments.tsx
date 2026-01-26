import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useSafeDoc } from '@/hooks/useSafeDoc';

export function SafeDocDocuments({ organizationId }: { organizationId?: string }) {
  const { documents } = useSafeDoc(organizationId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button><Plus className="h-4 w-4 mr-2" />New Document</Button>
      </div>
      <div className="grid gap-2">
        {documents.map(doc => (
          <Card key={doc.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-400" />
              <div><p className="font-medium">{doc.title}</p><p className="text-xs text-muted-foreground">{new Date(doc.updated_at).toLocaleDateString()}</p></div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && <p className="text-muted-foreground text-center py-8">No documents yet.</p>}
      </div>
    </div>
  );
}

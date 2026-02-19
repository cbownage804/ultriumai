import { useState, useCallback } from 'react';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: 'create' | 'update' | 'delete';
  filePath: string;
  userId: string;
  before?: string;
  after?: string;
  summary: string;
}

export function useAuditTrailGenerator() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [trackCreates, setTrackCreates] = useState(true);
  const [trackUpdates, setTrackUpdates] = useState(true);
  const [trackDeletes, setTrackDeletes] = useState(true);
  const [maxEntries, setMaxEntries] = useState(500);

  const recordEntry = useCallback((action: AuditEntry['action'], filePath: string, before?: string, after?: string) => {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      filePath,
      userId: 'current-user',
      before,
      after,
      summary: `${action} ${filePath}`,
    };
    setEntries(prev => [entry, ...prev].slice(0, maxEntries));
  }, [maxEntries]);

  const clearEntries = useCallback(() => setEntries([]), []);

  const getEntriesForFile = useCallback((path: string) => entries.filter(e => e.filePath === path), [entries]);

  const generateCode = useCallback((): string => {
    const actions = [trackCreates && "'create'", trackUpdates && "'update'", trackDeletes && "'delete'"].filter(Boolean).join(' | ');
    return `import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: ${actions};
  resource: string;
  userId: string;
  details?: Record<string, any>;
}

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? entries : entries.filter(e => e.action === filter);

  const actionColor = (a: string) => {
    if (a === 'create') return 'bg-green-500/10 text-green-500';
    if (a === 'delete') return 'bg-red-500/10 text-red-500';
    return 'bg-blue-500/10 text-blue-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {['all', ${trackCreates ? "'create', " : ''}${trackUpdates ? "'update', " : ''}${trackDeletes ? "'delete'" : ''}].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={\`px-3 py-1 rounded text-sm \${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted'}\`}>{f}</button>
        ))}
      </div>
      <ScrollArea className="h-[400px]">
        {filtered.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-border">
            <Badge className={actionColor(entry.action)}>{entry.action}</Badge>
            <span className="text-sm flex-1 truncate">{entry.resource}</span>
            <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}`;
  }, [trackCreates, trackUpdates, trackDeletes]);

  return { entries, trackCreates, setTrackCreates, trackUpdates, setTrackUpdates, trackDeletes, setTrackDeletes, maxEntries, setMaxEntries, recordEntry, clearEntries, getEntriesForFile, generateCode };
}

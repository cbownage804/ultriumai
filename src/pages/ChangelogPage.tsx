import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Bug, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type EntryType = 'feature' | 'fix' | 'improvement' | 'breaking';

interface DbEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  entry_type: string;
  published_at: string;
}

const typeConfig: Record<EntryType, { label: string; icon: typeof Sparkles; className: string }> = {
  feature: { label: 'New Feature', icon: Sparkles, className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  fix: { label: 'Fix', icon: Bug, className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  improvement: { label: 'Improved', icon: Zap, className: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  breaking: { label: 'Breaking', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const ChangelogPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EntryType | 'all'>('all');
  const [entries, setEntries] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('platform_changelog')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });
      setEntries((data as DbEntry[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Group entries by version
  const grouped = useMemo(() => {
    const filtered = filter === 'all' ? entries : entries.filter(e => e.entry_type === filter);
    const map = new Map<string, { version: string; date: string; entries: DbEntry[] }>();
    for (const e of filtered) {
      if (!map.has(e.version)) {
        map.set(e.version, {
          version: e.version,
          date: new Date(e.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          entries: [],
        });
      }
      map.get(e.version)!.entries.push(e);
    }
    return Array.from(map.values());
  }, [entries, filter]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-8 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Changelog</h1>
          <p className="text-lg text-muted-foreground">What's new and improved in UltriumAI.</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-10">
          {(['all', 'feature', 'fix', 'improvement', 'breaking'] as const).map(t => (
            <Button key={t} variant={filter === t ? 'default' : 'outline'} size="sm" onClick={() => setFilter(t)} className="capitalize">
              {t === 'all' ? 'All' : typeConfig[t].label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : grouped.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No changelog entries yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border" />
            <div className="space-y-12">
              {grouped.map(release => (
                <div key={release.version} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className="font-mono text-xs">{release.version}</Badge>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  <div className="space-y-3">
                    {release.entries.map(entry => {
                      const config = typeConfig[(entry.entry_type as EntryType) || 'feature'];
                      const Icon = config.icon;
                      return (
                        <Card key={entry.id} className="border-border/50">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className={`text-xs shrink-0 ${config.className}`}>
                                <Icon className="h-3 w-3 mr-1" />{config.label}
                              </Badge>
                              <div>
                                <h3 className="font-medium text-sm">{entry.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ChangelogPage;

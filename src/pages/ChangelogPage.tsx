import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Bug, Zap, AlertTriangle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type EntryType = 'feature' | 'fix' | 'improvement' | 'breaking';

interface ChangelogEntry {
  version: string;
  date: string;
  entries: { title: string; description: string; type: EntryType }[];
}

const typeConfig: Record<EntryType, { label: string; icon: typeof Sparkles; className: string }> = {
  feature: { label: 'New Feature', icon: Sparkles, className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  fix: { label: 'Fix', icon: Bug, className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  improvement: { label: 'Improved', icon: Zap, className: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  breaking: { label: 'Breaking', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const changelog: ChangelogEntry[] = [
  {
    version: 'v2.5.0', date: 'February 8, 2026',
    entries: [
      { title: 'Public Changelog Page', description: 'A dedicated changelog page showing all platform updates in a versioned timeline.', type: 'feature' },
      { title: 'Feature Request Board', description: 'Submit ideas, upvote existing requests, and track their status from planning to shipped.', type: 'feature' },
      { title: 'System Status Banner', description: 'Real-time incident and maintenance banners displayed globally when active.', type: 'feature' },
      { title: 'Referral Program', description: 'Invite friends, track conversions, and earn credits through your unique referral link.', type: 'feature' },
    ],
  },
  {
    version: 'v2.4.0', date: 'February 7, 2026',
    entries: [
      { title: 'Admin Analytics Dashboard', description: 'Comprehensive admin metrics including DAU/MAU, product adoption, and activation funnels.', type: 'feature' },
      { title: 'Contextual Upgrade Prompts', description: 'Smart banners that appear when approaching credit limits or encountering gated features.', type: 'improvement' },
      { title: 'Page Transition Animations', description: 'Smooth Framer Motion transitions between all routes for a polished navigation experience.', type: 'improvement' },
    ],
  },
  {
    version: 'v2.3.5', date: 'February 6, 2026',
    entries: [
      { title: 'Webhook Manager', description: 'Configure outbound webhooks with retry logic and event filtering from the Admin Center.', type: 'feature' },
      { title: 'Global Command Palette', description: 'Press Cmd+K to search across 35+ routes, actions, and settings instantly.', type: 'feature' },
      { title: 'What\'s New Sidebar', description: 'A sparkle indicator in the header opens a slide-over with recent platform updates.', type: 'improvement' },
    ],
  },
  {
    version: 'v2.3.4', date: 'February 5, 2026',
    entries: [
      { title: 'OOM Build Fix', description: 'Resolved out-of-memory build errors with aggressive bundle splitting and lazy loading.', type: 'fix' },
      { title: 'Session Replay Stability', description: 'Fixed edge case where session insights would show stale data after token refresh.', type: 'fix' },
    ],
  },
];

const ChangelogPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EntryType | 'all'>('all');

  const filteredChangelog = changelog.map(release => ({
    ...release,
    entries: filter === 'all' ? release.entries : release.entries.filter(e => e.type === filter),
  })).filter(r => r.entries.length > 0);

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

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border" />

          <div className="space-y-12">
            {filteredChangelog.map(release => (
              <div key={release.version} className="relative pl-8">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary border-2 border-background" />

                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="font-mono text-xs">{release.version}</Badge>
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>

                <div className="space-y-3">
                  {release.entries.map((entry, i) => {
                    const config = typeConfig[entry.type];
                    const Icon = config.icon;
                    return (
                      <Card key={i} className="border-border/50">
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
      </main>
      <Footer />
    </div>
  );
};

export default ChangelogPage;

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body: string;
  type: 'feature' | 'fix' | 'improvement' | 'breaking';
  date: string;
}

// Mock data — will be replaced with Supabase query when platform_changelog table exists
const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  { id: '1', version: 'v2.4.0', title: 'Global User Menu', body: 'Unified profile dropdown with avatar, subscription info, and quick navigation across all products.', type: 'feature', date: '2026-02-08' },
  { id: '2', version: 'v2.3.5', title: 'Webhook Manager', body: 'Added outbound webhook configuration with retry logic and delivery tracking.', type: 'feature', date: '2026-02-07' },
  { id: '3', version: 'v2.3.4', title: 'Build Performance Fix', body: 'Resolved out-of-memory build errors with improved bundle splitting strategy.', type: 'fix', date: '2026-02-06' },
  { id: '4', version: 'v2.3.3', title: 'Admin Center Overhaul', body: 'Replaced horizontal tabs with a collapsible sidebar for better module organization.', type: 'improvement', date: '2026-02-05' },
  { id: '5', version: 'v2.3.2', title: 'Spotlight Search', body: 'Cmd+K now indexes 35+ routes with fuzzy matching and keyboard navigation.', type: 'feature', date: '2026-02-04' },
];

const typeConfig: Record<string, { label: string; className: string }> = {
  feature: { label: 'New', className: 'bg-green-500/15 text-green-500 border-green-500/30' },
  fix: { label: 'Fix', className: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  improvement: { label: 'Improved', className: 'bg-purple-500/15 text-purple-500 border-purple-500/30' },
  breaking: { label: 'Breaking', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export function WhatsNewSidebar() {
  const [hasNew] = useState(true); // Will check against last-seen timestamp in localStorage

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Sparkles className="h-4 w-4" />
          {hasNew && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[460px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What's New
          </SheetTitle>
          <p className="text-sm text-muted-foreground">Latest platform updates and improvements</p>
        </SheetHeader>
        <Separator />
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-6 space-y-6">
            {CHANGELOG_ENTRIES.map((entry, i) => (
              <div key={entry.id} className="relative">
                {/* Timeline connector */}
                {i < CHANGELOG_ENTRIES.length - 1 && (
                  <div className="absolute left-[7px] top-8 bottom-0 w-px bg-border -mb-6 h-[calc(100%+24px)]" />
                )}
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-primary bg-background" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                        {entry.version}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeConfig[entry.type].className}`}>
                        {typeConfig[entry.type].label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{entry.date}</span>
                    </div>
                    <h4 className="text-sm font-medium text-foreground">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

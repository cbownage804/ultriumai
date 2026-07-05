/**
 * Reports — Ray-generated executive briefs.
 *
 * Follows the Wrayth three-state UI standard.
 * Currently: no `report_snapshots` for any user until real investigations
 * complete → we render the Empty state. Reports themselves will land here
 * once the customer runs at least one investigation.
 */
import { useAuth } from '@/hooks/useAuth';
import { FileText, Loader2 } from 'lucide-react';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState, useHasAnyData } from '@/components/ray/zero-state';

export default function Reports() {
  const { user } = useAuth();
  const { hasData, isLoading } = useHasAnyData('report_snapshots', {
    filters: user?.id ? [{ column: 'user_id', op: 'eq', value: user.id }] : [],
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <RayPageHeader title="Reports" subtitle="Managed by Ray" />
      <PageState
        isLoading={isLoading}
        hasData={hasData}
        loading={
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        }
        empty={
          <RayZeroState
            icon={FileText}
            title="I haven\u2019t written you a report yet."
            body={
              <>
                Reports are built from your real activity — investigations I&rsquo;ve completed,
                threats I&rsquo;ve triaged, controls I&rsquo;ve verified. I&rsquo;ll never generate a
                report from placeholder data just to fill this page.
              </>
            }
            expectations={[
              'A monthly executive brief in plain English — what changed, what improved, what still needs attention.',
              'Per-investigation reports produced automatically whenever I close a case.',
              'Compliance evidence packs assembled from real scan results, exportable as PDF.',
            ]}
            action={{ label: 'Start an investigation', href: '/app/ray' }}
            secondaryAction={{ label: 'Run a compliance scan', href: '/app/compliance' }}
          />
        }
      >
        {/* Active state placeholder — real report list renders here once report_snapshots exist. */}
        <div className="text-sm text-muted-foreground">Reports list coming online.</div>
      </PageState>
    </div>
  );
}

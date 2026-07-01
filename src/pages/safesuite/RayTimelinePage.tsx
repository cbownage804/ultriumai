/**
 * Wrayth · Ray's Timeline page — /app/timeline
 * A chronological feed of everything Ray has done and observed.
 */
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayTimeline } from '@/components/ray/RayTimeline';
import { PageMotion } from '@/components/ray/PageMotion';

export default function RayTimelinePage() {
  return (
    <PageMotion className="container max-w-3xl py-6 sm:py-8">
      <RayPageHeader
        title="Timeline"
        subtitle="Managed by Ray"
        description="Every protective action I've taken on your behalf, in order."
      />
      <RayTimeline />
    </PageMotion>
  );
}

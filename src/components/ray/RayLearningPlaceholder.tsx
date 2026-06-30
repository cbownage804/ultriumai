/**
 * Lightweight "Ray is learning this area" placeholder — used for the
 * brand-new sidebar destinations (Identity, Devices, Reports) so the nav is
 * complete while the deeper functionality is built out.
 */
import { Link } from 'react-router-dom';
import { Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RayPageHeader } from '@/components/ray/RayPageHeader';

interface Props {
  title: string;
  subtitle?: string;
  promise: string;       // "Ray will track every device you log in from."
  arrival?: string;      // "Coming next."
}

export function RayLearningPlaceholder({ title, subtitle, promise, arrival = 'Coming soon.' }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <RayPageHeader title={title} subtitle={subtitle ?? 'Managed by Ray'} />
      <section className="rounded-sm border border-border bg-card/40 p-8 sm:p-10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shrink-0">
            <Eye className="h-5 w-5 text-foreground/80" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Ray's note</div>
            <p className="mt-1 text-lg text-foreground">I'm learning this area.</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-prose">{promise}</p>
            <p className="mt-1 text-sm text-muted-foreground">{arrival}</p>
            <div className="mt-6">
              <Link to="/app/dashboard">
                <Button variant="outline" className="rounded-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

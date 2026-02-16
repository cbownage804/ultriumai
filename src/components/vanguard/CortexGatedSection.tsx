import { ReactNode } from 'react';
import { useVanguardSubscription } from '@/hooks/useVanguardSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';

interface CortexGatedSectionProps {
  children: ReactNode;
  /** Short name of the Cortex feature (e.g. "AI Ticket Summarizer") */
  featureName: string;
  /** Brief value proposition shown in the teaser */
  description: string;
  /** Optional icon to show in the teaser */
  icon?: ReactNode;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Inline gate for Cortex AI features embedded natively in other modules.
 * - If user has `cortex-ai` add-on → renders children seamlessly
 * - If not → shows a subtle teaser card (no full-page block)
 */
export function CortexGatedSection({
  children,
  featureName,
  description,
  icon,
  className = '',
}: CortexGatedSectionProps) {
  const { hasAddon, loading, adminOverride, isTrial } = useVanguardSubscription();
  const basePath = getVanguardBasePath();

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
      </div>
    );
  }

  // Admin override or trial or has add-on → show the feature
  if (adminOverride || isTrial || hasAddon('cortex-ai')) {
    return <div className={className}>{children}</div>;
  }

  // Teaser card
  return (
    <Card className={`border-violet-500/20 bg-violet-500/[0.03] backdrop-blur-sm ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-white">{featureName}</h4>
              <Badge variant="outline" className="text-violet-400 border-violet-500/30 text-[10px] px-1.5 py-0">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Cortex AI
              </Badge>
            </div>
            <p className="text-xs text-white/50 mb-3">{description}</p>
            <Button
              size="sm"
              variant="outline"
              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 h-7 text-xs"
              asChild
            >
              <Link to={`${basePath}/suite`}>
                Unlock with Cortex AI
                <ArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Clock, Zap } from 'lucide-react';
import { useVanguardSub } from '@/contexts/VanguardSubscriptionContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function VanguardTrialBanner() {
  const { isTrial, trialDaysRemaining } = useVanguardSub();

  if (!isTrial || trialDaysRemaining === null) return null;

  const isUrgent = trialDaysRemaining <= 3;
  const bgClass = isUrgent
    ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-500/30'
    : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20';
  const textClass = isUrgent ? 'text-amber-300' : 'text-cyan-300';

  return (
    <div className={`${bgClass} border-b px-4 py-2 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-2 min-w-0">
        <Clock className={`h-4 w-4 flex-shrink-0 ${textClass}`} />
        <span className={`text-sm font-medium ${textClass}`}>
          {trialDaysRemaining === 0
            ? 'Your trial expires today!'
            : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in your free trial`}
        </span>
      </div>
      <Button
        size="sm"
        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-xs h-7 px-3 flex-shrink-0"
        asChild
      >
        <Link to="/vanguard/pricing">
          <Zap className="h-3 w-3 mr-1" />
          Upgrade Now
        </Link>
      </Button>
    </div>
  );
}

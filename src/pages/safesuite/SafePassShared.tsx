/**
 * SafePass Shared - View passwords shared with you (Business feature only)
 */

import { FeatureGate } from '@/components/safesuite/WraythPaywall';
import { SharedPasswordAccess } from '@/components/safepass/SharedPasswordAccess';
import { useWraythSubscription } from '@/hooks/useWrayth';
import { TeaserLock } from '@/components/safesuite/TeaserLock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, KeyRound, User, Clock } from 'lucide-react';

// Teaser showing what shared passwords look like
function SharedPasswordsTeaser() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Shared With Me</h1>
        <p className="text-muted-foreground">
          Access passwords that others have securely shared with you
        </p>
      </div>
      
      <div className="grid gap-4">
        {[
          { title: 'AWS Production Console', sharedBy: 'John Smith', category: 'Cloud Services' },
          { title: 'GitHub Enterprise', sharedBy: 'Sarah Wilson', category: 'Development' },
          { title: 'Slack Admin', sharedBy: 'Mike Chen', category: 'Communication' },
          { title: 'Jira Project Board', sharedBy: 'Sarah Wilson', category: 'Project Management' },
        ].map((item, i) => (
          <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Shared by {item.sharedBy}</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{item.category}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SafePassShared() {
  const { isBusiness, loading: subLoading } = useWraythSubscription();

  // Business tier gate with teaser
  if (!subLoading && !isBusiness) {
    return (
      <TeaserLock 
        feature="team" 
        message="Share passwords securely with team members"
        teaserContent={<SharedPasswordsTeaser />}
      >
        <div />
      </TeaserLock>
    );
  }

  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Shared With Me</h1>
          <p className="text-muted-foreground">
            Access passwords that others have securely shared with you
          </p>
        </div>
        
        <SharedPasswordAccess />
      </div>
    </FeatureGate>
  );
}
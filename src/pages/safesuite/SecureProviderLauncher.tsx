/**
 * SecureProviderLauncher — resolves /app/ray/secure/:provider to a guided playbook.
 *
 * Looks up the provider, starts (or resumes) the matching playbook, and
 * forwards the user to the PlaybookRunner. If the provider is unknown,
 * sends them to the Ray Command Center.
 */
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { findProviderById } from '@/lib/ray/providers/catalog';
import { startPlaybook } from '@/lib/ray/playbooks';

export default function SecureProviderLauncher() {
  const { provider } = useParams<{ provider: string }>();
  const { user } = useAuth();
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !provider) return;
    const def = findProviderById(provider.toLowerCase());
    if (!def) {
      setError('Unknown provider');
      return;
    }
    let alive = true;
    void (async () => {
      const run = await startPlaybook(user.id, def.playbookSlug);
      if (!alive) return;
      if (run) setTarget(`/app/ray/playbook/${run.id}`);
      else setError("Couldn't start that playbook.");
    })();
    return () => { alive = false; };
  }, [user, provider]);

  if (error) return <Navigate to="/app/ray" replace />;
  if (target) return <Navigate to={target} replace />;

  return (
    <div className="container max-w-2xl py-16 flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-violet-300" />
      <p className="text-sm text-muted-foreground">
        Ray is preparing your {findProviderById(provider ?? '')?.name ?? 'account'} playbook…
      </p>
    </div>
  );
}

/**
 * Standalone password import page — reachable from the empty-vault CTA
 * and from the Import button inside the vault. Wraps `PasswordImportStep`
 * with the real `runRayOnboardingPipeline` so the same encryption,
 * analysis, and recommendation flow runs whether the user imports during
 * onboarding or later.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordImportStep } from '@/components/onboarding/PasswordImportStep';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { useToast } from '@/hooks/use-toast';
import {
  runRayOnboardingPipeline,
  type PipelineProgress,
} from '@/lib/import/onboardingPipeline';
import type { ImportSource } from '@/lib/import/passwordParsers';

export default function PasswordImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mp = useMasterPassword();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);

  const handleImport = async (source: ImportSource, text: string) => {
    if (!user) return;
    if (!mp.isUnlocked || !mp.masterPassword) {
      toast({
        title: 'Unlock your vault first',
        description: 'Open Passwords and enter your master password, then come back.',
        variant: 'destructive',
      });
      navigate('/app/passwords');
      return;
    }
    setBusy(true);
    try {
      const result = await runRayOnboardingPipeline(
        {
          userId: user.id,
          vaultId: '',
          masterPassword: mp.masterPassword,
          source,
          text,
          profile: {},
        },
        setProgress,
      );
      toast({
        title: 'Imported.',
        description: `${result.imported} credentials saved. Ray is analyzing them now.`,
      });
      navigate('/app/passwords');
    } catch (e) {
      toast({
        title: 'Import failed',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/passwords')}
        className="text-slate-400 hover:text-white -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Passwords
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-violet-300/90 text-[11px] uppercase tracking-[0.18em]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Protect your passwords
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Bring your passwords into Wrayth
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Pick where your passwords live today. Ray parses the file in your
          browser, encrypts every entry with your master password, then
          checks each one for weakness, reuse, and known breaches.
        </p>
      </motion.div>

      <div className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8">
        <PasswordImportStep
          busy={busy}
          progress={progress}
          onImport={handleImport}
          onSkip={() => navigate('/app/passwords')}
        />
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';

export interface MFAConfig {
  issuerName: string;
  qrSize: number;
  backupCodesCount: number;
  enrollmentRequired: boolean;
  gracePeriodDays: number;
}

export function useMFAFlowGenerator() {
  const [config, setConfig] = useState<MFAConfig>({
    issuerName: 'MyApp',
    qrSize: 200,
    backupCodesCount: 10,
    enrollmentRequired: false,
    gracePeriodDays: 7,
  });

  const updateConfig = useCallback((updates: Partial<MFAConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const generateCode = useCallback((): string => {
    return `import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

export function MFAEnrollment() {
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'enroll' | 'verify' | 'backup'>('enroll');

  const startEnrollment = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: '${config.issuerName}',
    });
    if (error) throw error;
    setFactorId(data.id);
    const url = await QRCode.toDataURL(data.totp.uri, { width: ${config.qrSize} });
    setQrUrl(url);
    setSecret(data.totp.secret);
    setStep('verify');
  };

  const verifyEnrollment = async () => {
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) throw challenge.error;
    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: verifyCode,
    });
    if (verify.error) throw verify.error;
    // Generate backup codes
    const codes = Array.from({ length: ${config.backupCodesCount} }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
    setStep('backup');
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      {step === 'enroll' && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Enable Two-Factor Authentication</h2>
          <p className="text-muted-foreground text-sm">Add an extra layer of security to your account.</p>
          <button onClick={startEnrollment} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Set Up 2FA
          </button>
        </div>
      )}
      {step === 'verify' && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Scan QR Code</h2>
          <p className="text-muted-foreground text-sm">Scan with your authenticator app</p>
          {qrUrl && <img src={qrUrl} alt="TOTP QR" className="mx-auto" />}
          <p className="text-xs font-mono bg-muted p-2 rounded break-all">{secret}</p>
          <input
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full px-3 py-2 border rounded-lg text-center tracking-widest"
            maxLength={6}
          />
          <button onClick={verifyEnrollment} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg w-full">
            Verify & Enable
          </button>
        </div>
      )}
      {step === 'backup' && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Backup Codes</h2>
          <p className="text-muted-foreground text-sm">Save these codes in a secure location.</p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="font-mono text-sm bg-muted p-2 rounded">{code}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MFAChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const totp = factors.data?.totp?.[0];
      if (!totp) throw new Error('No TOTP factor found');
      const challenge = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.data.id,
        code,
      });
      if (verify.error) throw verify.error;
      onSuccess();
    } catch (err) {
      console.error('MFA verification failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4 text-center">
      <h2 className="text-xl font-semibold">Two-Factor Verification</h2>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Enter 6-digit code"
        className="w-full px-3 py-2 border rounded-lg text-center tracking-widest"
        maxLength={6}
      />
      <button onClick={verify} disabled={loading || code.length !== 6}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg w-full disabled:opacity-50">
        {loading ? 'Verifying...' : 'Verify'}
      </button>
    </div>
  );
}`;
  }, [config]);

  return { config, updateConfig, generateCode };
}

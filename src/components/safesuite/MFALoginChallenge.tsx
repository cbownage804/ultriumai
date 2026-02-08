/**
 * MFA Login Challenge - Shown after password auth for users with MFA enabled
 * Includes "Trust this device for 30 days" checkbox
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertTriangle, Smartphone, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTrustedDevice } from '@/hooks/useTrustedDevice';

interface MFALoginChallengeProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function MFALoginChallenge({ onSuccess, onCancel }: MFALoginChallengeProps) {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { trustDevice: saveTrustedDevice } = useTrustedDevice();

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Call verify-mfa-login edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('verify-mfa-login', {
        body: { token: code }
      });

      if (response.error || response.data?.error) {
        setError(response.data?.error || response.error?.message || 'Verification failed');
        return;
      }

      // If user checked "trust device", save it
      if (trustDevice) {
        await saveTrustedDevice();
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <Badge variant="outline" className="mx-auto mb-2">
            <Smartphone className="h-3 w-3 mr-1" />
            Two-Factor Authentication
          </Badge>
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyDown}
              className="text-center text-2xl font-mono tracking-[0.5em] h-14"
              maxLength={6}
              autoFocus
            />

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Trust device checkbox */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="trustDevice"
              checked={trustDevice}
              onCheckedChange={(checked) => setTrustDevice(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="trustDevice" className="text-sm font-medium cursor-pointer">
                Trust this device for 30 days
              </Label>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Skip 2FA on this browser for 30 days
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || isVerifying}
              className="w-full gap-2"
            >
              {isVerifying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>

            {onCancel && (
              <Button variant="ghost" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

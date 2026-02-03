/**
 * Customer Portal Change Password Page
 * For users who must change their temporary password
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

export default function CustomerPortalChangePassword() {
  const navigate = useNavigate();
  const { session, updateSession } = usePortalSession();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(newPassword) },
    { label: 'Contains a special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    { label: 'Passwords match', met: newPassword === confirmPassword && newPassword.length > 0 },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !allRequirementsMet) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-auth', {
        body: {
          portalUserId: session.user.id,
          currentPassword,
          newPassword
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Update session to reflect password change
      updateSession({
        user: { ...session.user, mustChangePassword: false }
      });

      toast.success('Password changed successfully!');
      navigate('/customer-portal/dashboard');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    navigate('/customer-portal/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Change Your Password
              </CardTitle>
              <CardDescription className="text-white/60">
                Your password must be changed before continuing
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-white/80">Current/Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your temporary password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                    required
                  />
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 p-3 bg-white/5 rounded-lg">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {req.met ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-white/30" />
                    )}
                    <span className={req.met ? 'text-green-400' : 'text-white/50'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !allRequirementsMet || !currentPassword}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold h-11 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/40 text-xs mt-6">
          Powered by Ultrium Vanguard • Secure Customer Portal
        </p>
      </motion.div>
    </div>
  );
}

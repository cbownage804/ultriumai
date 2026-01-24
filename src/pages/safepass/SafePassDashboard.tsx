import { useState, useEffect } from 'react';
import { useSafePass } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { MasterPasswordSetup } from '@/components/safepass/MasterPasswordSetup';
import { PasswordVault } from '@/components/safepass/PasswordVault';
import { VaultLoadingScreen } from '@/components/safepass/VaultLoadingScreen';
import VanguardLinkingCard from '@/components/safepass/VanguardLinkingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  Unlock, 
  Shield, 
  AlertTriangle, 
  Key,
  Plus,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function SafePassDashboard() {
  const { 
    vaults, 
    entries, 
    isLoading, 
    selectedVault, 
    setSelectedVault,
    createVault,
    loadVaults 
  } = useSafePass();
  
  const {
    isUnlocked,
    isLocked,
    hasUserSetMasterPassword,
    setMasterPassword,
    unlockWithPassword,
    lock
  } = useMasterPassword();

  const [showMasterPasswordSetup, setShowMasterPasswordSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    // Check if user needs to set up master password
    if (!hasUserSetMasterPassword()) {
      setShowMasterPasswordSetup(true);
      setIsSettingUp(true);
    } else if (!isUnlocked) {
      setShowMasterPasswordSetup(true);
      setIsSettingUp(false);
    }
  }, [hasUserSetMasterPassword, isUnlocked]);

  const handleMasterPasswordSet = async (password: string) => {
    if (isSettingUp) {
      const success = await setMasterPassword(password);
      if (success) {
        setShowMasterPasswordSetup(false);
      }
    } else {
      const result = await unlockWithPassword(password);
      if (result.success) {
        setShowMasterPasswordSetup(false);
      }
    }
  };

  // Show master password setup/unlock screen
  if (showMasterPasswordSetup) {
    return (
      <div className="max-w-md mx-auto py-12">
        <MasterPasswordSetup
          isCreating={isSettingUp}
          onMasterPasswordSet={handleMasterPasswordSet}
          onCancel={() => {
            if (!isSettingUp) {
              setShowMasterPasswordSetup(false);
            }
          }}
          title={isSettingUp ? 'Create Master Password' : 'Unlock Your Vault'}
          description={
            isSettingUp
              ? 'Create a strong master password to encrypt your vault. This password cannot be recovered.'
              : 'Enter your master password to access your passwords.'
          }
        />
      </div>
    );
  }

  // Calculate stats
  const totalPasswords = entries.length;
  const weakPasswords = entries.filter(e => e.password_strength_score < 60).length;
  const strongPasswords = entries.filter(e => e.password_strength_score >= 80).length;
  const compromisedPasswords = entries.filter(e => e.is_compromised).length;
  const securityScore = totalPasswords > 0 
    ? Math.round((strongPasswords / totalPasswords) * 100) 
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-[400px]">
        <VaultLoadingScreen isLoading={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Password Vault</h1>
          <p className="text-gray-400">
            Securely manage and monitor your credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={lock} className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
            <Lock className="h-4 w-4 mr-2" />
            Lock Vault
          </Button>
          <Button onClick={() => setSelectedVault(null)} className="bg-amber-500 hover:bg-amber-600 text-black">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#141414] border-amber-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Security Score</p>
                <p className="text-2xl font-bold text-white">{securityScore}%</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                securityScore >= 80 ? 'bg-amber-500/20' : 
                securityScore >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <Shield className={`h-6 w-6 ${
                  securityScore >= 80 ? 'text-amber-500' : 
                  securityScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`} />
              </div>
            </div>
            <Progress value={securityScore} className="mt-3 bg-[#1a1a1a] [&>div]:bg-amber-500" />
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-amber-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Passwords</p>
                <p className="text-2xl font-bold text-white">{totalPasswords}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Key className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {vaults.length} vault{vaults.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-amber-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Weak Passwords</p>
                <p className="text-2xl font-bold text-yellow-500">{weakPasswords}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Need stronger passwords
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-amber-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Compromised</p>
                <p className="text-2xl font-bold text-red-500">{compromisedPasswords}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Found in breach databases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vanguard Upgrade Card */}
      <VanguardLinkingCard />

      {/* Main Content - Password Vault */}
      <PasswordVault />
    </div>
  );
}

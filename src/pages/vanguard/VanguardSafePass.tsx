import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Shield, 
  AlertTriangle, 
  Download, 
  Upload, 
  Lock,
  Unlock,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useSafePass } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { MasterPasswordSetup } from '@/components/safepass/MasterPasswordSetup';
import { PasswordVault } from '@/components/safepass/PasswordVault';
import { useToast } from '@/hooks/use-toast';

export default function VanguardSafePass() {
  const [activeTab, setActiveTab] = useState('vault');
  const { toast } = useToast();
  const { 
    vaults, 
    entries, 
    isLoading, 
  } = useSafePass();
  
  // Calculate security metrics from entries
  const totalPasswords = entries.length;
  const weakPasswords = entries.filter(e => e.password_strength_score < 50).length;
  const compromisedPasswords = entries.filter(e => e.is_compromised).length;
  const avgStrength = entries.length > 0 
    ? entries.reduce((sum, e) => sum + e.password_strength_score, 0) / entries.length 
    : 100;
  const securityScore = Math.round(
    (avgStrength * 0.5) + 
    ((1 - (weakPasswords / Math.max(totalPasswords, 1))) * 30) +
    ((1 - (compromisedPasswords / Math.max(totalPasswords, 1))) * 20)
  );
  
  const { 
    isUnlocked, 
    isLocked,
    masterPassword,
    setMasterPassword,
    unlockWithPassword,
    lock,
    hasUserSetMasterPassword,
    getRemainingLockoutTime
  } = useMasterPassword();

  const handleMasterPasswordSet = async (password: string) => {
    if (!hasUserSetMasterPassword()) {
      const success = await setMasterPassword(password);
      if (success) {
        toast({
          title: "Master password set",
          description: "Your vault is now protected and unlocked.",
        });
      }
    } else {
      const result = await unlockWithPassword(password);
      if (result.success) {
        toast({
          title: "Vault unlocked",
          description: "You can now access your passwords.",
        });
      } else {
        toast({
          title: "Unlock failed",
          description: result.error || "Incorrect password",
          variant: "destructive",
        });
      }
    }
  };

  // Show master password setup/unlock if not unlocked
  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">SafePass</h1>
          <p className="text-white/60">Secure password management integrated with Vanguard</p>
        </div>
        
        <div className="max-w-md mx-auto mt-12">
          <MasterPasswordSetup 
            onMasterPasswordSet={handleMasterPasswordSet}
            isCreating={!hasUserSetMasterPassword()}
            title={hasUserSetMasterPassword() ? 'Unlock Your Vault' : 'Create Master Password'}
            description={hasUserSetMasterPassword() 
              ? 'Enter your master password to access your passwords.' 
              : 'Create a strong master password to protect your vault.'
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Key className="h-8 w-8 text-cyan-400" />
            SafePass
          </h1>
          <p className="text-white/60">Secure password management integrated with Vanguard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => window.open('/safepass-app', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Full Portal
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={lock}
          >
            <Lock className="h-4 w-4 mr-2" />
            Lock Vault
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${
                securityScore >= 80 ? 'text-green-400' : 
                securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {securityScore}%
              </span>
              <Shield className={`h-5 w-5 ${
                securityScore >= 80 ? 'text-green-400' : 
                securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Total Passwords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-cyan-400">{totalPasswords}</span>
              <Key className="h-5 w-5 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Weak Passwords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-yellow-400">{weakPasswords}</span>
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Compromised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-red-400">{compromisedPasswords}</span>
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breach Monitor Status */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border-cyan-500/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Daily Breach Monitoring Active</h3>
                <p className="text-sm text-white/60">Your passwords are automatically checked against breach databases via Dehashed</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Protected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="vault" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Key className="h-4 w-4 mr-2" />
            Password Vault
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="breaches" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Breach Status
          </TabsTrigger>
          <TabsTrigger value="extension" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Download className="h-4 w-4 mr-2" />
            Browser Extension
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vault" className="space-y-4">
          <PasswordVault />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Import Passwords</CardTitle>
              <CardDescription className="text-white/60">
                Import your passwords from browsers and other password managers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Chrome', 'Firefox', '1Password', 'LastPass', 'Bitwarden', 'Dashlane', 'CSV File', 'JSON File'].map((source) => (
                  <Button
                    key={source}
                    variant="outline"
                    className="h-20 flex-col gap-2 border-white/20 text-white hover:bg-white/10"
                    onClick={() => window.open('/safepass-app/portal/import', '_blank')}
                  >
                    <Upload className="h-5 w-5" />
                    {source}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-white/40 text-center">
                Click any source to open the full import wizard in SafePass Portal
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                Breach Monitoring Status
              </CardTitle>
              <CardDescription className="text-white/60">
                Daily automated scans against Dehashed breach databases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium text-white">Last Scan</p>
                  <p className="text-sm text-white/60">Automated daily check</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  Today at 3:00 AM
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium text-white">Passwords Checked</p>
                  <p className="text-sm text-white/60">Against known breaches</p>
                </div>
                <span className="text-2xl font-bold text-cyan-400">{totalPasswords}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium text-white">Compromised Found</p>
                  <p className="text-sm text-white/60">Require immediate action</p>
                </div>
                <span className={`text-2xl font-bold ${compromisedPasswords > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {compromisedPasswords}
                </span>
              </div>

              <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Manual Breach Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extension" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">SafePass Browser Extension</CardTitle>
              <CardDescription className="text-white/60">
                Install the Chrome extension for seamless password autofill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-600/20 mb-4">
                  <Key className="h-10 w-10 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Chrome Extension</h3>
                <p className="text-white/60 mb-6 max-w-md mx-auto">
                  Auto-fill passwords, generate secure passwords, and get breach alerts right in your browser
                </p>
                <div className="flex justify-center gap-4">
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download Extension
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    View Installation Guide
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="text-center p-4">
                  <Unlock className="h-8 w-8 mx-auto text-cyan-400 mb-2" />
                  <h4 className="font-medium text-white">Auto-Fill</h4>
                  <p className="text-sm text-white/60">One-click login on any website</p>
                </div>
                <div className="text-center p-4">
                  <Shield className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                  <h4 className="font-medium text-white">Breach Alerts</h4>
                  <p className="text-sm text-white/60">Real-time compromise warnings</p>
                </div>
                <div className="text-center p-4">
                  <Key className="h-8 w-8 mx-auto text-green-400 mb-2" />
                  <h4 className="font-medium text-white">Password Generator</h4>
                  <p className="text-sm text-white/60">Create strong passwords instantly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

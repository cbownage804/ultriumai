/**
 * Vault Settings Page
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVaultAI } from '@/hooks/useVaultAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  KeyRound,
  Shield,
  Clock,
  Eye,
  Fingerprint,
  Lock,
  RefreshCw,
  Loader2,
  Sparkles,
  Brain,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function VaultSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clearingPatterns, setClearingPatterns] = useState(false);
  
  // VaultAI settings
  const { 
    isEnabled: aiEnabled, 
    learnPatterns, 
    toggleEnabled: setAiEnabled, 
    toggleLearnPatterns: setLearnPatterns,
    clearPatterns
  } = useVaultAI();
  
  // Vault-specific settings
  const [settings, setSettings] = useState({
    autoLockTimeout: 15,
    clipboardClearTime: 30,
    showPasswords: false,
    biometricUnlock: false,
    autoFill: true,
    passwordGenerator: {
      length: 16,
      includeNumbers: true,
      includeSymbols: true,
      includeUppercase: true,
      excludeAmbiguous: false
    }
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Vault settings saved');
    setLoading(false);
  };

  const handleClearPatterns = async () => {
    setClearingPatterns(true);
    await clearPatterns();
    toast.success('Learning patterns cleared');
    setClearingPatterns(false);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-yellow-500" />
          <span className="text-yellow-500">Vault</span> Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your password vault preferences
        </p>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vault Security
          </CardTitle>
          <CardDescription>
            Control how your vault is protected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Lock Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Lock vault after {settings.autoLockTimeout} minutes of inactivity
                </p>
              </div>
              <div className="w-32">
                <Slider
                  value={[settings.autoLockTimeout]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({ ...prev, autoLockTimeout: value }))
                  }
                  min={1}
                  max={60}
                  step={1}
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  Biometric Unlock
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use fingerprint or face ID to unlock vault
                </p>
              </div>
              <Switch
                variant="vault"
                checked={settings.biometricUnlock}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, biometricUnlock: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VaultAI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            VaultAI
          </CardTitle>
          <CardDescription>
            Intelligent credential suggestions and smart search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Enable VaultAI
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get intelligent credential suggestions based on context
                </p>
              </div>
              <Switch
                variant="vault"
                checked={aiEnabled}
                onCheckedChange={setAiEnabled}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Learn from Usage
                </Label>
                <p className="text-sm text-muted-foreground">
                  Remember your preferences to improve suggestions
                </p>
              </div>
              <Switch
                variant="vault"
                checked={learnPatterns}
                onCheckedChange={setLearnPatterns}
                disabled={!aiEnabled}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear Learned Patterns
                </Label>
                <p className="text-sm text-muted-foreground">
                  Reset all learned preferences and usage data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPatterns}
                disabled={clearingPatterns || !aiEnabled}
                className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
              >
                {clearingPatterns ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear Data'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clipboard Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clipboard & Display
          </CardTitle>
          <CardDescription>
            Control password visibility and clipboard behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Clear Clipboard</Label>
              <p className="text-sm text-muted-foreground">
                Auto-clear copied passwords after {settings.clipboardClearTime} seconds
              </p>
            </div>
            <div className="w-32">
              <Slider
                value={[settings.clipboardClearTime]}
                onValueChange={([value]) => 
                  setSettings(prev => ({ ...prev, clipboardClearTime: value }))
                }
                min={10}
                max={120}
                step={10}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Show Passwords by Default
              </Label>
              <p className="text-sm text-muted-foreground">
                Display passwords without clicking reveal
              </p>
            </div>
              <Switch
                variant="vault"
                checked={settings.showPasswords}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, showPasswords: checked }))
                }
              />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-Fill</Label>
              <p className="text-sm text-muted-foreground">
                Automatically fill login forms in browser extension
              </p>
            </div>
              <Switch
                variant="vault"
                checked={settings.autoFill}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, autoFill: checked }))
                }
              />
          </div>
        </CardContent>
      </Card>

      {/* Password Generator Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Password Generator
          </CardTitle>
          <CardDescription>
            Configure default password generation rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Password Length: {settings.passwordGenerator.length}</Label>
              <Slider
                value={[settings.passwordGenerator.length]}
                onValueChange={([value]) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    passwordGenerator: { ...prev.passwordGenerator, length: value }
                  }))
                }
                min={8}
                max={64}
                step={1}
              />
            </div>
            <Separator />
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>Include Numbers (0-9)</Label>
                <Switch
                  variant="vault"
                  checked={settings.passwordGenerator.includeNumbers}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      passwordGenerator: { ...prev.passwordGenerator, includeNumbers: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Include Symbols (!@#$...)</Label>
                <Switch
                  variant="vault"
                  checked={settings.passwordGenerator.includeSymbols}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      passwordGenerator: { ...prev.passwordGenerator, includeSymbols: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Include Uppercase (A-Z)</Label>
                <Switch
                  variant="vault"
                  checked={settings.passwordGenerator.includeUppercase}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      passwordGenerator: { ...prev.passwordGenerator, includeUppercase: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exclude Ambiguous (0, O, l, 1, etc.)</Label>
                <Switch
                  variant="vault"
                  checked={settings.passwordGenerator.excludeAmbiguous}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      passwordGenerator: { ...prev.passwordGenerator, excludeAmbiguous: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}

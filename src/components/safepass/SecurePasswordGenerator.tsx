import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Copy, 
  RefreshCw, 
  Settings, 
  Shield, 
  Eye, 
  EyeOff,
  Dices,
  Lock,
  CheckCircle
} from 'lucide-react';
import { 
  generateSecurePassword, 
  generatePassphrase, 
  calculatePasswordStrength 
} from '@/utils/crypto';
import { useToast } from '@/hooks/use-toast';

interface SecurePasswordGeneratorProps {
  onPasswordSelect?: (password: string) => void;
  defaultLength?: number;
  embedded?: boolean;
}

export const SecurePasswordGenerator = ({ 
  onPasswordSelect, 
  defaultLength = 16,
  embedded = false 
}: SecurePasswordGeneratorProps) => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [activeTab, setActiveTab] = useState('password');
  
  // Password options
  const [passwordOptions, setPasswordOptions] = useState({
    length: defaultLength,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false
  });
  
  // Passphrase options
  const [passphraseOptions, setPassphraseOptions] = useState({
    wordCount: 4,
    separator: '-',
    includeNumbers: false,
    capitalizeFirst: true
  });
  
  const { toast } = useToast();

  // Generate initial password
  useEffect(() => {
    generateNewPassword();
  }, []);

  const generateNewPassword = () => {
    try {
      if (activeTab === 'password') {
        const password = generateSecurePassword(passwordOptions);
        setGeneratedPassword(password);
      } else {
        const passphrase = generatePassphrase(passphraseOptions);
        setGeneratedPassword(passphrase);
      }
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate password. Please check your settings.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy password to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleUsePassword = () => {
    if (onPasswordSelect) {
      onPasswordSelect(generatedPassword);
      toast({
        title: "Password Selected",
        description: "Password has been applied to the form",
      });
    }
  };

  const passwordStrength = calculatePasswordStrength(generatedPassword);

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'text-red-600 bg-red-100';
      case 'weak': return 'text-orange-600 bg-orange-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'strong': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const CardWrapper = embedded ? 'div' : Card;
  const cardProps = embedded ? {} : {};

  return (
    <CardWrapper {...cardProps}>
      {!embedded && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Password Generator
          </CardTitle>
          <CardDescription>
            Generate cryptographically secure passwords and passphrases
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {/* Generated Password Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Generated Password</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStrengthColor(passwordStrength.level)}>
                {passwordStrength.level.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({passwordStrength.score}%)
              </Badge>
            </div>
          </div>
          
          <div className="relative">
            <Input
              value={generatedPassword}
              readOnly
              type={showPassword ? 'text' : 'password'}
              className="pr-20 font-mono text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="h-8 w-8 p-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Progress value={passwordStrength.score} className="h-2" />
          
          <div className="flex gap-2">
            <Button onClick={generateNewPassword} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New
            </Button>
            {onPasswordSelect && (
              <Button onClick={handleUsePassword} size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Use This Password
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Generator Options */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
            <TabsTrigger value="passphrase" className="flex items-center gap-2">
              <Dices className="h-4 w-4" />
              Passphrase
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="password" className="space-y-4 mt-4">
            {/* Password Length */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Length: {passwordOptions.length}</Label>
                <span className="text-sm text-muted-foreground">8-128 characters</span>
              </div>
              <Slider
                value={[passwordOptions.length]}
                onValueChange={(value) => setPasswordOptions(prev => ({ ...prev, length: value[0] }))}
                min={8}
                max={128}
                step={1}
                className="w-full"
              />
            </div>

            {/* Character Options */}
            <div className="space-y-3">
              <Label>Character Types</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uppercase"
                    checked={passwordOptions.includeUppercase}
                    onCheckedChange={(checked) => 
                      setPasswordOptions(prev => ({ ...prev, includeUppercase: !!checked }))
                    }
                  />
                  <Label htmlFor="uppercase" className="text-sm">
                    Uppercase Letters (A-Z)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={passwordOptions.includeLowercase}
                    onCheckedChange={(checked) => 
                      setPasswordOptions(prev => ({ ...prev, includeLowercase: !!checked }))
                    }
                  />
                  <Label htmlFor="lowercase" className="text-sm">
                    Lowercase Letters (a-z)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="numbers"
                    checked={passwordOptions.includeNumbers}
                    onCheckedChange={(checked) => 
                      setPasswordOptions(prev => ({ ...prev, includeNumbers: !!checked }))
                    }
                  />
                  <Label htmlFor="numbers" className="text-sm">
                    Numbers (0-9)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="symbols"
                    checked={passwordOptions.includeSymbols}
                    onCheckedChange={(checked) => 
                      setPasswordOptions(prev => ({ ...prev, includeSymbols: !!checked }))
                    }
                  />
                  <Label htmlFor="symbols" className="text-sm">
                    Symbols (!@#$%^&*)
                  </Label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-3">
              <Label>Advanced Options</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-similar"
                    checked={passwordOptions.excludeSimilar}
                    onCheckedChange={(checked) => 
                      setPasswordOptions(prev => ({ ...prev, excludeSimilar: !!checked }))
                    }
                  />
                  <Label htmlFor="exclude-similar" className="text-sm">
                    Exclude similar characters (i, l, 1, L, o, 0, O)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-ambiguous"
                    checked={passwordOptions.excludeAmbiguous}
                    onCheckedChange={(checked) => 
                      setPasswordOptions(prev => ({ ...prev, excludeAmbiguous: !!checked }))
                    }
                  />
                  <Label htmlFor="exclude-ambiguous" className="text-sm">
                    Exclude ambiguous symbols ({'"'}[]{}|`~)
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="passphrase" className="space-y-4 mt-4">
            {/* Word Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Word Count: {passphraseOptions.wordCount}</Label>
                <span className="text-sm text-muted-foreground">3-8 words</span>
              </div>
              <Slider
                value={[passphraseOptions.wordCount]}
                onValueChange={(value) => setPassphraseOptions(prev => ({ ...prev, wordCount: value[0] }))}
                min={3}
                max={8}
                step={1}
                className="w-full"
              />
            </div>

            {/* Separator */}
            <div className="space-y-2">
              <Label htmlFor="separator">Word Separator</Label>
              <Input
                id="separator"
                value={passphraseOptions.separator}
                onChange={(e) => setPassphraseOptions(prev => ({ ...prev, separator: e.target.value }))}
                maxLength={3}
                placeholder="-"
              />
            </div>

            {/* Passphrase Options */}
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="capitalize-first"
                    checked={passphraseOptions.capitalizeFirst}
                    onCheckedChange={(checked) => 
                      setPassphraseOptions(prev => ({ ...prev, capitalizeFirst: !!checked }))
                    }
                  />
                  <Label htmlFor="capitalize-first" className="text-sm">
                    Capitalize first letter of each word
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-numbers-phrase"
                    checked={passphraseOptions.includeNumbers}
                    onCheckedChange={(checked) => 
                      setPassphraseOptions(prev => ({ ...prev, includeNumbers: !!checked }))
                    }
                  />
                  <Label htmlFor="include-numbers-phrase" className="text-sm">
                    Add numbers at the end
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>


        {/* Security Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Information
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Uses cryptographically secure random number generation</li>
            <li>• Employs rejection sampling to avoid modulo bias</li>
            <li>• Passwords are generated locally in your browser</li>
            <li>• No data is sent to any server</li>
          </ul>
        </div>
      </CardContent>
    </CardWrapper>
  );
};
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Lock, Key, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { validateMasterPassword, calculatePasswordStrength, generateSecurePassword } from '@/utils/crypto';

interface MasterPasswordSetupProps {
  // Some callers return { success, ... } objects; we await it but don't depend on the return type.
  onMasterPasswordSet: (masterPassword: string) => unknown | Promise<unknown>;
  onCancel?: () => void;
  isCreating?: boolean;
  title?: string;
  description?: string;
}

export const MasterPasswordSetup = ({
  onMasterPasswordSet,
  onCancel,
  isCreating = true,
  title,
  description
}: MasterPasswordSetupProps) => {
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(masterPassword);
  const passwordValidation = validateMasterPassword(masterPassword);
  const passwordsMatch = masterPassword === confirmPassword;
  
  // For unlock mode, only require password. For create mode, require validation + confirmation
  const canSubmit = isCreating 
    ? (passwordValidation.isValid && passwordsMatch && masterPassword.length > 0)
    : masterPassword.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsLoading(true);
    try {
      // Await unlock/setup so the UI stays responsive and prevents double-submits
      await Promise.resolve(onMasterPasswordSet(masterPassword));
    } catch (error) {
      console.error('Error setting master password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const generated = generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    });
    setMasterPassword(generated);
    setConfirmPassword('');
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'bg-red-500';
      case 'weak': return 'bg-primary';
      case 'fair': return 'bg-primary';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = (level: string) => {
    switch (level) {
      case 'very-weak': return 'Very Weak';
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          {title || (isCreating ? 'Create Master Password' : 'Enter Master Password')}
        </CardTitle>
        <CardDescription>
          {description || (isCreating 
            ? 'Your master password encrypts all your data and cannot be recovered if lost.'
            : 'Enter your master password to unlock your vault.'
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isCreating && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> We cannot recover your master password. 
              Store it securely - losing it means losing access to all your data.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Master Password Input */}
          <div className="space-y-2">
            <Label htmlFor="master-password">Master Password</Label>
            <div className="relative">
              <Input
                id="master-password"
                type={showPassword ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit && !isLoading) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Enter your master password"
                className="pr-10 border-primary/30 focus-visible:ring-primary/50"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {isCreating && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateStrongPassword}
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                Generate Strong Password
              </Button>
            )}
          </div>

          {/* Password Strength Indicator */}
          {masterPassword && isCreating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Password Strength:</span>
                <span className={`font-medium ${
                  passwordStrength.level === 'strong' ? 'text-green-600' :
                  passwordStrength.level === 'good' ? 'text-blue-600' :
                  passwordStrength.level === 'fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getStrengthText(passwordStrength.level)} ({passwordStrength.score}%)
                </span>
              </div>
              
              <div className="relative">
                <Progress value={passwordStrength.score} className="h-2" />
                <div 
                  className={`absolute inset-0 h-2 rounded-full ${getStrengthColor(passwordStrength.level)}`}
                  style={{ width: `${passwordStrength.score}%` }}
                />
              </div>
              
              {passwordStrength.feedback.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {passwordStrength.feedback.map((tip, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {masterPassword && !passwordValidation.isValid && isCreating && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Confirm Password */}
          {isCreating && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Master Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your master password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
              
              {confirmPassword && passwordsMatch && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="w-full bg-primary hover:bg-primary text-black font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              isCreating ? 'Create Vault' : 'Unlock Vault'
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Forgot Master Password Link - only show on unlock (not creating) */}
        {!isCreating && (
          <div className="text-center mt-3">
            <Link 
              to="/pass/reset-master-password" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your master password?
            </Link>
          </div>
        )}

        {/* Security Note */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Features
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• AES-256-GCM authenticated encryption</li>
            <li>• Zero-knowledge architecture</li>
            <li>• 600,000 PBKDF2 iterations (OWASP 2023)</li>
            <li>• Tamper-proof AAD binding</li>
          </ul>
          <a 
            href="/products/safepass/security" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
          >
            Learn more about our security
            <Info className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
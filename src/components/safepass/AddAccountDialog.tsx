/**
 * AddAccountDialog - Dialog to link a new Vault account or authenticate for switching
 */

import { useState } from 'react';
import { useLinkedAccounts } from '@/hooks/useLinkedAccounts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Lock, Mail, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingEmail?: string | null;
  onAuthenticate?: (email: string, password: string) => Promise<void>;
}

export function AddAccountDialog({ 
  open, 
  onOpenChange, 
  pendingEmail,
  onAuthenticate 
}: AddAccountDialogProps) {
  const { addLinkedAccount } = useLinkedAccounts();
  
  const [mode, setMode] = useState<'add' | 'authenticate'>(() => 
    pendingEmail ? 'authenticate' : 'add'
  );
  const [email, setEmail] = useState(pendingEmail || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail(pendingEmail || '');
      setPassword('');
      setDisplayName('');
      setMode(pendingEmail ? 'authenticate' : 'add');
    } else if (pendingEmail) {
      setEmail(pendingEmail);
      setMode('authenticate');
    }
    onOpenChange(open);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await addLinkedAccount(email.trim(), displayName.trim() || email.split('@')[0]);
      
      if (result.success) {
        toast.success('Account linked successfully');
        handleOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to link account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      if (onAuthenticate) {
        await onAuthenticate(email.trim(), password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#141414] border-amber-500/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            {mode === 'authenticate' ? (
              <>
                <Lock className="h-5 w-5" />
                Sign In to Switch
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Add Account
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'authenticate' 
              ? 'Enter your password to switch to this account.'
              : 'Link another Vault account for quick switching.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'add' ? (
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="account@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-300">
                Display Name <span className="text-gray-500">(optional)</span>
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Work, Personal, etc."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Account'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authEmail" className="text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="authEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-amber-500/20 focus:border-amber-500"
                  required
                  disabled={!!pendingEmail}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-amber-500/20 focus:border-amber-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In & Switch'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

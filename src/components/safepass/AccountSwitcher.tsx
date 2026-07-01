/**
 * AccountSwitcher - Multi-account switching dropdown for Vault
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLinkedAccounts, LinkedAccount } from '@/hooks/useLinkedAccounts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Loader2, 
  UserPlus,
  X,
  RefreshCw
} from 'lucide-react';
import { AddAccountDialog } from './AddAccountDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AccountSwitcherProps {
  className?: string;
}

export function AccountSwitcher({ className }: AccountSwitcherProps) {
  const { user } = useAuth();
  const {
    linkedAccounts,
    currentAccountEmail,
    isSwitching,
    switchToAccount,
    authenticateAndSwitch,
    removeLinkedAccount,
  } = useLinkedAccounts();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);

  const getInitials = (email: string, displayName?: string) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handleSwitchAccount = async (account: LinkedAccount) => {
    const result = await switchToAccount(account.linked_email);
    
    if (result.success) {
      toast.success(`Switched to ${account.display_name}`);
      setIsOpen(false);
      // Reload page to refresh vault data
      window.location.reload();
    } else if (result.needsPassword) {
      // Need to show password prompt
      setPendingSwitch(account.linked_email);
      setShowAddDialog(true);
    } else {
      toast.error(result.error || 'Failed to switch account');
    }
  };

  const handleRemoveAccount = async (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    if (confirm('Remove this linked account?')) {
      const success = await removeLinkedAccount(accountId);
      if (success) {
        toast.success('Account removed');
      } else {
        toast.error('Failed to remove account');
      }
    }
  };

  const handleAuthenticateSwitch = async (email: string, password: string) => {
    const result = await authenticateAndSwitch(email, password);
    
    if (result.success) {
      toast.success('Switched account successfully');
      setShowAddDialog(false);
      setPendingSwitch(null);
      window.location.reload();
    } else {
      toast.error(result.error || 'Authentication failed');
    }
  };

  const currentEmail = currentAccountEmail || user?.email || '';
  const isPrimaryAccount = currentEmail === user?.email;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "flex items-center gap-2 px-2 py-1 h-auto hover:bg-primary/10",
              className
            )}
            disabled={isSwitching}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {getInitials(currentEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-xs font-medium text-gray-200 truncate max-w-[120px]">
                {currentEmail}
              </span>
              {linkedAccounts.length > 0 && (
                <span className="text-[10px] text-gray-500">
                  {linkedAccounts.length + 1} accounts
                </span>
              )}
            </div>
            {isSwitching ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-muted border-primary/20"
        >
          <DropdownMenuLabel className="text-gray-400 text-xs">
            Switch Account
          </DropdownMenuLabel>
          
          {/* Primary Account */}
          <DropdownMenuItem
            onClick={() => !isPrimaryAccount && handleSwitchAccount({
              id: 'primary',
              primary_user_id: user?.id || '',
              linked_email: user?.email || '',
              linked_user_id: user?.id || '',
              display_name: 'Primary',
              is_active: true,
              last_accessed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            })}
            className={cn(
              "flex items-center gap-3 cursor-pointer hover:bg-primary/10",
              isPrimaryAccount && "bg-primary/10"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary">
                {getInitials(user?.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                Primary Account
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            {isPrimaryAccount && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
          
          {/* Linked Accounts */}
          {linkedAccounts.map((account) => {
            const isActive = currentEmail === account.linked_email;
            
            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => !isActive && handleSwitchAccount(account)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer hover:bg-primary/10 group",
                  isActive && "bg-primary/10"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500/20 text-blue-400">
                    {getInitials(account.linked_email, account.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {account.display_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {account.linked_email}
                  </p>
                </div>
                {isActive ? (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => handleRemoveAccount(e, account.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator className="bg-primary/10" />
          
          {/* Add Account Button */}
          <DropdownMenuItem
            onClick={() => {
              setPendingSwitch(null);
              setShowAddDialog(true);
            }}
            className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 text-primary"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <AddAccountDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setPendingSwitch(null);
        }}
        pendingEmail={pendingSwitch}
        onAuthenticate={handleAuthenticateSwitch}
      />
    </>
  );
}

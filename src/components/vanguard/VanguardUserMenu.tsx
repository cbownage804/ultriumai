import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function VanguardUserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success('Signed out successfully');
      navigate('/vanguard/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    const name = user.user_metadata?.full_name || user.user_metadata?.name;
    
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    
    return email[0].toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user?.email) return 'User';
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-cyan-400/50 transition-all"
        >
          <Avatar className="h-9 w-9 border-2 border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-bold text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-black/95 border-cyan-500/30 backdrop-blur-xl shadow-xl shadow-purple-500/10"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white leading-none">{getUserDisplayName()}</p>
            <p className="text-xs text-slate-400 leading-none truncate">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        
        <DropdownMenuItem 
          onClick={() => navigate('/vanguard/admin')}
          className="text-slate-300 hover:text-white hover:bg-cyan-500/10 cursor-pointer"
        >
          <User className="mr-2 h-4 w-4 text-cyan-400" />
          <span>My Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/vanguard/admin')}
          className="text-slate-300 hover:text-white hover:bg-cyan-500/10 cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4 text-cyan-400" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/vanguard/msp-billing')}
          className="text-slate-300 hover:text-white hover:bg-cyan-500/10 cursor-pointer"
        >
          <CreditCard className="mr-2 h-4 w-4 text-cyan-400" />
          <span>Billing</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/vanguard/knowledge')}
          className="text-slate-300 hover:text-white hover:bg-cyan-500/10 cursor-pointer"
        >
          <HelpCircle className="mr-2 h-4 w-4 text-cyan-400" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        
        <DropdownMenuItem 
          onClick={() => navigate('/vanguard/admin')}
          className="text-slate-300 hover:text-white hover:bg-purple-500/10 cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4 text-purple-400" />
          <span>Security</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

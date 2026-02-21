/**
 * Lovable-style Project Dropdown Menu
 * Includes: navigation, settings, appearance (theme), help
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft, Settings, Heart, Pencil, Rocket,
  Sun, Moon, Monitor, ExternalLink, ChevronDown, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserCredits } from '@/hooks/useUserCredits';

// Extracted credit bar so the hook is always called at component top level
function CreditBarItem({ onOpenBilling }: { onOpenBilling: () => void }) {
  const { credits, dailyRemaining, monthlyRemaining, totalRemaining } = useUserCredits();
  const dailyLimit = credits.daily_credits_limit;
  const monthlyLimit = credits.monthly_credits_limit;
  const bonus = Math.max(0, credits.bonus_credits);
  const totalLimit = dailyLimit + monthlyLimit + bonus;
  const safeDaily = Math.max(0, dailyRemaining);
  const safeMonthly = Math.max(0, monthlyRemaining);
  const safeBonus = Math.max(0, bonus);
  const dailyW = totalLimit > 0 ? (safeDaily / totalLimit) * 100 : 0;
  const monthlyW = totalLimit > 0 ? (safeMonthly / totalLimit) * 100 : 0;
  const bonusW = totalLimit > 0 ? (safeBonus / totalLimit) * 100 : 0;

  return (
    <DropdownMenuItem
      onClick={onOpenBilling}
      className="flex-col items-start gap-1 cursor-pointer px-2.5 py-2.5"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium text-white/80">Credits</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/60">{Math.max(0, totalRemaining)}</span>
          <span className="text-xs text-white/40">View details →</span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
        {dailyW > 0 && <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${dailyW}%` }} />}
        {monthlyW > 0 && <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${monthlyW}%` }} />}
        {bonusW > 0 && <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${bonusW}%` }} />}
      </div>
    </DropdownMenuItem>
  );
}


const AppearanceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
  </svg>
);

interface ProjectDropdownMenuProps {
  projectName: string;
  isGenerating: boolean;
  hasFiles: boolean;
  onRename: () => void;
  onOpenSettings: () => void;
  onPublish: () => void;
  onOpenBilling: () => void;
}

type ThemeChoice = 'light' | 'dark' | 'system';

export function ProjectDropdownMenu({
  projectName,
  isGenerating,
  hasFiles,
  onRename,
  onOpenSettings,
  onPublish,
  onOpenBilling,
}: ProjectDropdownMenuProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    return (localStorage.getItem('app-builder-theme') as ThemeChoice) || 'system';
  });
  const [isFavorited, setIsFavorited] = useState(() => {
    const favs = JSON.parse(localStorage.getItem('app-builder-favorites') || '[]');
    return favs.includes(projectName);
  });

  const handleThemeChange = useCallback((newTheme: ThemeChoice) => {
    setTheme(newTheme);
    localStorage.setItem('app-builder-theme', newTheme);

    const root = document.documentElement;
    if (newTheme === 'dark' || newTheme === 'system') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  const handleToggleFavorite = useCallback(() => {
    const favs: string[] = JSON.parse(localStorage.getItem('app-builder-favorites') || '[]');
    let updated: string[];
    if (favs.includes(projectName)) {
      updated = favs.filter(f => f !== projectName);
      setIsFavorited(false);
      toast.success('Removed from favorites');
    } else {
      updated = [...favs, projectName];
      setIsFavorited(true);
      toast.success('Added to favorites');
    }
    localStorage.setItem('app-builder-favorites', JSON.stringify(updated));
  }, [projectName]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors truncate max-w-[200px]">
          {projectName}
          <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-64 bg-[#0f0f14] border-white/10 p-1"
      >
        {/* Go to Dashboard */}
        <DropdownMenuItem
          onClick={() => navigate('/ai-studio')}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06] my-1" />

        {/* Credits — real data */}
        <CreditBarItem onOpenBilling={onOpenBilling} />

        <DropdownMenuSeparator className="bg-white/[0.06] my-1" />

        {/* Settings */}
        <DropdownMenuItem
          onClick={onOpenSettings}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <Settings className="h-4 w-4" />
          Settings
          <span className="ml-auto text-[10px] text-white/25 font-mono">Ctrl+,</span>
        </DropdownMenuItem>

        {/* Rename */}
        <DropdownMenuItem
          onClick={onRename}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <Pencil className="h-4 w-4" />
          Rename project
        </DropdownMenuItem>

        {/* Publish */}
        <DropdownMenuItem
          onClick={onPublish}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <Rocket className="h-4 w-4" />
          Publish
        </DropdownMenuItem>

        {/* Add to Favorites */}
        <DropdownMenuItem
          onClick={handleToggleFavorite}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-red-400 text-red-400")} />
          {isFavorited ? 'Remove from Favorites' : 'Add Project To Favorites'}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06] my-1" />

        {/* Appearance submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2 data-[state=open]:bg-white/[0.06] data-[state=open]:text-white">
            <AppearanceIcon />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={8}
            className="bg-[#0f0f14] border-white/10 p-1 min-w-[160px]"
          >
            <DropdownMenuItem
              onClick={() => handleThemeChange('light')}
              className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
            >
              <Sun className="h-4 w-4" />
              Light
              {theme === 'light' && <Check className="h-3.5 w-3.5 ml-auto text-white/50" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleThemeChange('dark')}
              className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
            >
              <Moon className="h-4 w-4" />
              Dark
              {theme === 'dark' && <Check className="h-3.5 w-3.5 ml-auto text-white/50" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleThemeChange('system')}
              className={cn(
                "gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2",
                theme === 'system' && "bg-white/[0.06]"
              )}
            >
              <Monitor className="h-4 w-4" />
              System
              {theme === 'system' && <Check className="h-3.5 w-3.5 ml-auto text-white/50" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Help */}
        <DropdownMenuItem
          onClick={() => window.open('https://ultriumai.com/help', '_blank')}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <ExternalLink className="h-4 w-4" />
          Help
          <ExternalLink className="h-3 w-3 ml-auto text-white/20" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

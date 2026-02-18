/**
 * Lovable-style Project Dropdown Menu
 * Includes: navigation, settings, appearance (theme), help
 */

import { useState } from 'react';
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
  ArrowLeft, Settings, Star, Pencil, Rocket,
  Sun, Moon, Monitor, ExternalLink, Gift, ChevronDown, Check, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Simple icon since CircleHalf doesn't exist in lucide
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
  onStar?: () => void;
  isStarred?: boolean;
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
  onStar,
  isStarred = false,
}: ProjectDropdownMenuProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    return (localStorage.getItem('app-builder-theme') as ThemeChoice) || 'system';
  });

  const handleThemeChange = (newTheme: ThemeChoice) => {
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
  };

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

        {/* Credits */}
        <DropdownMenuItem
          onClick={onOpenBilling}
          className="flex-col items-start gap-1 cursor-pointer px-2.5 py-2.5"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-white/80">Credits</span>
            <span className="text-xs text-white/50">View details →</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500" style={{ width: '65%' }} />
          </div>
        </DropdownMenuItem>

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
          {!hasFiles && (
            <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 bg-white/[0.06] text-white/30 border-0">
              New
            </Badge>
          )}
        </DropdownMenuItem>

        {/* Star */}
        <DropdownMenuItem
          onClick={onStar}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <Star className={cn("h-4 w-4", isStarred && "fill-amber-400 text-amber-400")} />
          {isStarred ? 'Unstar project' : 'Star project'}
        </DropdownMenuItem>

        {/* Bonuses */}
        <DropdownMenuItem
          onClick={onOpenBilling}
          className="gap-2.5 text-white/70 hover:text-white cursor-pointer px-2.5 py-2"
        >
          <Gift className="h-4 w-4" />
          Bonuses
          <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 bg-cyan-500/15 text-cyan-400 border-0">
            New
          </Badge>
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
          onClick={() => window.open('https://docs.lovable.dev', '_blank')}
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

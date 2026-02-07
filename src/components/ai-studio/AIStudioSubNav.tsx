import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bot, Code2, Workflow, MessageSquare, Sparkles, LayoutDashboard } from 'lucide-react';
import aiStudioLogo from '@/assets/ai-studio-logo.png';

const navItems = [
  { path: '/ai-studio', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/ai-studio/assistant', label: 'Assistant', icon: MessageSquare },
  { path: '/ai-studio/agents', label: 'Agents', icon: Bot },
  { path: '/ai-studio/workflows', label: 'Workflows', icon: Workflow },
  { path: '/ai-studio/app-builder', label: 'App Builder', icon: Code2 },
];

export function AIStudioSubNav() {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto py-2 scrollbar-hide -mx-2 px-2 snap-x snap-mandatory">
          {/* Logo */}
          <Link to="/ai-studio" className="flex items-center gap-2 mr-2 sm:mr-4 shrink-0">
            <div className="w-7 h-7 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
              <img src={aiStudioLogo} alt="AI Studio" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-primary hidden sm:inline">AI Studio</span>
          </Link>

          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors shrink-0 snap-start min-h-[36px]",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/ai-studio/use-cases"
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors shrink-0 ml-auto snap-start min-h-[36px]",
              location.pathname === '/ai-studio/use-cases'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">Use Cases</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

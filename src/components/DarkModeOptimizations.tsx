import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';

// Enhanced theme toggle with system preference
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 px-0">
        <div className="h-4 w-4 animate-pulse bg-muted rounded" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0 hover-scale">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
          <Sun className="h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
          <Moon className="h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
          <Monitor className="h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Dark mode optimized card component
interface DarkModeCardProps {
  children: React.ReactNode;
  className?: string;
  glowEffect?: boolean;
}

export const DarkModeCard = ({ children, className = '', glowEffect = false }: DarkModeCardProps) => {
  const cardClass = `
    ${glowEffect ? 'card-glow' : 'card-elevated'}
    backdrop-blur-xl 
    bg-card/80 
    border-border/40
    dark:bg-card/60
    dark:border-border/30
    transition-all duration-300
    ${className}
  `;

  return (
    <Card className={cardClass}>
      {children}
    </Card>
  );
};

// Dark mode optimized gradient text
interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientText = ({ children, className = '' }: GradientTextProps) => {
  return (
    <span className={`
      bg-gradient-to-r 
      from-primary 
      via-primary-glow 
      to-primary-dark
      dark:from-primary-glow
      dark:via-primary
      dark:to-primary-dark
      bg-clip-text 
      text-transparent 
      animate-glow
      ${className}
    `}>
      {children}
    </span>
  );
};

// Dark mode optimized button with glow effect
interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  glowColor?: 'primary' | 'success' | 'warning' | 'destructive';
}

export const GlowButton = ({ 
  children, 
  onClick, 
  variant = 'default',
  className = '',
  glowColor = 'primary'
}: GlowButtonProps) => {
  const glowClass = {
    primary: 'hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] dark:hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)]',
    success: 'hover:shadow-[0_0_20px_hsl(var(--success)/0.5)] dark:hover:shadow-[0_0_25px_hsl(var(--success)/0.6)]',
    warning: 'hover:shadow-[0_0_20px_hsl(var(--warning)/0.5)] dark:hover:shadow-[0_0_25px_hsl(var(--warning)/0.6)]',
    destructive: 'hover:shadow-[0_0_20px_hsl(var(--destructive)/0.5)] dark:hover:shadow-[0_0_25px_hsl(var(--destructive)/0.6)]',
  };

  return (
    <Button 
      variant={variant}
      onClick={onClick}
      className={`
        transition-all duration-300
        hover-scale
        ${glowClass[glowColor]}
        ${className}
      `}
    >
      {children}
    </Button>
  );
};

// Dark mode status indicator
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error';
  label?: string;
  showPulse?: boolean;
}

export const StatusIndicator = ({ status, label, showPulse = true }: StatusIndicatorProps) => {
  const statusConfig = {
    online: {
      color: 'bg-success',
      darkColor: 'dark:bg-success',
      label: 'Online'
    },
    offline: {
      color: 'bg-muted-foreground',
      darkColor: 'dark:bg-muted-foreground',
      label: 'Offline'
    },
    warning: {
      color: 'bg-warning',
      darkColor: 'dark:bg-warning',
      label: 'Warning'
    },
    error: {
      color: 'bg-destructive',
      darkColor: 'dark:bg-destructive',
      label: 'Error'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-2 h-2 rounded-full 
        ${config.color} 
        ${config.darkColor}
        ${showPulse ? 'animate-pulse' : ''}
      `} />
      {label && (
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
};

// Dark mode optimized glass morphism container
interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}

export const GlassContainer = ({ 
  children, 
  className = '',
  intensity = 'medium'
}: GlassContainerProps) => {
  const intensityClass = {
    light: 'bg-background/20 backdrop-blur-sm border-border/10',
    medium: 'bg-background/40 backdrop-blur-md border-border/20',
    heavy: 'bg-background/60 backdrop-blur-lg border-border/30'
  };

  return (
    <div className={`
      rounded-lg border
      ${intensityClass[intensity]}
      dark:bg-background/20 
      dark:backdrop-blur-xl
      dark:border-border/20
      transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
};

// Enhanced dark mode hook
export const useDarkMode = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const isLight = mounted ? resolvedTheme === 'light' : false;
  const isSystem = theme === 'system';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark,
    isLight,
    isSystem,
    toggleTheme,
    mounted
  };
};
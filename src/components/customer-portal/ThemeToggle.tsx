/**
 * Theme Toggle Component
 * Light/dark mode toggle button for portal
 */

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortalTheme } from '@/contexts/PortalThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = usePortalTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="text-white/60 hover:text-white hover:bg-white/10"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

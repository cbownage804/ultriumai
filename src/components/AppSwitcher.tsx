import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import vanguardLogo from '@/assets/vanguard-logo.png';
import safesuiteLogo from '@/assets/safesuite-logo.png';
import aiStudioLogo from '@/assets/ai-studio-logo.png';

const apps = [
  { name: 'Vanguard', logo: vanguardLogo, path: '/vanguard' },
  { name: 'SafeSuite', logo: safesuiteLogo, path: '/safesuite' },
  { name: 'AI Studio', logo: aiStudioLogo, path: '/ai-studio' },
];

export function AppSwitcher() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Open app launcher"
        >
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(90vw,360px)] p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 px-1">Apps</p>
        <div className="grid grid-cols-3 gap-2">
          {apps.map((app) => (
            <Link
              key={app.name}
              to={app.path}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl p-2 hover:bg-accent transition-colors"
            >
              <img src={app.logo} alt={app.name} className="h-16 sm:h-20 w-auto object-contain" />
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

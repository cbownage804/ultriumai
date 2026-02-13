import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Shield, Brain, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const apps = [
  {
    name: 'Vanguard',
    description: 'RMM & Security',
    icon: Shield,
    path: '/vanguard',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'SafeSuite',
    description: 'Compliance & Tools',
    icon: Cpu,
    path: '/safesuite',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'AI Studio',
    description: 'Build & Automate',
    icon: Brain,
    path: '/ai-studio',
    gradient: 'from-purple-500 to-pink-600',
  },
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
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Apps</p>
        <div className="grid grid-cols-3 gap-2">
          {apps.map((app) => (
            <Link
              key={app.name}
              to={app.path}
              onClick={() => setOpen(false)}
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-accent transition-colors text-center"
            >
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-sm`}>
                <app.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">{app.name}</span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

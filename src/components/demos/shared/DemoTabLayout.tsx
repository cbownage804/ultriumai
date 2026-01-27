import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  ariaLabel?: string;
}

interface DemoTabLayoutProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  colorTheme?: 'cyan' | 'amber' | 'violet' | 'emerald' | 'red';
  className?: string;
  tabsClassName?: string;
}

const colorClasses = {
  cyan: 'data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 focus-visible:ring-cyan-500',
  amber: 'data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 focus-visible:ring-amber-500',
  violet: 'data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 focus-visible:ring-violet-500',
  emerald: 'data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 focus-visible:ring-emerald-500',
  red: 'data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 focus-visible:ring-red-500',
};

export function DemoTabLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
  colorTheme = 'cyan',
  className,
  tabsClassName
}: DemoTabLayoutProps) {
  const triggerColor = colorClasses[colorTheme];
  
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={onTabChange} 
      className={cn('space-y-4', className)}
    >
      <TabsList 
        className={cn(
          'flex flex-wrap w-full bg-muted/50 h-auto p-1',
          tabsClassName
        )}
        role="tablist"
        aria-label="Demo sections"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'text-xs flex-1 min-w-0 whitespace-nowrap transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              triggerColor
            )}
            aria-label={tab.ariaLabel || tab.label}
          >
            {tab.icon && (
              <tab.icon className="h-3 w-3 mr-1 hidden sm:inline-block" aria-hidden="true" />
            )}
            <span className="truncate">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      
      {children}
    </Tabs>
  );
}

// Re-export TabsContent for convenience
export { TabsContent };

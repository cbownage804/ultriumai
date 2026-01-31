/**
 * Unified Vanguard Tabs Component
 * Premium, scrollable tabs with module-specific theming
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface VanguardTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface VanguardTabsProps {
  tabs: VanguardTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  colorTheme?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'red';
  className?: string;
}

const themeClasses = {
  cyan: {
    active: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/50',
    border: 'border-cyan-500/30',
    scrollBtn: 'text-cyan-400 hover:bg-cyan-500/20',
  },
  purple: {
    active: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/50',
    border: 'border-purple-500/30',
    scrollBtn: 'text-purple-400 hover:bg-purple-500/20',
  },
  amber: {
    active: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/50',
    border: 'border-amber-500/30',
    scrollBtn: 'text-amber-400 hover:bg-amber-500/20',
  },
  emerald: {
    active: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/50',
    border: 'border-emerald-500/30',
    scrollBtn: 'text-emerald-400 hover:bg-emerald-500/20',
  },
  red: {
    active: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:text-red-400 data-[state=active]:border-red-500/50',
    border: 'border-red-500/30',
    scrollBtn: 'text-red-400 hover:bg-red-500/20',
  },
};

export function VanguardTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  colorTheme = 'cyan',
  className,
}: VanguardTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const theme = themeClasses[colorTheme];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={cn('space-y-6', className)}
    >
      <div className="relative">
        {/* Left scroll button */}
        {showLeftScroll && (
          <button
            onClick={() => scroll('left')}
            className={cn(
              'absolute left-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-r from-black/90 to-transparent',
              theme.scrollBtn
            )}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Tabs container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={cn(
            'overflow-x-auto scrollbar-hide',
            showLeftScroll && 'pl-6',
            showRightScroll && 'pr-6'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <TabsList
            className={cn(
              'inline-flex w-auto min-w-full h-11 bg-black/60 border p-1 gap-1',
              theme.border
            )}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md',
                  'text-slate-400 hover:text-white/80 transition-all duration-200',
                  'border border-transparent',
                  theme.active
                )}
              >
                {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Right scroll button */}
        {showRightScroll && (
          <button
            onClick={() => scroll('right')}
            className={cn(
              'absolute right-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-l from-black/90 to-transparent',
              theme.scrollBtn
            )}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {children}
    </Tabs>
  );
}

// Re-export TabsContent for convenience
export { TabsContent as VanguardTabContent } from '@/components/ui/tabs';

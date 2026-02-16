/**
 * Floating Help Button - Global access to help and tours
 * Always visible, provides quick access to knowledge base and tours
 */

import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  BookOpen, 
  Play, 
  Settings, 
  X,
  ChevronRight,
  Keyboard,
  Bug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuidedTourOverlay, useTourCompletion } from '@/components/tours/GuidedTourOverlay';
import { MODULE_TOURS, ModuleTourId } from '@/config/moduleTours';
import { TourStep } from '@/components/onboarding/ProductTour';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { KnowledgeBaseContent } from '@/components/knowledgebase/KnowledgeBaseContent';
import { BugReportModal } from '@/components/help/BugReportModal';

interface FloatingHelpButtonProps {
  className?: string;
}

// Map routes to tour IDs
const routeToTourMap: Record<string, ModuleTourId> = {
  '/vanguard/app/tickets': 'vanguard-response',
  '/vanguard/app/response': 'vanguard-response',
  '/vanguard/app/devices': 'vanguard-horizon',
  '/vanguard/app/horizon': 'vanguard-horizon',
  '/vanguard/app/alerts': 'vanguard-pursuit',
  '/vanguard/app/pursuit': 'vanguard-pursuit',
  '/vanguard/app/atlas': 'vanguard-atlas',
  '/vanguard/app/cortex': 'vanguard-cortex',
  '/vanguard/app/sentinel': 'vanguard-sentinel',
  '/vanguard/app/recon': 'vanguard-recon',
  '/vanguard/app/comply': 'vanguard-comply',
  '/vanguard/app/ledger': 'vanguard-ledger',
  '/safesuite/vault': 'safesuite-vault',
  '/safesuite/pass': 'safesuite-vault',
  '/safesuite/scan': 'safesuite-scan',
  '/safesuite/breach': 'safesuite-breach',
  '/dashboard': 'ai-studio-builder',
  '/gpt-builder': 'ai-studio-builder',
  '/settings': 'settings',
};

export function FloatingHelpButton({ className }: FloatingHelpButtonProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showKB, setShowKB] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);

  // Find matching tour for current route
  const currentTourId = useMemo(() => {
    const path = location.pathname;
    for (const [route, tourId] of Object.entries(routeToTourMap)) {
      if (path.startsWith(route)) {
        return tourId;
      }
    }
    return null;
  }, [location.pathname]);

  const { isCompleted: tourCompleted, resetCompletion } = useTourCompletion(currentTourId || '');

  const currentTour = currentTourId ? MODULE_TOURS[currentTourId] : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? key opens help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setShowKB(true);
      }
      // Escape closes menus
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setShowKB(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartTour = () => {
    if (tourCompleted) {
      resetCompletion();
    }
    setShowTour(true);
    setIsExpanded(false);
  };

  const menuItems = [
    {
      id: 'kb',
      label: 'Help Articles',
      icon: BookOpen,
      action: () => {
        setShowKB(true);
        setIsExpanded(false);
      },
      color: 'text-blue-400',
    },
    ...(currentTour ? [{
      id: 'tour',
      label: tourCompleted ? 'Replay Tour' : 'Start Tour',
      icon: Play,
      action: handleStartTour,
      color: 'text-green-400',
      badge: !tourCompleted,
    }] : []),
    {
      id: 'bug',
      label: 'Submit Bug',
      icon: Bug,
      action: () => {
        setShowBugReport(true);
        setIsExpanded(false);
      },
      color: 'text-red-400',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        navigate('/settings');
        setIsExpanded(false);
      },
      color: 'text-purple-400',
    },
  ];

  // Hide on full-screen IDE routes
  if (location.pathname.startsWith('/ai-studio/app-builder')) return null;

  return (
    <>
      {/* Floating Button */}
      <div className={cn("fixed bottom-24 right-6 z-50", className)}>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-16 right-0 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
            >
              <div className="p-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left group"
                    >
                      <Icon className={cn("h-5 w-5", item.color)} />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 bg-muted/30 border-t border-border/30 flex items-center gap-2 justify-center">
                <Keyboard className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd> for help
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-14 w-14 rounded-full bg-gradient-to-br from-primary via-primary to-cyan-500 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl hover:shadow-primary/40",
            isExpanded && "rotate-45"
          )}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <HelpCircle className="h-6 w-6" />
              {currentTour && !tourCompleted && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full animate-pulse border-2 border-primary" />
              )}
            </div>
          )}
        </motion.button>
      </div>

      {/* Knowledge Base Sheet */}
      <Sheet open={showKB} onOpenChange={setShowKB}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col p-0">
          <KnowledgeBaseContent />
        </SheetContent>
      </Sheet>

      {/* Tour Overlay */}
      {currentTour && (
        <GuidedTourOverlay
          tourId={currentTourId!}
          steps={currentTour}
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onComplete={() => setShowTour(false)}
        />
      )}

      {/* Bug Report Modal */}
      <BugReportModal open={showBugReport} onOpenChange={setShowBugReport} />
    </>
  );
}

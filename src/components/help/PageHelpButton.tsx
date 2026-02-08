/**
 * PageHelpButton - Header-embedded ? icon that shows page-specific instructions
 * and allows replaying the guided tour for the current page
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Play, RefreshCw, BookOpen, ExternalLink, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPageInstructions, PageInstruction } from '@/config/pageInstructions';
import { MODULE_TOURS, ModuleTourId } from '@/config/moduleTours';
import { GuidedTourOverlay, useTourCompletion } from '@/components/tours/GuidedTourOverlay';
import { cn } from '@/lib/utils';

interface PageHelpButtonProps {
  className?: string;
  /** Override the route-based lookup with explicit instructions */
  instructions?: PageInstruction;
  /** Override tour ID */
  tourId?: string;
  variant?: 'icon' | 'button';
}

export function PageHelpButton({ className, instructions: propInstructions, tourId: propTourId, variant = 'icon' }: PageHelpButtonProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const instructions = propInstructions || getPageInstructions(location.pathname);
  const tourIdResolved = propTourId || instructions?.tourId;
  const tourSteps = tourIdResolved ? MODULE_TOURS[tourIdResolved as ModuleTourId] : null;
  const { isCompleted: tourCompleted, resetCompletion } = useTourCompletion(tourIdResolved || '');

  if (!instructions) return null;

  const handleStartTour = () => {
    if (tourCompleted) {
      resetCompletion();
    }
    setIsOpen(false);
    setTimeout(() => setShowTour(true), 300);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {variant === 'icon' ? (
              <button
                onClick={() => setIsOpen(true)}
                className={cn(
                  'p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground',
                  className
                )}
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className={className}>
                <HelpCircle className="h-4 w-4 mr-1.5" />
                Help
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>How to use this page</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Instructions Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">{instructions.title}</SheetTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{instructions.description}</p>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-220px)] mt-4">
            <div className="space-y-6 pr-4">
              {/* Replay Tour CTA */}
              {tourSteps && (
                <button
                  onClick={handleStartTour}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {tourCompleted ? (
                      <RefreshCw className="h-5 w-5 text-primary" />
                    ) : (
                      <Play className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {tourCompleted ? 'Replay Guided Tour' : 'Start Guided Tour'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tourCompleted
                        ? 'Walk through this page\'s features again'
                        : 'Interactive walkthrough of all features on this page'}
                    </p>
                  </div>
                  {tourCompleted && (
                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                  )}
                </button>
              )}

              {/* Instructions Sections */}
              {instructions.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {section.heading}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                    {section.content}
                  </p>
                  {section.tips && section.tips.length > 0 && (
                    <div className="pl-8 space-y-1.5 mt-2">
                      {section.tips.map((tip, tipIdx) => (
                        <div key={tipIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Link to full guide */}
              <div className="pt-4 border-t border-border/50">
                <a
                  href="/guide"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View full platform guide
                </a>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Tour Overlay */}
      {tourSteps && tourIdResolved && (
        <GuidedTourOverlay
          tourId={tourIdResolved}
          steps={tourSteps}
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
}

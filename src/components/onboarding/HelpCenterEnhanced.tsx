import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, X, BookOpen, Play, RotateCcw, ChevronRight,
  Sparkles, Target, Award, Clock, CheckCircle2, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AVAILABLE_TOURS } from './HelpCenter';
import { resetAllProductTours } from './ProductTour';
import { AVAILABLE_TUTORIALS } from '@/config/interactiveTutorials';
import { useInteractiveTutorial, resetAllTutorials } from './InteractiveTutorial';

interface HelpCenterEnhancedProps {
  currentProduct?: 'safesuite' | 'ai-studio' | 'vanguard' | 'general';
  onStartTour?: (tourId: string) => void;
  onStartTutorial?: (tutorialId: string) => void;
}

export const HelpCenterEnhanced = ({ 
  currentProduct = 'general',
  onStartTour,
  onStartTutorial,
}: HelpCenterEnhancedProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tutorials');

  const filteredTours = AVAILABLE_TOURS.filter(
    tour => tour.product === currentProduct || tour.product === 'general' || currentProduct === 'general'
  );

  const filteredTutorials = AVAILABLE_TUTORIALS.filter(
    tutorial => tutorial.product === currentProduct || tutorial.product === 'general' || currentProduct === 'general'
  );

  const handleStartTour = (tourId: string) => {
    setIsOpen(false);
    onStartTour?.(tourId);
    toast.success('Starting tour...');
  };

  const handleStartTutorial = (tutorialId: string) => {
    setIsOpen(false);
    onStartTutorial?.(tutorialId);
  };

  const handleResetAll = () => {
    resetAllProductTours();
    resetAllTutorials();
    toast.success('All progress has been reset!');
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-tour="help-center"
      >
        <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[91] bg-background border-l shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Learning Center</h2>
                      <p className="text-sm text-muted-foreground">Tours, tutorials & guides</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <div className="px-6 pt-4">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="tutorials" className="gap-1.5">
                      <Target className="h-4 w-4" />
                      Tutorials
                    </TabsTrigger>
                    <TabsTrigger value="tours" className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Tours
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="h-[calc(100vh-200px)]">
                  {/* Tutorials Tab */}
                  <TabsContent value="tutorials" className="p-6 pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Hands-on tutorials that guide you through actual features.
                    </p>

                    {filteredTutorials.map((tutorial) => (
                      <TutorialCard
                        key={tutorial.id}
                        tutorial={tutorial}
                        onStart={() => handleStartTutorial(tutorial.id)}
                      />
                    ))}

                    {filteredTutorials.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tutorials available for this section yet.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tours Tab */}
                  <TabsContent value="tours" className="p-6 pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Quick visual tours introducing key features.
                    </p>

                    {filteredTours.map((tour) => (
                      <TourCard
                        key={tour.id}
                        tour={tour}
                        onStart={() => handleStartTour(tour.id)}
                      />
                    ))}
                  </TabsContent>
                </ScrollArea>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAll}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset all progress
                  </Button>
                </div>
              </Tabs>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Tutorial Card Component
const TutorialCard = ({ 
  tutorial, 
  onStart 
}: { 
  tutorial: typeof AVAILABLE_TUTORIALS[0];
  onStart: () => void;
}) => {
  const { isCompleted } = useInteractiveTutorial(tutorial.id);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer group",
        isCompleted 
          ? "bg-green-500/5 border-green-500/20" 
          : "hover:bg-muted/50 hover:border-primary/20"
      )}
      onClick={onStart}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isCompleted ? "bg-green-500/10" : "bg-primary/10"
        )}>
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Target className="h-4 w-4 text-primary" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{tutorial.name}</h4>
            {isCompleted && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{tutorial.description}</p>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tutorial.duration}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {tutorial.steps.length} steps
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </motion.div>
  );
};

// Tour Card Component
const TourCard = ({ 
  tour, 
  onStart 
}: { 
  tour: typeof AVAILABLE_TOURS[0];
  onStart: () => void;
}) => {
  // Check completion status from localStorage
  const isCompleted = JSON.parse(localStorage.getItem('ultrium_completed_tours') || '[]').includes(tour.id);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer group",
        isCompleted 
          ? "bg-green-500/5 border-green-500/20" 
          : "hover:bg-muted/50 hover:border-primary/20"
      )}
      onClick={onStart}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isCompleted ? "bg-green-500/10" : "bg-primary/10"
        )}>
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{tour.name}</h4>
            {isCompleted && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{tour.description}</p>
        </div>

        <Button
          size="sm"
          variant={isCompleted ? "ghost" : "secondary"}
          className="gap-1 text-xs"
        >
          {isCompleted ? <RotateCcw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {isCompleted ? 'Replay' : 'Start'}
        </Button>
      </div>
    </motion.div>
  );
};

export default HelpCenterEnhanced;

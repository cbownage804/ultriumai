import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  Play, 
  BookOpen, 
  Video, 
  RefreshCw,
  CheckCircle,
  Sparkles,
  Shield,
  Brain,
  Target,
  ExternalLink,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { resetAllProductTours } from './ProductTour';
import { resetFeatureTooltips } from './FeatureTooltip';
import { resetOnboardingChecklist } from './OnboardingChecklist';

interface TourInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  steps: number;
  duration: string;
  product: 'safesuite' | 'ai-studio' | 'vanguard' | 'general';
}

export const AVAILABLE_TOURS: TourInfo[] = [
  {
    id: 'vanguard-command',
    name: 'Vanguard Command Tour',
    description: 'Complete walkthrough of the Vanguard Command dashboard - tickets, alerts, devices, and more.',
    icon: <Target className="h-5 w-5 text-cyan-500" />,
    steps: 12,
    duration: '5 min',
    product: 'vanguard',
  },
  {
    id: 'safesuite-intro',
    name: 'Wrayth Overview',
    description: 'Learn the basics of password management, threat scanning, and dark web monitoring.',
    icon: <Shield className="h-5 w-5 text-blue-500" />,
    steps: 6,
    duration: '3 min',
    product: 'safesuite',
  },
  {
    id: 'ai-studio-intro',
    name: 'AI Studio Basics',
    description: 'Discover how to build, train, and deploy custom AI assistants.',
    icon: <Brain className="h-5 w-5 text-purple-500" />,
    steps: 5,
    duration: '4 min',
    product: 'ai-studio',
  },
  {
    id: 'vanguard-intro',
    name: 'Vanguard Home Tour',
    description: 'Quick overview of Vanguard modules and navigation.',
    icon: <Target className="h-5 w-5 text-red-500" />,
    steps: 7,
    duration: '3 min',
    product: 'vanguard',
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions Guide',
    description: 'Learn keyboard shortcuts and productivity tips.',
    icon: <Rocket className="h-5 w-5 text-orange-500" />,
    steps: 4,
    duration: '2 min',
    product: 'general',
  },
];

interface GuideInfo {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'tutorial';
  duration: string;
  url?: string;
}

const GUIDES: GuideInfo[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with UltriumAI',
    description: 'Complete beginner guide to setting up your account and exploring features.',
    type: 'article',
    duration: '5 min read',
  },
  {
    id: 'password-security',
    title: 'Password Security Best Practices',
    description: 'Learn how to create strong passwords and manage credentials safely.',
    type: 'article',
    duration: '3 min read',
  },
  {
    id: 'custom-gpt-creation',
    title: 'Building Your First Custom GPT',
    description: 'Step-by-step tutorial for creating and deploying AI assistants.',
    type: 'tutorial',
    duration: '10 min',
  },
  {
    id: 'threat-monitoring',
    title: 'Understanding Threat Monitoring',
    description: 'How to use Scan and dark web monitoring effectively.',
    type: 'video',
    duration: '8 min',
  },
  {
    id: 'team-management',
    title: 'Managing Your Team',
    description: 'Add team members, set permissions, and collaborate securely.',
    type: 'article',
    duration: '4 min read',
  },
];

const COMPLETED_TOURS_KEY = 'ultrium_completed_tours';

export const HelpCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [completedTours, setCompletedTours] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
  });

  const handleStartTour = (tourId: string) => {
    // Remove from completed to allow restart
    const updated = completedTours.filter(id => id !== tourId);
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(updated));
    setCompletedTours(updated);
    setIsOpen(false);
    
    // Navigate to appropriate page and trigger tour
    const tour = AVAILABLE_TOURS.find(t => t.id === tourId);
    if (tour) {
      // Get current path to determine context
      const currentPath = window.location.pathname;
      const isWraythContext = currentPath.includes('/safesuite') || currentPath.includes('/pass') || currentPath.includes('/scan') || currentPath.includes('/web') || currentPath.includes('/track');
      
      switch (tour.product) {
        case 'safesuite':
          // Stay on Wrayth dashboard if already there, otherwise navigate
          if (isWraythContext) {
            window.location.href = currentPath.includes('/dashboard') ? `${currentPath}?tour=true` : '/safesuite/dashboard?tour=true';
          } else {
            window.location.href = '/safesuite/dashboard?tour=true';
          }
          break;
        case 'ai-studio':
          window.location.href = '/dashboard?tour=true';
          break;
        case 'vanguard':
          // Route to the appropriate Vanguard tour
          if (tourId === 'vanguard-command') {
            window.location.href = '/vanguard?tour=true';
          } else if (tourId === 'vanguard-intro') {
            window.location.href = '/vanguard/home?tour=true';
          } else {
            window.location.href = '/vanguard?tour=true';
          }
          break;
        default:
          toast.success(`Starting ${tour.name}...`);
          // Trigger a page reload to restart the tour
          window.location.reload();
      }
    }
  };

  const handleResetAllProgress = () => {
    resetAllProductTours();
    resetFeatureTooltips();
    resetOnboardingChecklist();
    setCompletedTours([]);
    toast.success('All onboarding progress has been reset. Refresh the page to see tours again.');
  };

  const getTypeIcon = (type: GuideInfo['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'tutorial':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help Center</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Help Center
          </SheetTitle>
          <SheetDescription>
            Learn how to use UltriumAI with guided tours and helpful resources.
          </SheetDescription>
        </SheetHeader>

        {/* Full Guide Link */}
        <a
          href="/guide"
          className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Full Platform Guide</p>
            <p className="text-xs text-muted-foreground">Comprehensive how-to for every feature</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>

        <Tabs defaultValue="tours" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tours" className="gap-2">
              <Play className="h-4 w-4" />
              Guided Tours
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Guides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tours" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                {AVAILABLE_TOURS.map((tour, index) => {
                  const isCompleted = completedTours.includes(tour.id);
                  
                  return (
                    <motion.div
                      key={tour.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isCompleted ? 'bg-muted/50' : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleStartTour(tour.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {tour.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{tour.name}</h4>
                                {isCompleted && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {tour.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {tour.steps} steps
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {tour.duration}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant={isCompleted ? 'outline' : 'default'}>
                              {isCompleted ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Replay
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  Start
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Reset all progress */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleResetAllProgress}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All Onboarding Progress
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    This will reset all tours, tooltips, and checklists
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="guides" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                {GUIDES.map((guide, index) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            {getTypeIcon(guide.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">{guide.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {guide.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {guide.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {guide.duration}
                              </span>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default HelpCenter;

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Shield, 
  Brain, 
  Target,
  ArrowRight,
  Play,
  Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface WelcomeModalProps {
  product: 'safesuite' | 'ai-studio' | 'vanguard';
  onStartTour?: () => void;
  onSkip?: () => void;
}

const WELCOME_SHOWN_KEY = 'ultrium_welcome_shown';

const productConfig = {
  safesuite: {
    title: 'Welcome to Wrayth! 🛡️',
    description: 'Your complete security solution for password management, threat detection, and dark web monitoring.',
    icon: <Shield className="h-8 w-8" />,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Military-grade password encryption',
      'AI-powered threat scanning',
      'Real-time dark web monitoring',
      'Security health scoring',
    ],
  },
  'ai-studio': {
    title: 'Welcome to AI Studio! 🤖',
    description: 'Build, train, and deploy custom AI assistants tailored to your business needs.',
    icon: <Brain className="h-8 w-8" />,
    color: 'from-purple-500 to-pink-500',
    features: [
      'No-code GPT builder',
      '20+ ready templates',
      'Knowledge base training',
      'Multi-channel deployment',
    ],
  },
  vanguard: {
    title: 'Welcome to Vanguard! 🎯',
    description: 'Enterprise-grade security operations for MSPs with real-time threat detection.',
    icon: <Target className="h-8 w-8" />,
    color: 'from-red-500 to-orange-500',
    features: [
      'SOC-as-a-Service',
      'MITRE ATT&CK mapping',
      'Automated remediation',
      'Client-wide visibility',
    ],
  },
};

export const WelcomeModal = ({ product, onStartTour, onSkip }: WelcomeModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if welcome was already shown for this product
    const shown = JSON.parse(localStorage.getItem(WELCOME_SHOWN_KEY) || '{}');
    if (!shown[product] && user) {
      // Delay to let the page render first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [product, user]);

  const handleStartTour = () => {
    markAsShown();
    setIsOpen(false);
    onStartTour?.();
  };

  const handleSkip = () => {
    markAsShown();
    setIsOpen(false);
    onSkip?.();
  };

  const handleExplore = () => {
    markAsShown();
    setIsOpen(false);
  };

  const markAsShown = () => {
    const shown = JSON.parse(localStorage.getItem(WELCOME_SHOWN_KEY) || '{}');
    shown[product] = true;
    localStorage.setItem(WELCOME_SHOWN_KEY, JSON.stringify(shown));
  };

  const config = productConfig[product];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${config.color} p-6 text-white`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              {config.icon}
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/30">
              <Sparkles className="h-3 w-3 mr-1" />
              New User
            </Badge>
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl text-white">{config.title}</DialogTitle>
            <DialogDescription className="text-white/90">
              {config.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Features */}
        <div className="p-6">
          <h4 className="text-sm font-medium mb-3">What you can do:</h4>
          <ul className="space-y-2">
            {config.features.map((feature, index) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {feature}
              </motion.li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-6">
            <Button onClick={handleStartTour} className="w-full gap-2">
              <Play className="h-4 w-4" />
              Take a Quick Tour
            </Button>
            <Button variant="outline" onClick={handleExplore} className="w-full gap-2">
              <Rocket className="h-4 w-4" />
              Explore on My Own
            </Button>
            <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
              Skip for now
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            You can restart the tour anytime from the Help Center
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Utility to reset welcome shown state
export const resetWelcomeModals = () => {
  localStorage.removeItem(WELCOME_SHOWN_KEY);
};

export default WelcomeModal;

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Key, 
  Fingerprint, 
  Eye, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock
} from 'lucide-react';

const TIPS_SHOWN_KEY = 'safepass_security_tips_shown';

interface SecurityTip {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const securityTips: SecurityTip[] = [
  {
    icon: <Key className="h-6 w-6" />,
    title: 'Use a Strong Master Password',
    description: 'Create a unique passphrase with 4+ random words, or 16+ characters mixing uppercase, lowercase, numbers, and symbols. This is the only password you need to remember.'
  },
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: 'Never Reuse Your Master Password',
    description: 'Your master password should be completely unique — never use it for any other account, website, or service.'
  },
  {
    icon: <Fingerprint className="h-6 w-6" />,
    title: 'Enable Two-Factor Authentication',
    description: 'Add a second layer of protection with an authenticator app or hardware security key. Even if someone learns your password, they can\'t access your vault.'
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: 'Watch for Phishing Attempts',
    description: 'We will never ask for your master password via email, chat, or phone. Always verify you\'re on the official site before entering credentials.'
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Keep Your Devices Secure',
    description: 'Use up-to-date antivirus software, enable device encryption, and lock your screen when away. Your vault is only as secure as the device you access it from.'
  }
];

interface SecurityTipsModalProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export function SecurityTipsModal({ forceShow = false, onClose }: SecurityTipsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }

    // Check if tips have been shown before
    const hasSeenTips = localStorage.getItem(TIPS_SHOWN_KEY);
    if (!hasSeenTips) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleClose = () => {
    localStorage.setItem(TIPS_SHOWN_KEY, 'true');
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentTip < securityTips.length - 1) {
      setCurrentTip(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const tip = securityTips[currentTip];
  const isLastTip = currentTip === securityTips.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-primary/30 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <DialogHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-white">Security Best Practices</DialogTitle>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 pt-2">
            {securityTips.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentTip 
                    ? 'w-6 bg-primary' 
                    : index < currentTip 
                      ? 'w-1.5 bg-primary/50' 
                      : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="relative py-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                <div className="text-primary">
                  {tip.icon}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white">
                {tip.title}
              </h3>
              
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                {tip.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="relative flex items-center justify-between pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            Skip All
          </Button>
          
          <Button
            onClick={handleNext}
            size="sm"
            className="bg-primary hover:bg-primary text-black font-medium"
          >
            {isLastTip ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Got It
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

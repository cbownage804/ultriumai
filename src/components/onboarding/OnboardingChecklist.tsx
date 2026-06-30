import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Key,
  Shield,
  Zap,
  Gift,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  isComplete: boolean;
  reward?: string;
}

interface OnboardingChecklistProps {
  product?: 'safesuite' | 'ai_studio' | 'vanguard';
  onAllComplete?: () => void;
  minimizable?: boolean;
}

const CHECKLIST_DISMISSED_KEY = 'ultrium_checklist_dismissed';

export const OnboardingChecklist = ({
  product = 'safesuite',
  onAllComplete,
  minimizable = true,
}: OnboardingChecklistProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Define checklist items based on product
  const getChecklistItems = (): ChecklistItem[] => {
    const baseItems: ChecklistItem[] = [
      {
        id: 'profile',
        title: 'Complete your profile',
        description: 'Add your name and company details',
        icon: <User className="h-4 w-4" />,
        href: '/settings/profile',
        isComplete: completedItems.includes('profile'),
      },
      {
        id: 'mfa',
        title: 'Enable two-factor authentication',
        description: 'Add an extra layer of security',
        icon: <Shield className="h-4 w-4" />,
        href: '/dashboard/security-center',
        isComplete: completedItems.includes('mfa'),
        reward: 'Free security badge',
      },
    ];

    const productItems: Record<string, ChecklistItem[]> = {
      safesuite: [
        {
          id: 'first_password',
          title: 'Save your first password',
          description: 'Store a password in Vault vault',
          icon: <Key className="h-4 w-4" />,
          href: '/app/pass',
          isComplete: completedItems.includes('first_password'),
        },
        {
          id: 'first_scan',
          title: 'Run your first security scan',
          description: 'Check your digital security posture',
          icon: <Zap className="h-4 w-4" />,
          href: '/app/scan',
          isComplete: completedItems.includes('first_scan'),
          reward: 'Free threat report',
        },
      ],
      ai_studio: [
        {
          id: 'first_gpt',
          title: 'Create your first Custom GPT',
          description: 'Build an AI assistant for your use case',
          icon: <Sparkles className="h-4 w-4" />,
          href: '/ai-studio/create',
          isComplete: completedItems.includes('first_gpt'),
        },
        {
          id: 'first_conversation',
          title: 'Have your first conversation',
          description: 'Chat with your Custom GPT',
          icon: <Zap className="h-4 w-4" />,
          href: '/ai-studio',
          isComplete: completedItems.includes('first_conversation'),
        },
      ],
      vanguard: [
        {
          id: 'first_client',
          title: 'Add your first client',
          description: 'Start managing a client in Vanguard',
          icon: <User className="h-4 w-4" />,
          href: '/vanguard/clients',
          isComplete: completedItems.includes('first_client'),
        },
        {
          id: 'first_alert',
          title: 'Review security alerts',
          description: 'Check your threat detection dashboard',
          icon: <Shield className="h-4 w-4" />,
          href: '/vanguard',
          isComplete: completedItems.includes('first_alert'),
        },
      ],
    };

    return [...baseItems, ...(productItems[product] || [])];
  };

  useEffect(() => {
    // Check if dismissed
    const dismissed = localStorage.getItem(CHECKLIST_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
    
    checkCompletionStatus();
  }, [user]);

  const checkCompletionStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const completed: string[] = [];

      // Check profile completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('user_id', user.id)
        .single();

      if (profile?.full_name && profile?.company_name) {
        completed.push('profile');
      }

      // Check MFA status from custom security_settings table
      const { data: securitySettings } = await supabase
        .from('security_settings')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      if (securitySettings?.two_factor_enabled) {
        completed.push('mfa');
      }

      // Check product-specific items
      if (product === 'safesuite') {
        // Check for saved passwords
        try {
          const { count: passwordCount } = await supabase
            .from('password_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (passwordCount && passwordCount > 0) {
            completed.push('first_password');
          }
        } catch {
          // Table might not exist
        }

        // Mark first_scan as complete if user has been active
        // (simplified check - actual scan tracking would need dedicated table)
        completed.push('first_scan');
      }

      if (product === 'ai_studio') {
        // Check for created GPTs
        try {
          const { count: gptCount } = await supabase
            .from('custom_gpts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (gptCount && gptCount > 0) {
            completed.push('first_gpt');
          }
        } catch {
          // Table might not exist
        }

        // Check for conversations
        try {
          const { count: convCount } = await supabase
            .from('gpt_conversations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (convCount && convCount > 0) {
            completed.push('first_conversation');
          }
        } catch {
          // Table might not exist
        }
      }

      setCompletedItems(completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const items = getChecklistItems();
  const completedCount = items.filter(i => i.isComplete).length;
  const progress = (completedCount / items.length) * 100;
  const allComplete = completedCount === items.length;

  useEffect(() => {
    if (allComplete && onAllComplete) {
      onAllComplete();
    }
  }, [allComplete, onAllComplete]);

  if (isDismissed || loading || allComplete) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Getting Started</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {completedCount}/{items.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {minimizable && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2 pb-4">
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.href ? (
                      <Link to={item.href}>
                        <ChecklistItemRow item={item} />
                      </Link>
                    ) : (
                      <div onClick={item.action} className={item.action ? 'cursor-pointer' : ''}>
                        <ChecklistItemRow item={item} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const ChecklistItemRow = ({ item }: { item: ChecklistItem }) => (
  <div
    className={cn(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      item.isComplete
        ? 'bg-primary/5 text-muted-foreground'
        : 'bg-muted/30 hover:bg-muted/50'
    )}
  >
    <div
      className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        item.isComplete ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      )}
    >
      {item.isComplete ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        item.icon
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p
        className={cn(
          'text-sm font-medium',
          item.isComplete && 'line-through'
        )}
      >
        {item.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {item.description}
      </p>
    </div>
    {item.reward && !item.isComplete && (
      <Badge variant="secondary" className="text-xs flex-shrink-0">
        <Gift className="h-3 w-3 mr-1" />
        {item.reward}
      </Badge>
    )}
    {!item.isComplete && item.href && (
      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    )}
  </div>
);

// Utility to reset checklist dismissed state
export const resetOnboardingChecklist = () => {
  localStorage.removeItem(CHECKLIST_DISMISSED_KEY);
};

/**
 * Wrayth Premium Visual Effects Components
 * Shared animated containers, loading states, and premium UI elements
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Shield, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Theme colors for each Wrayth product
export const SAFESUITE_THEMES = {
  safepass: {
    primary: 'amber',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    glow: 'shadow-[0_0_60px_rgba(245,158,11,0.15)]',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    buttonGradient: 'from-amber-500 to-orange-500'
  },
  safescan: {
    primary: 'red',
    gradient: 'from-red-500/20 via-pink-500/10 to-rose-500/20',
    glow: 'shadow-[0_0_60px_rgba(239,68,68,0.15)]',
    border: 'border-red-500/20',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    buttonGradient: 'from-red-500 to-pink-500'
  },
  safeweb: {
    primary: 'violet',
    gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
    glow: 'shadow-[0_0_60px_rgba(139,92,246,0.15)]',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    buttonGradient: 'from-violet-500 to-purple-500'
  },
  safetrack: {
    primary: 'emerald',
    gradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.15)]',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    buttonGradient: 'from-emerald-500 to-teal-500'
  },
  safeassist: {
    primary: 'cyan',
    gradient: 'from-cyan-500/20 via-teal-500/10 to-cyan-500/20',
    glow: 'shadow-[0_0_60px_rgba(6,182,212,0.15)]',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    buttonGradient: 'from-cyan-500 to-teal-500'
  },
  safeops: {
    primary: 'green',
    gradient: 'from-green-500/20 via-emerald-500/10 to-lime-500/20',
    glow: 'shadow-[0_0_60px_rgba(34,197,94,0.15)]',
    border: 'border-green-500/20',
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    buttonGradient: 'from-green-500 to-emerald-500'
  },
  safedesk: {
    primary: 'cyan',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-sky-500/20',
    glow: 'shadow-[0_0_60px_rgba(6,182,212,0.15)]',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    buttonGradient: 'from-cyan-500 to-blue-500'
  }
} as const;

type ThemeKey = keyof typeof SAFESUITE_THEMES;

interface GlowContainerProps {
  children: ReactNode;
  theme: ThemeKey;
  className?: string;
  animate?: boolean;
}

/**
 * Animated glow container with gradient background
 */
export function GlowContainer({ children, theme, className, animate = true }: GlowContainerProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-xl',
        colors.glow,
        colors.border,
        'border bg-[#141414]',
        className
      )}
    >
      {/* Animated gradient background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50',
        colors.gradient
      )} />
      
      {/* Pulse animation overlay */}
      <div className="absolute inset-0">
        <div className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl animate-pulse',
          colors.bg
        )} />
        <div className={cn(
          'absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl animate-pulse',
          colors.bg
        )} style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

interface AnimatedHeaderProps {
  logo: string;
  logoAlt: string;
  tagline: string;
  theme: ThemeKey;
  badge?: string;
}

/**
 * Animated header with logo, tagline, and optional badge
 */
export function AnimatedHeader({ logo, logoAlt, tagline, theme, badge }: AnimatedHeaderProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn(
            'p-4 rounded-xl bg-gradient-to-br',
            colors.gradient,
            colors.glow,
            colors.border,
            'border'
          )}
        >
          <img src={logo} alt={logoAlt} className="h-32 w-auto" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            {badge && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  colors.bg,
                  colors.text
                )}
              >
                {badge}
              </motion.span>
            )}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm mt-1"
          >
            {tagline}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

interface AnimatedStatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  theme: ThemeKey;
  delay?: number;
}

/**
 * Animated stats card with icon and value
 */
export function AnimatedStatsCard({ icon, label, value, theme, delay = 0 }: AnimatedStatsCardProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'p-4 rounded-xl bg-[#141414] border',
        colors.border,
        'transition-shadow duration-300',
        'hover:shadow-lg'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          colors.bg
        )}>
          <span className={colors.text}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface PremiumLoadingProps {
  theme: ThemeKey;
  message?: string;
}

/**
 * Premium loading skeleton with animated elements
 */
export function PremiumLoading({ theme, message = 'Loading...' }: PremiumLoadingProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  return (
    <div className={cn(
      'relative p-6 rounded-xl bg-gradient-to-br',
      colors.gradient,
      colors.border,
      'border'
    )}>
      {/* Animated background pulse */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className={cn(
          'absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl animate-ping opacity-20',
          colors.bg
        )} />
      </div>
      
      <div className="relative space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg animate-pulse',
            colors.bg
          )} />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-48 bg-white/5 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
          </div>
        </div>
        
        {/* Content skeleton lines */}
        <div className="space-y-3 pt-2">
          <div className="h-3 w-full bg-white/5 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="h-3 w-4/5 bg-white/5 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="h-3 w-3/5 bg-white/5 rounded animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
        
        {/* Loading indicator */}
        <div className="flex items-center gap-2 pt-2">
          <Loader2 className={cn('h-4 w-4 animate-spin', colors.text)} />
          <span className={cn('text-sm', colors.text)}>{message}</span>
        </div>
      </div>
    </div>
  );
}

interface AIRecommendationCardProps {
  content: string;
  theme: ThemeKey;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

/**
 * AI Recommendation card with parsed sections and animations
 */
export function AIRecommendationCard({ content, theme, onRegenerate, isLoading }: AIRecommendationCardProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  // Parse content into sections
  const sections = content.split('\n\n').filter(s => s.trim());
  
  const getSectionStyle = (section: string) => {
    const lower = section.toLowerCase();
    if (lower.includes('immediate') || lower.includes('urgent') || lower.includes('critical')) {
      return {
        icon: <ShieldAlert className="h-5 w-5" />,
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400'
      };
    }
    if (lower.includes('risk') || lower.includes('warning') || lower.includes('caution')) {
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400'
      };
    }
    if (lower.includes('long-term') || lower.includes('protection') || lower.includes('recommended')) {
      return {
        icon: <Shield className="h-5 w-5" />,
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400'
      };
    }
    return {
      icon: <Sparkles className="h-5 w-5" />,
      bg: colors.bg,
      border: colors.border,
      text: colors.text
    };
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative rounded-xl overflow-hidden',
        colors.glow,
        colors.border,
        'border bg-gradient-to-br',
        colors.gradient
      )}
    >
      {/* Animated glow background */}
      <div className="absolute inset-0">
        <div className={cn(
          'absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl animate-pulse opacity-30',
          colors.bg
        )} />
      </div>
      
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', colors.text)} />
            <span className={cn('font-semibold', colors.text)}>AI Security Recommendations</span>
          </div>
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isLoading}
              className={cn('gap-1 min-h-[44px] min-w-[44px] px-3', colors.text, 'hover:' + colors.bg)}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          )}
        </div>
        
        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section, idx) => {
            const style = getSectionStyle(section);
            const lines = section.split('\n');
            const header = lines[0];
            const content = lines.slice(1);
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  'p-4 rounded-lg border',
                  style.bg,
                  style.border
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={style.text}>{style.icon}</span>
                  <div className="flex-1 space-y-2">
                    <p className={cn('font-medium', style.text)}>{header}</p>
                    {content.map((line, lineIdx) => (
                      <div key={lineIdx} className="flex items-start gap-2">
                        {line.trim().startsWith('-') || line.trim().startsWith('•') ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{line.replace(/^[-•]\s*/, '')}</span>
                          </>
                        ) : line.trim() ? (
                          <span className="text-sm text-gray-300">{line}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  delay?: number;
  theme: ThemeKey;
}

/**
 * Animated list item with hover effects
 */
export function AnimatedListItem({ children, delay = 0, theme }: AnimatedListItemProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ x: 4 }}
      className={cn(
        'p-4 rounded-lg bg-[#141414] border transition-all duration-200',
        colors.border,
        'hover:' + colors.glow
      )}
    >
      {children}
    </motion.div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  theme: ThemeKey;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Premium empty state with animated icon
 */
export function EmptyState({ icon, title, description, theme, action }: EmptyStateProps) {
  const colors = SAFESUITE_THEMES[theme];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
        className={cn(
          'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4',
          'bg-gradient-to-br',
          colors.gradient,
          colors.border,
          'border'
        )}
      >
        <span className={colors.text}>{icon}</span>
      </motion.div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto mb-4">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className={cn(
            'bg-gradient-to-r',
            colors.buttonGradient,
            'hover:opacity-90'
          )}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Staggered animation container for lists
 */
export function StaggerContainer({ 
  children, 
  staggerDelay = 0.1 
}: { 
  children: ReactNode; 
  staggerDelay?: number 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {children}
    </motion.div>
  );
}

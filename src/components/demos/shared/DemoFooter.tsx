import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DemoFooterProps {
  logoSrc: string;
  logoAlt: string;
  logoClassName?: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  colorTheme?: 'amber' | 'cyan' | 'violet' | 'emerald' | 'red';
  className?: string;
}

const colorClasses = {
  amber: {
    card: 'border-amber-500/20 bg-amber-500/5',
    button: 'bg-amber-500 hover:bg-amber-600 text-white focus-visible:ring-amber-500',
  },
  cyan: {
    card: 'border-cyan-500/20 bg-cyan-500/5',
    button: 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white focus-visible:ring-cyan-500',
  },
  violet: {
    card: 'border-violet-500/20 bg-violet-500/5',
    button: 'bg-violet-500 hover:bg-violet-600 text-white focus-visible:ring-violet-500',
  },
  emerald: {
    card: 'border-emerald-500/20 bg-emerald-500/5',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-white focus-visible:ring-emerald-500',
  },
  red: {
    card: 'border-red-500/20 bg-red-500/5',
    button: 'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500',
  },
};

export function DemoFooter({
  logoSrc,
  logoAlt,
  logoClassName = 'h-16 w-auto',
  title,
  description,
  ctaText,
  ctaHref,
  onCtaClick,
  colorTheme = 'amber',
  className
}: DemoFooterProps) {
  const colors = colorClasses[colorTheme];
  
  return (
    <Card className={cn(colors.card, className)}>
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img 
            src={logoSrc} 
            alt={logoAlt} 
            className={logoClassName}
            loading="lazy"
          />
        </div>
        <h4 className="text-lg font-bold mb-1">{title}</h4>
        <p className="text-muted-foreground text-sm mb-3">
          {description}
        </p>
        {ctaHref ? (
          <Button 
            className={colors.button}
            asChild
          >
            <a href={ctaHref}>{ctaText}</a>
          </Button>
        ) : (
          <Button 
            className={colors.button}
            onClick={onCtaClick}
          >
            {ctaText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

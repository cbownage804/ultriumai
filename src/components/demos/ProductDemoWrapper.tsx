import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, ExternalLink, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ProductDemoWrapperProps {
  children: React.ReactNode;
  productName: string;
  productColor?: 'emerald' | 'amber' | 'violet' | 'cyan' | 'primary' | 'red' | 'orange';
  compactMode?: boolean;
  compactHeight?: string;
  fullDemoPath?: string;
  onExpandClick?: () => void;
  showExpandButton?: boolean;
  badge?: string;
  description?: string;
}

const colorClasses = {
  emerald: {
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20'
  },
  amber: {
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    button: 'bg-amber-500 hover:bg-amber-600',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20'
  },
  violet: {
    badge: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    button: 'bg-violet-500 hover:bg-violet-600',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/20'
  },
  cyan: {
    badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    button: 'bg-cyan-500 hover:bg-cyan-600',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20'
  },
  primary: {
    badge: 'bg-primary/20 text-primary border-primary/30',
    button: 'bg-primary hover:bg-primary/90',
    border: 'border-primary/30',
    glow: 'shadow-primary/20'
  },
  red: {
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    button: 'bg-red-500 hover:bg-red-600',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20'
  },
  orange: {
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    button: 'bg-orange-500 hover:bg-orange-600',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20'
  }
};

export function ProductDemoWrapper({
  children,
  productName,
  productColor = 'primary',
  compactMode = false,
  compactHeight = 'h-[500px]',
  fullDemoPath,
  onExpandClick,
  showExpandButton = true,
  badge = 'Interactive Demo',
  description
}: ProductDemoWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = colorClasses[productColor];

  const handleExpand = () => {
    if (onExpandClick) {
      onExpandClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  if (compactMode && !isExpanded) {
    return (
      <Card className={cn('overflow-hidden', colors.border, colors.glow, 'shadow-lg')}>
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={colors.badge}>
                <Play className="h-3 w-3 mr-1" />
                {badge}
              </Badge>
              <CardTitle className="text-lg">{productName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {showExpandButton && (
                <Button variant="outline" size="sm" onClick={handleExpand}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Expand
                </Button>
              )}
              {fullDemoPath && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={fullDemoPath}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Full Demo
                  </Link>
                </Button>
              )}
            </div>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </CardHeader>
        <CardContent className={cn('p-0 overflow-hidden', compactHeight)}>
          <div className="h-full overflow-auto">
            {children}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full/expanded mode
  return (
    <div className="space-y-4">
      {compactMode && isExpanded && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExpand}>
            <Minimize2 className="h-4 w-4 mr-1" />
            Collapse
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}

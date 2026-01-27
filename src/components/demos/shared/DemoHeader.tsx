import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ProductBadge {
  icon: LucideIcon;
  label: string;
  colorClass: string;
}

interface DemoHeaderProps {
  logoSrc: string;
  logoAlt: string;
  logoClassName?: string;
  badges?: ProductBadge[];
  className?: string;
}

export function DemoHeader({
  logoSrc,
  logoAlt,
  logoClassName = 'h-28 w-auto',
  badges,
  className
}: DemoHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Centered Logo */}
      <div className="flex justify-center mb-4">
        <img 
          src={logoSrc} 
          alt={logoAlt} 
          className={logoClassName}
          loading="lazy"
        />
      </div>
      
      {/* Product Suite Badges */}
      {badges && badges.length > 0 && (
        <div 
          className="flex flex-wrap justify-center gap-2 mb-4"
          role="list"
          aria-label="Product features"
        >
          {badges.map((badge, index) => (
            <Badge 
              key={index} 
              className={badge.colorClass}
              role="listitem"
            >
              <badge.icon className="h-3 w-3 mr-1" aria-hidden="true" />
              <span>{badge.label}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

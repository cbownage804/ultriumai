import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';

// Hook for responsive design
export const useResponsive = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  return { isMobile, isTablet, isDesktop };
};

// Responsive Navigation Component
export const ResponsiveNavigation = ({ children }: { children: React.ReactNode }) => {
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return <>{children}</>;
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  mobile: number;
  tablet: number;
  desktop: number;
  className?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  mobile, 
  tablet, 
  desktop, 
  className = '' 
}: ResponsiveGridProps) => {
  const gridClass = `grid grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop} gap-4 ${className}`;
  
  return (
    <div className={gridClass}>
      {children}
    </div>
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  mobileLayout?: 'stack' | 'horizontal';
  className?: string;
}

export const ResponsiveCard = ({ 
  children, 
  mobileLayout = 'stack', 
  className = '' 
}: ResponsiveCardProps) => {
  const { isMobile } = useResponsive();
  
  const layoutClass = isMobile && mobileLayout === 'horizontal' 
    ? 'flex flex-row items-center gap-4' 
    : 'flex flex-col gap-4';
    
  return (
    <div className={`${layoutClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  mobileSize?: string;
  desktopSize?: string;
  className?: string;
}

export const ResponsiveText = ({ 
  children, 
  mobileSize = 'text-sm', 
  desktopSize = 'text-base',
  className = '' 
}: ResponsiveTextProps) => {
  return (
    <div className={`${mobileSize} md:${desktopSize} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Spacing Component
export const ResponsiveSpacing = ({ 
  mobile = 'p-4', 
  desktop = 'p-6', 
  children 
}: { 
  mobile?: string; 
  desktop?: string; 
  children: React.ReactNode; 
}) => {
  return (
    <div className={`${mobile} md:${desktop}`}>
      {children}
    </div>
  );
};

// Mobile-first breakpoint utilities
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Responsive image component with lazy loading
interface ResponsiveImageProps {
  src: string;
  alt: string;
  mobileHeight?: string;
  desktopHeight?: string;
  className?: string;
}

export const ResponsiveImage = ({ 
  src, 
  alt, 
  mobileHeight = 'h-48', 
  desktopHeight = 'h-64',
  className = '' 
}: ResponsiveImageProps) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className={`${mobileHeight} md:${desktopHeight} overflow-hidden rounded-lg ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!loaded && (
        <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}
    </div>
  );
};

// Touch-friendly button component for mobile
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TouchButton = ({ 
  children, 
  onClick, 
  variant = 'default',
  size = 'md',
  className = '' 
}: TouchButtonProps) => {
  const { isMobile } = useResponsive();
  
  const sizeClass = isMobile 
    ? 'min-h-[44px] min-w-[44px] px-4 py-2' // Touch-friendly minimum size
    : size === 'sm' ? 'px-3 py-1.5' 
    : size === 'lg' ? 'px-6 py-3'
    : 'px-4 py-2';
    
  return (
    <Button 
      variant={variant} 
      onClick={onClick}
      className={`${sizeClass} ${className}`}
    >
      {children}
    </Button>
  );
};
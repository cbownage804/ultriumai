import { cn } from "@/lib/utils";

interface HeroSectionProps {
  imageSrc: string;
  imageAlt: string;
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
  imageClassName?: string;
}

export function HeroSection({ 
  imageSrc, 
  imageAlt, 
  overlayOpacity = 0.7, 
  children, 
  className,
  imageClassName 
}: HeroSectionProps) {
  return (
    <section className={cn("relative min-h-[70vh] flex items-center overflow-hidden", className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={imageSrc} 
          alt={imageAlt}
          className={cn(
            "w-full h-full object-cover",
            imageClassName
          )}
        />
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"
          style={{ opacity: overlayOpacity }}
        />
        {/* Extra gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  );
}

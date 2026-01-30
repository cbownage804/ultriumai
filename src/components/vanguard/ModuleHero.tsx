import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ModuleLogo, ModuleName, getModuleBackground, moduleColors } from './ModuleLogo';

interface ModuleHeroProps {
  module: ModuleName;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function ModuleHero({ 
  module, 
  title, 
  subtitle, 
  children, 
  className,
  compact = false 
}: ModuleHeroProps) {
  const background = getModuleBackground(module);
  const colors = moduleColors[module];

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        compact ? "py-6" : "py-12",
        className
      )}
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${background})` }}
      />
      
      {/* Dark Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/70" />
      
      {/* Bottom Fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050a0a] to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 px-6">
        <div className="flex items-center gap-4">
          {/* Module Logo */}
          <div className={cn(
            "p-3 rounded-xl border backdrop-blur-sm",
            `bg-${colors.primary}/20 border-${colors.primary}/30`
          )}
          style={{
            backgroundColor: `${colors.glow.replace('0.5', '0.2')}`,
            borderColor: `${colors.glow.replace('0.5', '0.3')}`,
          }}
          >
            <ModuleLogo module={module} size="xl" glow />
          </div>
          
          {/* Title & Subtitle */}
          <div>
            <h1 className={cn(
              "font-bold bg-clip-text text-transparent",
              compact ? "text-xl" : "text-2xl md:text-3xl",
              `bg-gradient-to-r ${colors.gradient} to-white`
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Additional Content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Simpler version just for section headers
interface ModuleSectionHeaderProps {
  module: ModuleName;
  title: string;
  className?: string;
}

export function ModuleSectionHeader({ module, title, className }: ModuleSectionHeaderProps) {
  const colors = moduleColors[module];
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        className="p-2 rounded-lg border backdrop-blur-sm"
        style={{
          backgroundColor: `${colors.glow.replace('0.5', '0.15')}`,
          borderColor: `${colors.glow.replace('0.5', '0.25')}`,
        }}
      >
        <ModuleLogo module={module} size="md" glow />
      </div>
      <h2 className={cn(
        "text-lg font-semibold bg-clip-text text-transparent",
        `bg-gradient-to-r ${colors.gradient} to-white`
      )}>
        {title}
      </h2>
    </div>
  );
}

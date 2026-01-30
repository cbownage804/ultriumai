import { cn } from '@/lib/utils';

// Import all module logos
import horizonLogo from '@/assets/vanguard/module-horizon.png';
import pursuitLogo from '@/assets/vanguard/module-pursuit.png';
import responseLogo from '@/assets/vanguard/module-response.png';
import reconLogo from '@/assets/vanguard/module-recon.png';
import atlasLogo from '@/assets/vanguard/module-atlas.png';
import ledgerLogo from '@/assets/vanguard/module-ledger.png';
import cortexLogo from '@/assets/vanguard/module-cortex.png';

// Import all module backgrounds
import horizonBg from '@/assets/vanguard/bg-horizon.jpg';
import pursuitBg from '@/assets/vanguard/bg-pursuit.jpg';
import responseBg from '@/assets/vanguard/bg-response.jpg';
import reconBg from '@/assets/vanguard/bg-recon.jpg';
import atlasBg from '@/assets/vanguard/bg-atlas.jpg';
import ledgerBg from '@/assets/vanguard/bg-ledger.jpg';
import cortexBg from '@/assets/vanguard/bg-cortex.jpg';

export type ModuleName = 'horizon' | 'pursuit' | 'response' | 'recon' | 'atlas' | 'ledger' | 'cortex';

const moduleLogos: Record<ModuleName, string> = {
  horizon: horizonLogo,
  pursuit: pursuitLogo,
  response: responseLogo,
  recon: reconLogo,
  atlas: atlasLogo,
  ledger: ledgerLogo,
  cortex: cortexLogo,
};

const moduleBackgrounds: Record<ModuleName, string> = {
  horizon: horizonBg,
  pursuit: pursuitBg,
  response: responseBg,
  recon: reconBg,
  atlas: atlasBg,
  ledger: ledgerBg,
  cortex: cortexBg,
};

// Module color schemes for consistent styling
export const moduleColors: Record<ModuleName, { primary: string; glow: string; gradient: string }> = {
  horizon: {
    primary: 'cyan-400',
    glow: 'rgba(6,182,212,0.5)',
    gradient: 'from-cyan-500 to-teal-500',
  },
  pursuit: {
    primary: 'red-500',
    glow: 'rgba(239,68,68,0.5)',
    gradient: 'from-red-500 to-orange-500',
  },
  response: {
    primary: 'purple-500',
    glow: 'rgba(168,85,247,0.5)',
    gradient: 'from-purple-500 to-pink-500',
  },
  recon: {
    primary: 'blue-500',
    glow: 'rgba(59,130,246,0.5)',
    gradient: 'from-blue-500 to-cyan-500',
  },
  atlas: {
    primary: 'amber-500',
    glow: 'rgba(245,158,11,0.5)',
    gradient: 'from-amber-500 to-yellow-500',
  },
  ledger: {
    primary: 'emerald-500',
    glow: 'rgba(16,185,129,0.5)',
    gradient: 'from-emerald-500 to-teal-500',
  },
  cortex: {
    primary: 'violet-500',
    glow: 'rgba(139,92,246,0.5)',
    gradient: 'from-violet-500 to-purple-500',
  },
};

interface ModuleLogoProps {
  module: ModuleName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function ModuleLogo({ module, size = 'sm', className, glow = false }: ModuleLogoProps) {
  const logo = moduleLogos[module];
  const colors = moduleColors[module];
  
  if (!logo) {
    return null;
  }

  return (
    <img 
      src={logo} 
      alt={`Vanguard ${module.charAt(0).toUpperCase() + module.slice(1)}`}
      className={cn(
        sizeClasses[size],
        'object-contain',
        glow && `drop-shadow-[0_0_8px_${colors.glow}]`,
        className
      )}
    />
  );
}

// Helper function to get module background
export function getModuleBackground(module: ModuleName): string {
  return moduleBackgrounds[module];
}

// Export logos for direct use if needed
export { horizonLogo, pursuitLogo, responseLogo, reconLogo, atlasLogo, ledgerLogo, cortexLogo };

// Export backgrounds for direct use
export { horizonBg, pursuitBg, responseBg, reconBg, atlasBg, ledgerBg, cortexBg };

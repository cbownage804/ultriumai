import { cn } from '@/lib/utils';

// Import all module logos
import horizonLogo from '@/assets/vanguard/module-horizon.png';
import pursuitLogo from '@/assets/vanguard/module-pursuit.png';
import responseLogo from '@/assets/vanguard/module-response.png';
import reconLogo from '@/assets/vanguard/module-recon.png';
import atlasLogo from '@/assets/vanguard/module-atlas.png';
import ledgerLogo from '@/assets/vanguard/module-ledger.png';
import cortexLogo from '@/assets/vanguard/module-cortex.png';

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
        glow && 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
        className
      )}
    />
  );
}

// Export logos for direct use if needed
export { horizonLogo, pursuitLogo, responseLogo, reconLogo, atlasLogo, ledgerLogo, cortexLogo };

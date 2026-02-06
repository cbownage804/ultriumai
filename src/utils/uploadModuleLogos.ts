import { supabase } from '@/integrations/supabase/client';

// Import all module logos
import horizonLogo from '@/assets/vanguard/module-horizon.png';
import pursuitLogo from '@/assets/vanguard/module-pursuit.png';
import responseLogo from '@/assets/vanguard/module-response.png';
import reconLogo from '@/assets/vanguard/module-recon.png';
import atlasLogo from '@/assets/vanguard/module-atlas.png';
import ledgerLogo from '@/assets/vanguard/module-ledger.png';
import cortexLogo from '@/assets/vanguard/module-cortex.png';
import sentinelLogo from '@/assets/vanguard/module-sentinel.png';
import complyLogo from '@/assets/vanguard/module-comply.png';

const MODULE_LOGO_MAP: Record<string, string> = {
  'vanguard-horizon-logo.png': horizonLogo,
  'vanguard-pursuit-logo.png': pursuitLogo,
  'vanguard-response-logo.png': responseLogo,
  'vanguard-recon-logo.png': reconLogo,
  'vanguard-atlas-logo.png': atlasLogo,
  'vanguard-ledger-logo.png': ledgerLogo,
  'vanguard-cortex-logo.png': cortexLogo,
  'vanguard-sentinel-logo.png': sentinelLogo,
  'vanguard-comply-logo.png': complyLogo,
};

export async function uploadModuleLogos(): Promise<{ results: string[] }> {
  const results: string[] = [];

  // Check existing files
  const { data: existingFiles } = await supabase.storage
    .from('social-media-images')
    .list('logos');
  const existingNames = new Set(existingFiles?.map(f => f.name) || []);

  for (const [fileName, importedUrl] of Object.entries(MODULE_LOGO_MAP)) {
    if (existingNames.has(fileName)) {
      results.push(`${fileName}: already exists`);
      continue;
    }

    try {
      const response = await fetch(importedUrl);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('social-media-images')
        .upload(`logos/${fileName}`, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        results.push(`${fileName}: failed - ${error.message}`);
      } else {
        results.push(`${fileName}: uploaded ✓`);
      }
    } catch (err: any) {
      results.push(`${fileName}: error - ${err.message}`);
    }
  }

  return { results };
}

import { supabase } from '@/integrations/supabase/client';

// Import watermark-optimized logos for storage upload
import horizonLogo from '@/assets/watermarks/vanguard-horizon-logo.png';
import pursuitLogo from '@/assets/watermarks/vanguard-pursuit-logo.png';
import responseLogo from '@/assets/watermarks/vanguard-response-logo.png';
import reconLogo from '@/assets/watermarks/vanguard-recon-logo.png';
import atlasLogo from '@/assets/watermarks/vanguard-atlas-logo.png';
import ledgerLogo from '@/assets/watermarks/vanguard-ledger-logo.png';
import cortexLogo from '@/assets/watermarks/vanguard-cortex-logo.png';
import sentinelLogo from '@/assets/watermarks/vanguard-sentinel-logo.png';
import complyLogo from '@/assets/watermarks/vanguard-comply-logo.png';

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

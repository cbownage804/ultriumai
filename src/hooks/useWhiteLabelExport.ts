import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface WhiteLabelConfig {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  favicon: string;
  customDomain: string;
  removeBranding: boolean;
  customFooter: string;
  metaTitle: string;
  metaDescription: string;
}

export function useWhiteLabelExport() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    brandName: '',
    logoUrl: '',
    primaryColor: '#0078D4',
    secondaryColor: '#106EBE',
    favicon: '',
    customDomain: '',
    removeBranding: true,
    customFooter: '',
    metaTitle: '',
    metaDescription: '',
  });

  const applyWhiteLabel = useCallback((files: ProjectFile[]): ProjectFile[] => {
    return files.map(f => {
      let content = f.content;

      // Replace branding references
      if (config.removeBranding) {
        content = content.replace(/Ultrium\s*AI\s*Studio/gi, config.brandName || 'App');
        content = content.replace(/Ultrium/gi, config.brandName || 'App');
        content = content.replace(/ultrium/gi, (config.brandName || 'app').toLowerCase());
      }

      // Replace primary colors in CSS/Tailwind
      if (config.primaryColor && f.path.endsWith('.css')) {
        content = content.replace(/--primary:\s*[^;]+;/g, `--primary: ${hexToHSL(config.primaryColor)};`);
      }

      // Replace logo references
      if (config.logoUrl && content.includes('ultriumLogo')) {
        content = content.replace(/ultriumLogo/g, `'${config.logoUrl}'`);
      }

      // Update meta tags in index.html
      if (f.path === 'index.html' || f.path.includes('index.html')) {
        if (config.metaTitle) content = content.replace(/<title>[^<]*<\/title>/, `<title>${config.metaTitle}</title>`);
        if (config.favicon) content = content.replace(/href="[^"]*favicon[^"]*"/, `href="${config.favicon}"`);
      }

      return { ...f, content };
    });
  }, [config]);

  const generateBrandCSS = useCallback((): string => {
    return `:root {
  --brand-primary: ${config.primaryColor};
  --brand-secondary: ${config.secondaryColor};
  --brand-name: '${config.brandName}';
}

/* White-label overrides */
.brand-logo { content: url('${config.logoUrl}'); }
.brand-name::after { content: '${config.brandName}'; }
${config.removeBranding ? '\n/* Branding removed */\n.powered-by, .ultrium-badge { display: none !important; }' : ''}
${config.customFooter ? `\n.custom-footer::after { content: '${config.customFooter}'; }` : ''}
`;
  }, [config]);

  const previewChanges = useCallback((files: ProjectFile[]): { path: string; changes: string[] }[] => {
    const result: { path: string; changes: string[] }[] = [];
    files.forEach(f => {
      const changes: string[] = [];
      if (config.removeBranding && /ultrium/i.test(f.content)) changes.push(`Replace "Ultrium" → "${config.brandName}"`);
      if (config.primaryColor && f.path.endsWith('.css') && f.content.includes('--primary')) changes.push('Update primary color');
      if (config.logoUrl && f.content.includes('ultriumLogo')) changes.push('Replace logo');
      if (changes.length > 0) result.push({ path: f.path, changes });
    });
    return result;
  }, [config]);

  return { config, setConfig, applyWhiteLabel, generateBrandCSS, previewChanges };
}

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

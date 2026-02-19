import { useState, useCallback } from 'react';

export interface AppStoreMetadata {
  appName: string;
  subtitle: string;
  description: string;
  keywords: string[];
  category: string;
  privacyUrl: string;
  supportUrl: string;
  marketingUrl: string;
}

export interface ScreenshotConfig {
  id: string;
  device: string;
  dimensions: { width: number; height: number };
  label: string;
  backgroundColor: string;
  captionText: string;
}

const DEVICE_PRESETS = [
  { device: 'iPhone 15 Pro Max', width: 1290, height: 2796 },
  { device: 'iPhone 15 Pro', width: 1179, height: 2556 },
  { device: 'iPad Pro 12.9"', width: 2048, height: 2732 },
  { device: 'Pixel 8 Pro', width: 1344, height: 2992 },
  { device: 'Samsung Galaxy S24', width: 1440, height: 3120 },
];

const APP_CATEGORIES = [
  'Business', 'Developer Tools', 'Education', 'Entertainment', 'Finance',
  'Health & Fitness', 'Lifestyle', 'Productivity', 'Social Networking', 'Utilities',
];

export function useAppStoreAssets() {
  const [metadata, setMetadata] = useState<AppStoreMetadata>({
    appName: '', subtitle: '', description: '', keywords: [],
    category: 'Productivity', privacyUrl: '', supportUrl: '', marketingUrl: '',
  });
  const [screenshots, setScreenshots] = useState<ScreenshotConfig[]>([]);

  const updateMetadata = useCallback((partial: Partial<AppStoreMetadata>) => {
    setMetadata(prev => ({ ...prev, ...partial }));
  }, []);

  const addKeyword = useCallback((keyword: string) => {
    setMetadata(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keyword) ? prev.keywords : [...prev.keywords, keyword],
    }));
  }, []);

  const removeKeyword = useCallback((keyword: string) => {
    setMetadata(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keyword) }));
  }, []);

  const addScreenshot = useCallback((device: string) => {
    const preset = DEVICE_PRESETS.find(d => d.device === device) || DEVICE_PRESETS[0];
    setScreenshots(prev => [...prev, {
      id: crypto.randomUUID(),
      device: preset.device,
      dimensions: { width: preset.width, height: preset.height },
      label: `Screenshot ${prev.length + 1}`,
      backgroundColor: '#ffffff',
      captionText: '',
    }]);
  }, []);

  const updateScreenshot = useCallback((id: string, partial: Partial<ScreenshotConfig>) => {
    setScreenshots(prev => prev.map(s => s.id === id ? { ...s, ...partial } : s));
  }, []);

  const removeScreenshot = useCallback((id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  }, []);

  const generateFastlaneMetadata = useCallback(() => {
    return `# Fastlane Metadata
# Place in fastlane/metadata/en-US/

# name.txt
${metadata.appName}

# subtitle.txt
${metadata.subtitle}

# description.txt
${metadata.description}

# keywords.txt
${metadata.keywords.join(', ')}

# primary_category.txt
${metadata.category}

# privacy_url.txt
${metadata.privacyUrl}

# support_url.txt
${metadata.supportUrl}

# marketing_url.txt
${metadata.marketingUrl}
`;
  }, [metadata]);

  const generateStoreListingHTML = useCallback(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${metadata.appName} - App Store Preview</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #f5f5f7; }
  .header { text-align: center; margin-bottom: 2rem; }
  h1 { font-size: 2rem; margin: 0; } .subtitle { color: #666; font-size: 1.1rem; }
  .screenshots { display: flex; gap: 1rem; overflow-x: auto; padding: 1rem 0; }
  .screenshot { min-width: 200px; height: 400px; border-radius: 20px; background: #ddd; display: flex; align-items: center; justify-content: center; }
  .description { white-space: pre-line; line-height: 1.6; }
  .keywords { display: flex; flex-wrap: wrap; gap: 0.5rem; } .keyword { background: #e0e0e0; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; }
</style></head>
<body>
  <div class="header">
    <h1>${metadata.appName}</h1>
    <p class="subtitle">${metadata.subtitle}</p>
  </div>
  <div class="screenshots">${screenshots.map(s => `<div class="screenshot" style="background:${s.backgroundColor}"><span>${s.captionText || s.device}</span></div>`).join('')}</div>
  <h2>Description</h2>
  <p class="description">${metadata.description}</p>
  <h2>Keywords</h2>
  <div class="keywords">${metadata.keywords.map(k => `<span class="keyword">${k}</span>`).join('')}</div>
</body></html>`;
  }, [metadata, screenshots]);

  return {
    metadata, updateMetadata, addKeyword, removeKeyword,
    screenshots, addScreenshot, updateScreenshot, removeScreenshot,
    generateFastlaneMetadata, generateStoreListingHTML,
    devicePresets: DEVICE_PRESETS, appCategories: APP_CATEGORIES,
  };
}

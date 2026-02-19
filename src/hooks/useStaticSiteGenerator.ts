import { useState, useCallback } from 'react';

export interface SSGPage {
  id: string;
  route: string;
  title: string;
  template: 'page' | 'blog' | 'landing' | 'docs';
  content: string;
  isGenerated: boolean;
  generatedAt: Date | null;
  fileSizeKB: number;
}

export interface SSGConfig {
  outputDir: string;
  baseUrl: string;
  generateSitemap: boolean;
  generateRobotsTxt: boolean;
  minifyHTML: boolean;
  inlineCSS: boolean;
  prefetchLinks: boolean;
  trailingSlash: boolean;
}

export function useStaticSiteGenerator() {
  const [pages, setPages] = useState<SSGPage[]>([]);
  const [config, setConfig] = useState<SSGConfig>({
    outputDir: 'dist', baseUrl: 'https://example.com',
    generateSitemap: true, generateRobotsTxt: true,
    minifyHTML: true, inlineCSS: false, prefetchLinks: true, trailingSlash: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const addPage = useCallback((route: string, title: string, template: SSGPage['template'] = 'page') => {
    const page: SSGPage = {
      id: crypto.randomUUID(), route, title, template,
      content: `<h1>${title}</h1>\n<p>Content for ${route}</p>`,
      isGenerated: false, generatedAt: null, fileSizeKB: 0,
    };
    setPages(prev => [...prev, page]);
  }, []);

  const updatePage = useCallback((id: string, update: Partial<SSGPage>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
  }, []);

  const removePage = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  }, []);

  const generateAll = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setPages(prev => prev.map(p => ({
        ...p, isGenerated: true, generatedAt: new Date(),
        fileSizeKB: Math.floor(Math.random() * 50) + 5,
      })));
      setIsGenerating(false);
    }, 1500);
  }, []);

  const generateSitemap = useCallback((): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${config.baseUrl}${p.route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>${p.route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
  }, [pages, config]);

  const generateRobotsTxt = useCallback((): string => {
    return `User-agent: *\nAllow: /\n\nSitemap: ${config.baseUrl}/sitemap.xml`;
  }, [config]);

  const generateBuildScript = useCallback((): string => {
    return `#!/bin/bash
# Static Site Build Script
set -e

echo "🏗️ Building static site..."
OUTPUT_DIR="${config.outputDir}"
mkdir -p $OUTPUT_DIR

# Build React app
npm run build

# Copy build output
cp -r build/* $OUTPUT_DIR/

${config.generateSitemap ? '# Generate sitemap\necho "Generating sitemap.xml..."' : ''}
${config.generateRobotsTxt ? '# Generate robots.txt\necho "Generating robots.txt..."' : ''}
${config.minifyHTML ? '# Minify HTML\nfind $OUTPUT_DIR -name "*.html" -exec html-minifier --collapse-whitespace --remove-comments {} -o {} \\;' : ''}

echo "✅ Static site generated in $OUTPUT_DIR/"
echo "📊 Total pages: ${pages.length}"
du -sh $OUTPUT_DIR`;
  }, [config, pages]);

  const getStats = useCallback(() => ({
    totalPages: pages.length,
    generatedPages: pages.filter(p => p.isGenerated).length,
    totalSizeKB: pages.reduce((acc, p) => acc + p.fileSizeKB, 0),
    avgSizeKB: pages.length > 0 ? Math.round(pages.reduce((acc, p) => acc + p.fileSizeKB, 0) / pages.length) : 0,
  }), [pages]);

  return {
    pages, config, setConfig, isGenerating,
    addPage, updatePage, removePage, generateAll,
    generateSitemap, generateRobotsTxt, generateBuildScript, getStats,
  };
}

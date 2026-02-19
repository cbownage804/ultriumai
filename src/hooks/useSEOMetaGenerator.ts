import { useState, useCallback } from 'react';

export interface SEOPageMeta {
  id: string;
  route: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  noIndex: boolean;
}

export function useSEOMetaGenerator() {
  const [pages, setPages] = useState<SEOPageMeta[]>([
    { id: '1', route: '/', title: 'Home | My App', description: 'Welcome to our application', ogTitle: '', ogDescription: '', ogImage: '', canonical: '', noIndex: false },
    { id: '2', route: '/about', title: 'About | My App', description: 'Learn more about us', ogTitle: '', ogDescription: '', ogImage: '', canonical: '', noIndex: false },
  ]);
  const [siteUrl, setSiteUrl] = useState('https://example.com');
  const [defaultOgImage, setDefaultOgImage] = useState('/og-image.png');

  const addPage = useCallback(() => {
    setPages(prev => [...prev, { id: crypto.randomUUID(), route: '/new-page', title: '', description: '', ogTitle: '', ogDescription: '', ogImage: '', canonical: '', noIndex: false }]);
  }, []);

  const updatePage = useCallback((id: string, updates: Partial<SEOPageMeta>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePage = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  }, []);

  const generateHelmetComponent = useCallback((): string => {
    return `import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export function SEOHead({ title, description, ogTitle, ogDescription, ogImage = '${defaultOgImage}', canonical, noIndex }: SEOProps) {
  useEffect(() => {
    document.title = title;
    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(\`meta[\${attr}="\${name}"]\`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('description', description);
    setMeta('og:title', ogTitle || title, 'property');
    setMeta('og:description', ogDescription || description, 'property');
    setMeta('og:image', ogImage.startsWith('http') ? ogImage : '${siteUrl}' + ogImage, 'property');
    setMeta('og:type', 'website', 'property');
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
      link.href = canonical;
    }
    if (noIndex) setMeta('robots', 'noindex, nofollow');
  }, [title, description, ogTitle, ogDescription, ogImage, canonical, noIndex]);

  return null;
}

// Usage per page:
${pages.map(p => `// <SEOHead title="${p.title}" description="${p.description}"${p.ogTitle ? ` ogTitle="${p.ogTitle}"` : ''}${p.noIndex ? ' noIndex' : ''} />`).join('\n')}`;
  }, [pages, siteUrl, defaultOgImage]);

  const generateSitemapCode = useCallback((): string => {
    const urls = pages.filter(p => !p.noIndex).map(p =>
      `  <url>\n    <loc>${siteUrl}${p.route}</loc>\n    <lastmod>\${today}</lastmod>\n    <priority>${p.route === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
    ).join('\n');

    return `// sitemap.xml generator utility
export function generateSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  return \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>\`;
}`;
  }, [pages, siteUrl]);

  return { pages, siteUrl, defaultOgImage, setSiteUrl, setDefaultOgImage, addPage, updatePage, removePage, generateHelmetComponent, generateSitemapCode };
}

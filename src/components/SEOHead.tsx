import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  structuredData?: object;
}

/**
 * Enhanced SEO component with full meta tag management, structured data, and accessibility.
 * Uses direct DOM manipulation for SPA compatibility.
 */
export const SEOHead = ({
  title,
  description,
  canonicalPath,
  ogImage = '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png',
  ogType = 'website',
  keywords,
  author = 'UltriumAI',
  publishedTime,
  modifiedTime,
  noIndex = false,
  structuredData
}: SEOHeadProps) => {
  useEffect(() => {
    // Set document title with brand suffix
    const fullTitle = title.includes('UltriumAI') ? title : `${title} | UltriumAI`;
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMetaTag = (property: string, content: string, isOG = false) => {
      const attr = isOG ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      if (meta) {
        meta.content = content;
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Update meta description
    setMetaTag('description', description);

    // Keywords
    if (keywords) {
      setMetaTag('keywords', keywords);
    }

    // Author
    setMetaTag('author', author);

    // Robots
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1');
    }

    // Update Open Graph tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', 'UltriumAI', true);
    setMetaTag('og:locale', 'en_US', true);
    
    if (ogImage) {
      const fullImageUrl = ogImage.startsWith('http') ? ogImage : `https://ultriumai.com${ogImage}`;
      setMetaTag('og:image', fullImageUrl, true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
      setMetaTag('og:image:alt', title, true);
    }

    // Update Twitter tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:site', '@ultriumai');
    setMetaTag('twitter:creator', '@ultriumai');
    if (ogImage) {
      const fullImageUrl = ogImage.startsWith('http') ? ogImage : `https://ultriumai.com${ogImage}`;
      setMetaTag('twitter:image', fullImageUrl);
      setMetaTag('twitter:image:alt', title);
    }

    // Article-specific meta tags
    if (ogType === 'article') {
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true);
      }
      setMetaTag('article:author', author, true);
    }

    // Update canonical URL
    if (canonicalPath) {
      const canonicalUrl = `https://ultriumai.com${canonicalPath}`;
      setMetaTag('og:url', canonicalUrl, true);
      setMetaTag('twitter:url', canonicalUrl);
      
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (canonical) {
        canonical.href = canonicalUrl;
      } else {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = canonicalUrl;
        document.head.appendChild(canonical);
      }
    }

    // Structured data injection
    if (structuredData) {
      const existingScript = document.querySelector('script[data-seo-ld]');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-ld', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = 'UltriumAI - Built for Business. Secure by Design';
      // Remove dynamic structured data
      const dynamicScript = document.querySelector('script[data-seo-ld]');
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [title, description, canonicalPath, ogImage, ogType, keywords, author, publishedTime, modifiedTime, noIndex, structuredData]);

  return null;
};

import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
}

/**
 * SEO component that sets document title and manages meta tags dynamically.
 * Since we can't use react-helmet, this uses direct DOM manipulation.
 */
export const SEOHead = ({
  title,
  description,
  canonicalPath,
  ogImage = '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png',
  ogType = 'website'
}: SEOHeadProps) => {
  useEffect(() => {
    // Set document title
    document.title = title;

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

    // Update Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    if (ogImage) {
      const fullImageUrl = ogImage.startsWith('http') ? ogImage : `https://ultriumai.com${ogImage}`;
      setMetaTag('og:image', fullImageUrl, true);
    }

    // Update Twitter tags
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);

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

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = 'UltriumAI - Built for Business. Secure by Design';
    };
  }, [title, description, canonicalPath, ogImage, ogType]);

  return null;
};

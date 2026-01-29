import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbSchemaProps {
  items?: BreadcrumbItem[];
}

/**
 * Generates breadcrumb structured data for improved SEO navigation.
 * Auto-generates from current path if items not provided.
 */
export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const location = useLocation();

  useEffect(() => {
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
      if (items && items.length > 0) return items;

      const pathSegments = location.pathname.split('/').filter(Boolean);
      const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', path: '/' }];

      let currentPath = '';
      pathSegments.forEach((segment) => {
        currentPath += `/${segment}`;
        const name = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        breadcrumbs.push({ name, path: currentPath });
      });

      return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();
    
    if (breadcrumbs.length <= 1) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `https://ultriumai.com${item.path}`
      }))
    };

    const existingScript = document.querySelector('script[data-breadcrumb-schema]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumb-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const script = document.querySelector('script[data-breadcrumb-schema]');
      if (script) {
        script.remove();
      }
    };
  }, [location.pathname, items]);

  return null;
};

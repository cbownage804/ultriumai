import { useEffect } from 'react';

interface ProductJsonLdProps {
  name: string;
  description: string;
  image?: string;
  brand?: string;
  category?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price?: string;
    priceCurrency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  url?: string;
}

/**
 * Injects JSON-LD structured data for SoftwareApplication schema.
 * Improves SEO and rich search results for product pages.
 */
export function ProductJsonLd({
  name,
  description,
  image,
  brand = 'UltriumAI',
  category,
  applicationCategory = 'SecurityApplication',
  operatingSystem = 'Web Browser',
  offers,
  aggregateRating,
  url
}: ProductJsonLdProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `jsonld-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      description,
      applicationCategory,
      operatingSystem,
      brand: {
        '@type': 'Organization',
        name: brand
      }
    };

    if (image) {
      jsonLd.image = image;
    }

    if (category) {
      jsonLd.softwareVersion = category;
    }

    if (url) {
      jsonLd.url = url;
    }

    if (offers) {
      jsonLd.offers = {
        '@type': 'Offer',
        price: offers.price || '0',
        priceCurrency: offers.priceCurrency || 'USD',
        availability: `https://schema.org/${offers.availability || 'InStock'}`
      };
    }

    if (aggregateRating) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1
      };
    }

    script.textContent = JSON.stringify(jsonLd);
    
    // Remove existing script with same ID if present
    const existing = document.getElementById(script.id);
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(script.id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, image, brand, category, applicationCategory, operatingSystem, offers, aggregateRating, url]);

  return null;
}

interface FAQJsonLdProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Injects JSON-LD structured data for FAQ schema.
 * Improves SEO for FAQ sections on product pages.
 */
export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  useEffect(() => {
    if (questions.length === 0) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-faq';
    
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: questions.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      }))
    };

    script.textContent = JSON.stringify(jsonLd);
    
    // Remove existing script if present
    const existing = document.getElementById(script.id);
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(script.id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [questions]);

  return null;
}

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

/**
 * Injects JSON-LD structured data for Organization schema.
 */
export function OrganizationJsonLd({
  name = 'UltriumAI',
  url = 'https://ultriumai.com',
  logo = 'https://ultriumai.com/logo.png',
  sameAs = []
}: OrganizationJsonLdProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-organization';
    
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url,
      logo,
      sameAs
    };

    script.textContent = JSON.stringify(jsonLd);
    
    // Remove existing script if present
    const existing = document.getElementById(script.id);
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(script.id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, url, logo, sameAs]);

  return null;
}

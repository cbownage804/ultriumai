import { useEffect } from 'react';

/**
 * Injects Organization schema.org structured data for improved SEO.
 * Should be placed once in the app, typically in the root layout.
 */
export const OrganizationSchema = () => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "UltriumAI",
      "alternateName": "Ultrium AI",
      "url": "https://ultriumai.com",
      "logo": "https://ultriumai.com/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png",
      "description": "UltriumAI provides AI-powered knowledge management and cybersecurity solutions for businesses, MSPs, and MSSPs.",
      "foundingDate": "2024",
      "sameAs": [
        "https://twitter.com/ultriumai",
        "https://linkedin.com/company/ultriumai",
        "https://github.com/ultriumai"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@ultriumai.com",
        "availableLanguage": ["English"]
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "offers": [
          {
            "@type": "Offer",
            "name": "AI Studio",
            "description": "Build, deploy, and govern AI assistants"
          },
          {
            "@type": "Offer",
            "name": "Vanguard",
            "description": "AI-powered security & operations platform"
          },
          {
            "@type": "Offer",
            "name": "Wrayth",
            "description": "Simple, modern security for people & small teams"
          }
        ]
      }
    };

    const existingScript = document.querySelector('script[data-org-schema]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-org-schema', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.querySelector('script[data-org-schema]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  return null;
};

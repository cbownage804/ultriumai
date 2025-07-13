import { useEffect } from 'react';

export const FAQSchema = ({ faqs }: { faqs: Array<{ question: string; answer: string }> }) => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};

export const OrganizationSchema = () => {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "UltriumAI",
    "url": "https://ultriumai.com",
    "logo": "https://ultriumai.com/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png",
    "description": "Complete cybersecurity platform with AI-powered intelligence, comprehensive RMM tools, MSP management, and advanced threat detection for businesses of all sizes.",
    "foundingDate": "2024",
    "industry": "Cybersecurity",
    "headquartersAddress": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://ultriumai.com/contact"
    },
    "sameAs": [
      "https://twitter.com/ultriumai"
    ],
    "serviceArea": {
      "@type": "Place",
      "name": "Worldwide"
    },
    "knowsAbout": [
      "Cybersecurity",
      "AI Security",
      "MSP Tools",
      "Remote Monitoring",
      "Threat Detection",
      "Business Security",
      "SIEM",
      "Endpoint Detection"
    ]
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(orgSchema);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};

export const ServiceSchema = ({ services }: { services: Array<{ name: string; description: string; url: string }> }) => {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "provider": {
      "@type": "Organization",
      "name": "UltriumAI",
      "url": "https://ultriumai.com"
    },
    "serviceType": "Cybersecurity Platform",
    "description": "AI-powered cybersecurity platform with comprehensive security tools and MSP management capabilities",
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "UltriumAI Security Services",
      "itemListElement": services.map((service, index) => ({
        "@type": "Offer",
        "name": service.name,
        "description": service.description,
        "url": service.url,
        "position": index + 1
      }))
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(serviceSchema);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};
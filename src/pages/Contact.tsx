import Navigation from "@/components/Navigation";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Contact = () => {
  useEffect(() => {
    // Set page-specific meta tags
    document.title = "Contact UltriumAI - Custom AI Agents & GPT Solutions | Free Discovery Call";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Contact UltriumAI for custom AI agents and GPT solutions. Schedule your free discovery call today. Expert cybersecurity-focused AI development in Virginia.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Contact UltriumAI for custom AI agents and GPT solutions. Schedule your free discovery call today. Expert cybersecurity-focused AI development in Virginia.';
      document.head.appendChild(meta);
    }

    // Keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'contact UltriumAI, custom AI agents, GPT solutions, AI development, cybersecurity AI, Virginia AI company, discovery call, MSP AI, MSSP AI');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'contact UltriumAI, custom AI agents, GPT solutions, AI development, cybersecurity AI, Virginia AI company, discovery call, MSP AI, MSSP AI';
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Contact UltriumAI - Custom AI Agents & GPT Solutions');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'Contact UltriumAI - Custom AI Agents & GPT Solutions';
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Get in touch with UltriumAI for custom AI agent development. Schedule your free discovery call and transform your business with secure AI solutions.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Get in touch with UltriumAI for custom AI agent development. Schedule your free discovery call and transform your business with secure AI solutions.';
      document.head.appendChild(meta);
    }

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) {
      ogType.setAttribute('content', 'website');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:type');
      meta.content = 'website';
      document.head.appendChild(meta);
    }

    // Structured data for LocalBusiness
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "UltriumAI",
      "description": "Custom AI Agents and GPT Solutions with Security-First Approach",
      "url": "https://ultriumai.com",
      "telephone": "+1-804-821-1410",
      "email": "info@ultriumai.com",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "Virginia",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "addressRegion": "Virginia"
      },
      "openingHours": "Mo-Fr 09:00-18:00",
      "areaServed": "United States",
      "serviceType": [
        "Custom AI Agent Development",
        "GPT Solutions",
        "Cybersecurity AI",
        "MSP AI Solutions",
        "MSSP AI Solutions"
      ],
      "priceRange": "$$",
      "founder": {
        "@type": "Person",
        "name": "UltriumAI Team"
      }
    };

    // Add structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.textContent = JSON.stringify(structuredData);
    } else {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Contact page specific structured data
    const contactPageData = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact UltriumAI",
      "description": "Get in touch with UltriumAI for custom AI agent development and GPT solutions",
      "url": "https://ultriumai.com/contact",
      "mainEntity": {
        "@type": "LocalBusiness",
        "name": "UltriumAI",
        "telephone": "+1-804-821-1410",
        "email": "info@ultriumai.com"
      }
    };

    const contactScript = document.createElement('script');
    contactScript.type = 'application/ld+json';
    contactScript.textContent = JSON.stringify(contactPageData);
    document.head.appendChild(contactScript);

    // Cleanup function to remove added elements when component unmounts
    return () => {
      // Clean up meta tags and scripts if needed
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <ContactSection />
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
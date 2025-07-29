import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation, getAnimationClasses, useStaggeredScrollAnimation } from "@/hooks/useScrollAnimation";

const Integrations = () => {
  const integrations = [
    {
      name: "Tegrity Connect",
      description: "Our primary CRM integration - built specifically for MSPs with advanced client management features",
      category: "Primary CRM",
      status: "Available",
      featured: true
    },
    {
      name: "Microsoft Teams",
      description: "Deploy as a Teams app with native chat integration",
      category: "Chat Platform",
      status: "Available"
    },
    {
      name: "Slack",
      description: "Add as a Slack bot for instant knowledge access",
      category: "Chat Platform", 
      status: "Available"
    },
    {
      name: "Widget SDK",
      description: "Embed in any website or internal portal",
      category: "Web Integration",
      status: "Available"
    },
    {
      name: "SharePoint",
      description: "Sync documents and knowledge bases automatically",
      category: "Document Management",
      status: "Available"
    },
    {
      name: "Confluence", 
      description: "Import and sync wiki pages and documentation",
      category: "Document Management",
      status: "Available"
    },
    {
      name: "Notion",
      description: "Connect knowledge bases and team wikis",
      category: "Document Management",
      status: "Coming Soon"
    },
    {
      name: "ServiceNow",
      description: "Integrate with ITSM workflows and tickets",
      category: "ITSM",
      status: "Available"
    },
    {
      name: "Zendesk",
      description: "Reduce support ticket volume with AI responses",
      category: "Support",
      status: "Available"
    },
    {
      name: "Salesforce",
      description: "Enable sales teams with instant product knowledge",
      category: "CRM",
      status: "Coming Soon"
    },
    {
      name: "REST API",
      description: "Build custom integrations with our API",
      category: "Developer",
      status: "Available"
    },
    {
      name: "Webhooks",
      description: "Real-time notifications and workflow triggers",
      category: "Developer",
      status: "Available"
    },
    {
      name: "SSO/SAML",
      description: "Enterprise authentication and user management",
      category: "Security",
      status: "Available"
    }
  ];

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardsRef, visibleItems: cardsVisible } = useStaggeredScrollAnimation(12, 80);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation({ delay: 600 });

  return (
    <section id="integrations" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className={getAnimationClasses(headerVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Integrate with Your Existing Tools
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              UltriumGPT works seamlessly with the tools your team already uses. 
              Deploy anywhere from chat platforms to custom applications.
            </p>
          </div>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {integrations.map((integration, index) => (
            <Card 
              key={index} 
              className={`relative p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105 group ${getAnimationClasses(cardsVisible[index], 'fadeUp')} ${integration.featured ? 'ring-2 ring-primary bg-gradient-to-br from-primary/5 to-secondary/5' : ''}`}
            >
              {integration.featured && (
                <Badge className="absolute -top-2 -right-2 bg-primary">
                  Primary CRM
                </Badge>
              )}
              <div className="flex items-start justify-between mb-4">
                <h3 className={`text-lg font-semibold group-hover:text-primary transition-colors duration-200 ${integration.featured ? 'text-primary' : 'text-foreground'}`}>
                  {integration.name}
                </h3>
                <Badge 
                  variant={integration.status === "Available" ? "default" : "secondary"}
                  className="text-xs group-hover:scale-110 transition-transform duration-200"
                >
                  {integration.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 group-hover:text-foreground/80 transition-colors duration-200">
                {integration.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs group-hover:border-primary/50 transition-colors duration-200">
                  {integration.category}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <div ref={ctaRef} className={getAnimationClasses(ctaVisible, 'fadeUp')}>
          <div className="mt-16 text-center">
              <div className="bg-card border rounded-lg p-8 max-w-2xl mx-auto hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105 hover:border-primary/20">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Need a Custom Integration?
                </h3>
              <p className="text-muted-foreground mb-6">
                Our team can help you build custom integrations for your specific workflow needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200 hover:scale-105">
                  Contact Sales
                </button>
                <button className="px-6 py-2 border border-border rounded-md hover:bg-accent transition-all duration-200 hover:scale-105">
                  View API Docs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
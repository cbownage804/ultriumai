import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Integrations = () => {
  const integrations = [
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

  const categories = ["All", "Chat Platform", "Document Management", "ITSM", "Support", "CRM", "Developer", "Security"];

  return (
    <section id="integrations" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Integrate with Your Existing Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            UltriumGPT works seamlessly with the tools your team already uses. 
            Deploy anywhere from chat platforms to custom applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {integrations.map((integration, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {integration.name}
                </h3>
                <Badge 
                  variant={integration.status === "Available" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {integration.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {integration.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {integration.category}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-card border rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Need a Custom Integration?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our team can help you build custom integrations for your specific workflow needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Contact Sales
              </button>
              <button className="px-6 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                View API Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
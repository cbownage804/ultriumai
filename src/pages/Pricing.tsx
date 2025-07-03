import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Users, 
  Building2, 
  Factory,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Globe,
  Phone
} from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Small Business",
      description: "Perfect for growing teams and startups",
      price: "$49",
      period: "/month",
      icon: Users,
      popular: false,
      features: [
        "Up to 5 team members",
        "1 knowledge base",
        "5,000 AI queries/month",
        "Basic integrations (Slack, Teams)",
        "Email support",
        "Standard security",
        "Basic analytics",
        "Web widget embedding"
      ],
      targetAudience: "Startups, small teams, consultants",
      painPoints: "Reduce repetitive questions, improve customer support efficiency"
    },
    {
      name: "Medium Business",
      description: "Ideal for growing companies with multiple departments",
      price: "$149",
      period: "/month",
      icon: Building2,
      popular: true,
      features: [
        "Up to 50 team members",
        "5 knowledge bases",
        "25,000 AI queries/month",
        "Advanced integrations (Zendesk, ServiceNow)",
        "Priority support",
        "Advanced security & SSO",
        "Detailed analytics & reporting",
        "Custom branding",
        "API access",
        "Multi-department setup"
      ],
      targetAudience: "Mid-size companies, SaaS businesses, professional services",
      painPoints: "Scale support operations, reduce training time, improve consistency"
    },
    {
      name: "Enterprise",
      description: "For large organizations with complex needs",
      price: "Custom",
      period: "pricing",
      icon: Factory,
      popular: false,
      features: [
        "Unlimited team members",
        "Unlimited knowledge bases",
        "Unlimited AI queries",
        "All integrations included",
        "24/7 dedicated support",
        "Enterprise security & compliance",
        "Advanced analytics & BI",
        "Full white-label solution",
        "Custom API development",
        "Dedicated success manager",
        "On-premise deployment option",
        "Custom training & onboarding"
      ],
      targetAudience: "Large enterprises, government, healthcare, financial services",
      painPoints: "Enterprise compliance, global deployment, advanced security requirements"
    }
  ];

  const addOnServices = [
    {
      name: "MSP/MSSP Package",
      description: "Multi-tenant architecture for managed service providers",
      features: [
        "Unlimited client tenants",
        "White-label client portals",
        "RMM/PSA integrations",
        "Client-specific branding",
        "Tenant isolation & security"
      ],
      price: "Starting at $299/month"
    },
    {
      name: "Professional Services",
      description: "Get expert help with setup and optimization",
      features: [
        "Custom knowledge base setup",
        "Integration configuration",
        "Team training sessions",
        "Content optimization",
        "Ongoing consultation"
      ],
      price: "Starting at $2,500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business size and needs. From startups to enterprises, 
            UltriumGPT scales with your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="lg">
              Start Free 14-Day Trial
            </Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative p-8 ${plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <plan.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold mb-3">Perfect for:</h4>
                  <p className="text-sm text-muted-foreground mb-4">{plan.targetAudience}</p>
                  <p className="text-sm text-primary font-medium">{plan.painPoints}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-on Services */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Services & Packages</h2>
            <p className="text-xl text-muted-foreground">
              Specialized solutions and professional services to maximize your success
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {addOnServices.map((service, index) => (
              <Card key={index} className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {service.price}
                  </Badge>
                </div>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-4 h-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Size Comparison */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Businesses Choose UltriumGPT</h2>
            <p className="text-xl text-muted-foreground">
              Different challenges, one powerful solution
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Small Businesses</h3>
              <ul className="text-left space-y-2 text-sm text-muted-foreground">
                <li>• Reduce repetitive customer questions</li>
                <li>• Enable 24/7 support without hiring</li>
                <li>• Onboard new team members faster</li>
                <li>• Maintain consistent messaging</li>
                <li>• Scale support as you grow</li>
              </ul>
            </Card>

            <Card className="p-6 text-center">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Medium Businesses</h3>
              <ul className="text-left space-y-2 text-sm text-muted-foreground">
                <li>• Standardize knowledge across departments</li>
                <li>• Reduce training time for new hires</li>
                <li>• Improve support team efficiency</li>
                <li>• Enable self-service for employees</li>
                <li>• Scale operations without headcount</li>
              </ul>
            </Card>

            <Card className="p-6 text-center">
              <Factory className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Large Enterprises</h3>
              <ul className="text-left space-y-2 text-sm text-muted-foreground">
                <li>• Global knowledge standardization</li>
                <li>• Compliance and security requirements</li>
                <li>• Multi-department coordination</li>
                <li>• Advanced analytics and insights</li>
                <li>• Custom integrations and workflows</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What happens if I exceed my query limit?</h3>
              <p className="text-muted-foreground">We'll notify you when you approach your limit. You can either upgrade your plan or purchase additional queries for $0.10 each.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do you offer custom integrations?</h3>
              <p className="text-muted-foreground">Yes, Enterprise customers can request custom integrations. Our team will work with you to build connections to your specific tools and workflows.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
              <p className="text-muted-foreground">No setup fees for Small and Medium Business plans. Enterprise customers receive dedicated onboarding included in their custom pricing.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses already reducing support costs with UltriumGPT
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Start Your Free Trial
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
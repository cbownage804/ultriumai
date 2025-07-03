import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Phone, Calendar, Users, Building } from "lucide-react";

const ContactSection = () => {
  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Ready to Transform Your MSP Operations?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join leading MSPs and MSSPs who are reducing support overhead while improving client satisfaction. 
            Contact UltriumAI for a personalized demo and implementation walkthrough.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Custom Deployment on UltriumAI.com</h3>
                  <p className="text-muted-foreground">Get your own branded subdomain (yourcompany.ultraiumai.com) with full white-label customization.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Dedicated Setup & Training</h3>
                  <p className="text-muted-foreground">Personal onboarding with UltriumAI specialists to configure your knowledge bases and integrations.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">MSP-Specific Features</h3>
                  <p className="text-muted-foreground">Multi-tenant architecture, RMM/PSA integrations, and client-specific knowledge isolation.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ongoing Support & Updates</h3>
                  <p className="text-muted-foreground">Continuous platform improvements, new integrations, and dedicated customer success management.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-8 text-center bg-card border-2 border-primary/20">
              <div className="mb-6">
                <Building className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Enterprise MSP Solution</h3>
                <p className="text-muted-foreground">Custom pricing based on client count and usage</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm">Unlimited client tenants</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm">White-label branding</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-sm">Priority support & training</span>
                </div>
              </div>
              
              <Button variant="hero" size="lg" className="w-full text-lg">
                Contact UltriumAI Sales
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>
            
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Questions about implementation or pricing?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline">
                  Schedule Demo Call
                </Button>
                <Button variant="ghost">
                  sales@ultraiumai.com
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-muted/50 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Deployment Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                <h4 className="font-semibold mb-2">Initial Consultation</h4>
                <p className="text-sm text-muted-foreground">Assess your MSP needs and requirements</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                <h4 className="font-semibold mb-2">Custom Setup</h4>
                <p className="text-sm text-muted-foreground">Configure subdomain and branding</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                <h4 className="font-semibold mb-2">Knowledge Import</h4>
                <p className="text-sm text-muted-foreground">Upload and organize documentation</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
                <h4 className="font-semibold mb-2">Go Live</h4>
                <p className="text-sm text-muted-foreground">Deploy to clients with full support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
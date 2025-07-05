import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Zap, 
  Award,
  ArrowRight,
  CheckCircle,
  Building,
  Phone,
  Mail
} from "lucide-react";
import { useScrollAnimation, getAnimationClasses, useStaggeredScrollAnimation } from "@/hooks/useScrollAnimation";

const AboutSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ delay: 200 });
  const { ref: processRef, isVisible: processVisible } = useScrollAnimation({ delay: 400 });
  const { ref: processCardsRef, visibleItems: processCardsVisible } = useStaggeredScrollAnimation(3, 200);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation({ delay: 600 });

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div ref={headerRef} className={getAnimationClasses(headerVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Building className="h-4 w-4 mr-2" />
              Who is Ultrium AI?
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Born from IT. Built for AI. Focused on Security.
            </h2>
          </div>
        </div>

        <div ref={contentRef} className={getAnimationClasses(contentVisible, 'fadeUp')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Our Story</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                UltriumAI is the AI innovation arm of Ultrium, a security-first IT provider. We specialize in creating custom GPT agents that work the way your business works—from IT support and cybersecurity tools to client-facing bots and automated workflows.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We're not here to sell hype. We're here to build smart, secure tools that solve real problems—so your team can move faster, serve better, and stay safer.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">AI That Fits Your Business</h4>
                    <p className="text-muted-foreground">We don't believe in one-size-fits-all bots. Every GPT we build is trained on your actual documents, policies, and workflows—so it sounds like you, thinks like you, and works like a real team member.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Real Results, Not Just Tech Demos</h4>
                    <p className="text-muted-foreground">We focus on practical wins: fewer tickets, faster onboarding, smarter automation. Whether you're streamlining internal support or enhancing cybersecurity, our tools deliver measurable value from day one.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Veteran-Owned Excellence</h3>
                  <p className="text-muted-foreground">
                    <strong>UltriumAI is proudly developed by Ultrium</strong>, a veteran-owned IT solutions company based in Virginia. While UltriumAI focuses on AI-powered cybersecurity, automation, and business intelligence tools, Ultrium delivers full-service IT support, managed services, cloud infrastructure, and compliance solutions to businesses of all sizes.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Building className="mr-2 h-4 w-4" />
                    Learn more at Ultrium.com
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Process Section */}
        <div ref={processRef} className={getAnimationClasses(processVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-6">How UltriumAI Builds Smarter, Safer AI Tools</h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              From discovery to deployment, our process makes AI simple to understand, easy to use, and secure from the ground up.
            </p>
          </div>
        </div>

        <div ref={processCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              step: "01",
              title: "Discovery & Analysis",
              description: "We dive deep into your workflows, security requirements, and business goals to design the perfect AI solution.",
              icon: Users
            },
            {
              step: "02", 
              title: "Custom Development",
              description: "Our team builds and trains your GPT using your actual data, policies, and procedures—with security baked in from day one.",
              icon: Shield
            },
            {
              step: "03",
              title: "Deploy & Support",
              description: "We handle the technical deployment and provide ongoing support to ensure your AI tools evolve with your business.",
              icon: Zap
            }
          ].map((process, index) => {
            const Icon = process.icon;
            return (
              <Card 
                key={index} 
                className={`text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105 card-glow group ${getAnimationClasses(processCardsVisible[index], 'fadeUp')}`}
              >
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center relative group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-8 w-8 text-primary group-hover:animate-glow" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                      {process.step}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-all duration-300">{process.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {process.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Info */}
        <div ref={ctaRef} className={getAnimationClasses(ctaVisible, 'fadeUp')}>
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Let's discuss how custom AI agents can transform your business operations while keeping security at the forefront.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="text-lg px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  Call 804-821-1410
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  <Mail className="mr-2 h-5 w-5" />
                  Schedule Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
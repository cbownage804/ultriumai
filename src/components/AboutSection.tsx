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
  Mail,
  Bot
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
              <h3 className="text-2xl font-bold">From MSP Frustration to AI Innovation</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                UltriumAI was born from our experience as an MSP (Managed Service Provider) dealing with the chaos of managing dozens of security tools, RMM platforms, and vendor solutions. We were tired of juggling multiple dashboards, inconsistent APIs, and security gaps between systems.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                So we built what we wished existed: <strong>SafeSuite</strong> - our comprehensive cybersecurity platform with integrated <strong>UltriumAI Studio</strong> for creating custom AI chatbots and GPTs. One unified ecosystem that eliminates vendor sprawl while strengthening your security posture.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">SafeSuite - Comprehensive Cybersecurity Platform</h4>
                    <p className="text-muted-foreground">Our flagship cybersecurity platform combines threat monitoring, RMM tools, compliance management, and security automation in one unified dashboard. Built by MSPs, for businesses who want enterprise-level security without the complexity.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">UltriumAI Studio - Build Custom AI Solutions</h4>
                    <p className="text-muted-foreground">Integrated within SafeSuite, our AI Studio lets you create custom chatbots and GPTs trained on your specific environment, policies, and procedures. From automated helpdesk support to intelligent threat response, build AI that actually understands your business.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <img 
                      src="/lovable-uploads/4c07c97c-1f89-4a11-b3f2-ed9f86118834.png" 
                      alt="Ultrium Logo" 
                      className="h-24 w-24 dark:hidden"
                    />
                    <img 
                      src="/lovable-uploads/377dbc83-5d32-4888-92b3-19996bb3890d.png" 
                      alt="Ultrium Logo" 
                      className="h-24 w-24 hidden dark:block"
                    />
                  </div>
                  <h3 className="text-xl font-bold">Built by the MSP That Wanted Better Tools</h3>
                  <p className="text-muted-foreground">
                    <strong>UltriumAI is proudly developed by Ultrium</strong>, a veteran-owned MSP based in Virginia. After years of managing fragmented security tools for our clients, we created SafeSuite - the unified cybersecurity platform we always needed, complete with AI Studio for custom chatbot and GPT development.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Building className="mr-2 h-4 w-4" />
                    Learn more at UltriumLLC.com
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* UltriumGPT Section */}
        <div className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Bot className="h-4 w-4 mr-2" />
              Introducing UltriumGPT
            </Badge>
            <h3 className="text-4xl font-bold mb-6 text-foreground">
              The Security-First LLM That Understands Your Business
            </h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              UltriumGPT isn't just another chatbot. It's a revolutionary Large Language Model specifically trained for cybersecurity, IT operations, and business intelligence—seamlessly integrated with SafeSuite and customizable through AI Studio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <h4 className="text-2xl font-bold">Advanced LLM Capabilities</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold">Security-Native Intelligence</h5>
                    <p className="text-muted-foreground">Trained on cybersecurity frameworks, threat intelligence, and compliance standards. UltriumGPT speaks security fluently.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold">Real-Time Data Integration</h5>
                    <p className="text-muted-foreground">Connects directly to SafeSuite's live security data, providing contextual responses based on your actual environment.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold">Multi-Modal Interactions</h5>
                    <p className="text-muted-foreground">Text, voice, and visual analysis capabilities for comprehensive threat assessment and incident response.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold">Custom Knowledge Training</h5>
                    <p className="text-muted-foreground">Through AI Studio, train UltriumGPT on your specific policies, procedures, and organizational knowledge.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold mb-4 text-center">Revolutionary Integration</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="font-medium">SafeSuite</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Live security data</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                    <span className="font-medium">AI Studio</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Custom training</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="w-3 h-3 bg-accent rounded-full"></div>
                    <span className="font-medium">UltriumGPT</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Intelligent responses</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary/5 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">The first LLM that:</p>
                  <p className="font-semibold">Understands your security posture in real-time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Intelligent Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automate incident response, compliance reporting, and security assessments with AI that understands context.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Security-First Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Built with enterprise security standards, ensuring your conversations and data remain protected and compliant.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Continuous Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Evolves with your organization, learning from your environment to provide increasingly accurate insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Process Section */}
        <div ref={processRef} className={getAnimationClasses(processVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-6">How We Eliminate Vendor Sprawl with AI-Powered Solutions</h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              Our unified platform approach means you get comprehensive cybersecurity, IT management, and AI automation without juggling multiple vendors or worrying about integration gaps.
            </p>
          </div>
        </div>

        <div ref={processCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              step: "01",
              title: "Assess Your Current Stack",
              description: "We analyze your existing security tools, RMM platforms, and vendor relationships to identify gaps, redundancies, and integration challenges.",
              icon: Users
            },
            {
              step: "02", 
              title: "Deploy SafeSuite Platform",
              description: "We migrate your critical security functions to SafeSuite, configure AI Studio for your custom chatbots and GPTs, and eliminate vendor sprawl while strengthening your security posture.",
              icon: Shield
            },
            {
              step: "03",
              title: "Optimize & Scale",
              description: "We continuously enhance your unified platform with new AI capabilities, threat intelligence updates, and automated workflows as your business grows.",
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
              <h3 className="text-2xl font-bold mb-6">Ready to Experience SafeSuite?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                See how SafeSuite's comprehensive cybersecurity platform and integrated AI Studio can replace multiple vendors while empowering you to build custom AI solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="text-lg px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  Call 888-884-1410
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
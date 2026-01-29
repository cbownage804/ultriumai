import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, Brain, ArrowRight, CheckCircle, Zap, Star, Users, Wrench, 
  Play, Lock, Network, Bot, Headphones, FileText, Award, Building
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { FAQSection } from '@/components/FAQSection';
import { FAQSchema, OrganizationSchema, ServiceSchema } from '@/components/SEOSchemas';
import { safeWindowOpen } from '@/utils/security';
import heroMain from '@/assets/hero-main.jpg';
import ultriumGPTLogo from '@/assets/ultrium-gpt-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';
import { useAuth } from '@/hooks/useAuth';
import { SocialProof } from '@/components/marketing/SocialProof';
import { Testimonials } from '@/components/marketing/Testimonials';
import { RequestDemoForm } from '@/components/marketing/RequestDemoForm';
import { LeadCaptureCard } from '@/components/marketing/LeadCaptureCard';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to the Product Hub
  useEffect(() => {
    // Check if we're in a sign-out flow (indicated by sessionStorage flag)
    const signingOut = sessionStorage.getItem('signing-out');
    if (signingOut) {
      sessionStorage.removeItem('signing-out');
      return; // Don't redirect during sign-out
    }
    
    if (!loading && user) {
      navigate('/hub', { replace: true });
    }
  }, [user, loading, navigate]);
  const mainFAQs = [
    {
      question: "What is UltriumAI and what do you build?",
      answer: "UltriumAI is an AI development agency that builds custom AI solutions for businesses. We offer two flagship products: AI Studio™ for building custom GPTs, and Vanguard™ for complete security operations. We also provide full-service custom AI development for enterprises."
    },
    {
      question: "What's the difference between AI Studio and custom development?",
      answer: "AI Studio is our self-service platform where you can build custom GPTs in minutes with no code required. Custom development is our full-service option where our team builds, trains, and deploys sophisticated AI solutions tailored to your specific workflows and data."
    },
    {
      question: "How secure are your AI solutions?",
      answer: "Security is foundational to everything we build. All solutions include enterprise-grade encryption, data isolation, and compliance with major frameworks. Our Vanguard platform specifically provides AI-powered security operations with threat detection and autonomous response."
    },
    {
      question: "Can I white-label your AI solutions?",
      answer: "Yes! Both AI Studio GPTs and custom-built solutions can be white-labeled with your branding. This is popular with agencies, MSPs, and enterprises who want to offer AI-powered services to their clients."
    },
    {
      question: "How quickly can I get started?",
      answer: "With AI Studio, you can build and deploy your first custom GPT in under an hour. For custom development projects, our team typically delivers initial solutions within 2-4 weeks depending on complexity."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We provide comprehensive support including 24/7 technical assistance, onboarding training, and ongoing optimization. Enterprise customers receive dedicated account management and custom training programs."
    }
  ];

  const services = [
    { name: "Custom GPT Development", description: "Build intelligent AI assistants tailored to your business", url: "https://ultriumai.com/ai-studio" },
    { name: "AI Security Operations", description: "Complete security platform with AI copilot", url: "https://vanguard.ultriumai.com" },
    { name: "Enterprise AI Solutions", description: "Full-service custom AI development", url: "https://ultriumai.com/contact" }
  ];


  return (
    <div className="min-h-screen bg-background">
      <OrganizationSchema />
      <ServiceSchema services={services} />
      <FAQSchema faqs={mainFAQs} />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroMain} 
            alt="Cybersecurity command center"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 animate-fade-in">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Development Agency</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight animate-slide-up px-2">
              We Build Custom AI Solutions for Business
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in px-2">
              From intelligent GPTs to enterprise security platforms—UltriumAI creates AI tools that work the way your business works. Built for Business. Secure by Design.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-fade-in flex-wrap px-2">
              <Link to="/products/ai-studio" className="w-full sm:w-auto">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-10 py-6 sm:py-10 h-auto bg-black border-2 border-primary/50 hover:bg-black/80 hover:border-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col items-center gap-3 sm:gap-4 w-full">
                  <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-xl sm:rounded-2xl bg-black p-1 sm:p-2 flex items-center justify-center overflow-hidden">
                    <img src={ultriumGPTLogo} alt="AI Studio" className="h-full w-full object-contain scale-125" />
                  </div>
                  <span className="text-lg sm:text-xl font-semibold">Explore AI Studio</span>
                </Button>
              </Link>
              <Link to="/products/vanguard" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-10 py-6 sm:py-10 h-auto bg-black border-2 border-muted-foreground/30 hover:bg-black/80 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 flex flex-col items-center gap-3 sm:gap-4 w-full"
                >
                  <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-xl sm:rounded-2xl bg-black p-1 sm:p-2 flex items-center justify-center overflow-hidden">
                    <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-lg sm:text-xl font-semibold">Explore Vanguard</span>
                </Button>
              </Link>
              <Link to="/products/safesuite" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-10 py-6 sm:py-10 h-auto bg-black border-2 border-emerald-500/50 hover:bg-black/80 hover:border-emerald-500 transition-all duration-300 hover:scale-105 flex flex-col items-center gap-3 sm:gap-4 w-full"
                >
                  <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-xl sm:rounded-2xl bg-black p-1 sm:p-2 flex items-center justify-center overflow-hidden">
                    <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain scale-125" />
                  </div>
                  <span className="text-lg sm:text-xl font-semibold">Try SafeSuite</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <SocialProof variant="full" className="bg-muted/30" />

      {/* Flagship Products Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Flagship Products</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three powerful platforms designed for different needs—all built with security at the core
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* AI Studio Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden mb-4 bg-black p-4">
                  <img src={ultriumGPTLogo} alt="AI Studio" className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-2xl">AI Studio™</CardTitle>
                <CardDescription className="text-base">Custom GPT Builder Platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Build intelligent AI assistants in minutes. Upload your knowledge, train your GPT, deploy anywhere.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">No-code GPT builder</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Knowledge training & RAG</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">White-label ready</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Full API access</span>
                  </div>
                </div>
                <Link to="/ai-studio">
                  <Button className="w-full" size="lg">
                    Start Building <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Vanguard Card - Featured */}
            <Card className="border-2 border-cyan-500/30 bg-gradient-to-br from-[#0a0a0f] to-purple-900/20 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                v4.0 Enterprise Plus
              </div>
              <CardHeader className="pb-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden mb-4 bg-black p-4">
                  <img src={vanguardLogo} alt="Vanguard" className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Vanguard™</CardTitle>
                <CardDescription className="text-base">All-in-One Security AI Platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Complete security operations with AI copilot. Now with honeypots, traffic analysis, continuous monitoring & agent mesh.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-sm">XDR/EDR & Threat Detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-sm">Honeypots & Deception Technology</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-sm">Traffic Analysis & DNS Tunneling</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-sm">AI Security Copilot & Playbooks</span>
                  </div>
                </div>
                <Link to="/products/vanguard" className="w-full">
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0" 
                    size="lg"
                  >
                    Explore Vanguard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* SafeSuite Card */}
            <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-900/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                Consumer & SMB
              </div>
              <CardHeader className="pb-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden mb-4 bg-black p-4">
                  <img src={safesuiteLogo} alt="SafeSuite" className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">SafeSuite™</CardTitle>
                <CardDescription className="text-base">Complete Personal Security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  All-in-one security for individuals and small teams. Password manager, threat scanning, dark web monitoring & more.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">SafePass Password Manager</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">SafeScan Threat Detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">SafeWeb Dark Web Monitoring</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">SafeTrack Asset Management</span>
                  </div>
                </div>
                <Link to="/products/safesuite" className="w-full">
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0" 
                    size="lg"
                  >
                    Try SafeSuite <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Work With You</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the path that fits your needs—self-service or full-service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Build It Yourself */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Build It Yourself</CardTitle>
                <CardDescription>Self-service AI platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Access to AI Studio platform</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> DIY GPT creation tools</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Templates and guides</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Monthly subscription pricing</li>
                </ul>
                <Link to="/pricing">
                  <Button variant="outline" className="w-full">View Pricing</Button>
                </Link>
              </CardContent>
            </Card>

            {/* We Build It For You */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">We Build It For You</CardTitle>
                <CardDescription>Full-service AI development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Custom GPT training on your data</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> White-label solutions</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Enterprise integrations</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Dedicated support</li>
                </ul>
                <Link to="/contact">
                  <Button className="w-full">Schedule Consultation</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Trust Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                      <Award className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <div className="text-center md:text-left space-y-4">
                    <h3 className="text-2xl font-bold">Veteran-Owned. Security-First.</h3>
                    <p className="text-muted-foreground">
                      UltriumAI is proudly developed by Ultrium LLC, a veteran-owned IT solutions company with 15+ years of experience. Every AI solution we build is designed with enterprise-grade security from the ground up.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-primary" />
                        <span>15+ Years IT Experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Security-First Design</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-primary" />
                        <span>Veteran-Owned</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Your AI Solution?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start building on AI Studio today or schedule a consultation for custom development
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/ai-studio">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                <Brain className="mr-2 h-5 w-5" />
                Start Free on AI Studio
              </Button>
            </Link>
            <RequestDemoForm triggerLabel="Schedule Consultation" />
          </div>
          
          {/* Newsletter Signup */}
          <div className="max-w-md mx-auto mt-12">
            <LeadCaptureCard 
              title="Get Security & AI Insights"
              description="Weekly tips on AI automation, security best practices, and product updates."
              buttonText="Subscribe"
              variant="featured"
              source="homepage_newsletter"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials 
        maxItems={6}
        title="What Our Customers Say"
        subtitle="Join hundreds of businesses trusting UltriumAI for their security and AI needs"
      />

      {/* FAQ Section */}
      <FAQSection faqs={mainFAQs} />
      
      <Footer />
    </div>
  );
};

export default Index;

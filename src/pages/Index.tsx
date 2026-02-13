import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, Brain, ArrowRight, CheckCircle, Zap, Star, Users, Wrench, 
  Play, Lock, Network, Bot, Headphones, FileText, Award, Building
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { AIStudioShowcase } from '@/components/marketing/AIStudioShowcase';
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
      question: "What is UltriumAI and what products do you offer?",
      answer: "UltriumAI is a veteran-owned technology platform offering three products: SafeSuite for personal and small-business security (password management, dark web monitoring, threat scanning), Vanguard for MSPs and IT teams (RMM, helpdesk, XDR, compliance, and IT documentation), and AI Studio for building custom AI assistants and GPTs with no code required."
    },
    {
      question: "Which product is right for me?",
      answer: "If you're an individual or small team looking to protect passwords and monitor for breaches, start with SafeSuite — it's free. If you're an MSP or IT department managing endpoints, tickets, and security operations, Vanguard replaces your entire tool stack. If you want to build AI chatbots or assistants for your business, AI Studio lets you do it in minutes."
    },
    {
      question: "How secure are your products?",
      answer: "Security is foundational to everything we build. SafeSuite uses zero-knowledge encryption so we can never see your data. Vanguard provides enterprise-grade XDR, compliance automation, and full audit trails. AI Studio includes data isolation and API security. All products are built with security-first architecture."
    },
    {
      question: "Can I use multiple products together?",
      answer: "Yes! All three products share a single account and billing hub. Sign up once and access any product from the Product Hub. Many MSPs use Vanguard for client operations, SafeSuite for their own team's credentials, and AI Studio for building client-facing AI assistants."
    },
    {
      question: "How quickly can I get started?",
      answer: "SafeSuite is free and takes under a minute to set up. AI Studio lets you build and deploy a custom GPT in under an hour. Vanguard offers a guided onboarding that gets your first endpoints monitored within 15 minutes."
    },
    {
      question: "What kind of support do you provide?",
      answer: "All products include built-in AI assistance and documentation. Paid plans include priority support. Vanguard Enterprise customers get dedicated account management, custom training, and SLA-backed support."
    }
  ];

  const services = [
    { name: "Custom GPT Development", description: "Build intelligent AI assistants tailored to your business", url: "https://ultriumai.com/ai-studio" },
    { name: "AI Security Operations", description: "Complete security platform with AI copilot", url: "https://ultriumai.com/products/vanguard" },
    { name: "Enterprise AI Solutions", description: "Full-service custom AI development", url: "https://ultriumai.com/contact" }
  ];


  return (
    <div className="min-h-screen bg-background safe-area-inset-bottom">
      <OrganizationSchema />
      <ServiceSchema services={services} />
      <FAQSchema faqs={mainFAQs} />
      
      <Navigation />
      
      {/* Hero Section - Enhanced with Premium Effects */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
        {/* Background Image with Enhanced Overlays */}
        <div className="absolute inset-0">
          <img 
            src={heroMain} 
            alt="Cybersecurity command center"
            className="w-full h-full object-cover animate-[scale-in_1.5s_ease-out]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/75 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6 sm:space-y-8">
            {/* Badge with shimmer effect */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary/15 to-primary/5 rounded-full border border-primary/30 shadow-lg shadow-primary/10 backdrop-blur-sm animate-[fade-in_0.5s_ease-out]">
              <Brain className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary tracking-wide">AI Development Agency</span>
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            </div>
            
            {/* Hero Title with Enhanced Gradient */}
            <h1 className="text-fluid-hero font-bold bg-gradient-to-r from-foreground via-primary via-50% to-foreground bg-clip-text text-transparent leading-tight animate-[fade-in_0.7s_ease-out] px-2 drop-shadow-sm">
              We Build Custom AI Solutions for Business
            </h1>
            
            {/* Subtitle with better styling */}
            <p className="text-fluid-lg text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed animate-[fade-in_0.9s_ease-out] px-4">
              Protect your digital life with <span className="text-emerald-400 font-medium">SafeSuite</span>. 
              Run IT operations with <span className="text-cyan-400 font-medium">Vanguard</span>. 
              Build custom AI with <span className="text-primary font-medium">AI Studio</span>.
              <span className="text-foreground font-medium"> One platform, three powerful products.</span>
            </p>

            {/* Product Cards with Enhanced Effects */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-[fade-in_1.1s_ease-out] px-4">
              <Link to="/products/ai-studio" className="w-full sm:w-auto group">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-10 h-auto bg-gradient-to-br from-black via-gray-900 to-black border-2 border-primary/40 hover:border-primary shadow-xl hover:shadow-primary/30 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center gap-3 sm:gap-4 w-full touch-target relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-14 w-14 sm:h-28 sm:w-28 rounded-xl sm:rounded-2xl bg-black p-1 sm:p-2 flex items-center justify-center overflow-hidden relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <img src={ultriumGPTLogo} alt="AI Studio" className="h-full w-full object-contain scale-125" />
                  </div>
                  <span className="text-base sm:text-xl font-semibold relative z-10">Explore AI Studio</span>
                </Button>
              </Link>
              <Link to="/products/vanguard" className="w-full sm:w-auto group">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-10 h-auto bg-gradient-to-br from-black via-gray-900 to-black border-2 border-cyan-500/30 hover:border-cyan-500 shadow-xl hover:shadow-cyan-500/30 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center gap-3 sm:gap-4 w-full touch-target relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-14 w-14 sm:h-28 sm:w-28 rounded-xl sm:rounded-2xl bg-black p-1 sm:p-2 flex items-center justify-center overflow-hidden relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-base sm:text-xl font-semibold relative z-10">Explore Vanguard</span>
                </Button>
              </Link>
              <Link to="/products/safesuite" className="w-full sm:w-auto group">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-10 h-auto bg-gradient-to-br from-black via-gray-900 to-black border-2 border-emerald-500/30 hover:border-emerald-500 shadow-xl hover:shadow-emerald-500/30 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center gap-3 sm:gap-4 w-full touch-target relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-14 w-14 sm:h-28 sm:w-28 rounded-xl sm:rounded-2xl bg-black p-1 sm:p-2 flex items-center justify-center overflow-hidden relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain scale-125" />
                  </div>
                  <span className="text-base sm:text-xl font-semibold relative z-10">Try SafeSuite</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-60">
          <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-foreground/40 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <SocialProof variant="full" className="bg-muted/30" />

      {/* Flagship Products Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Which Product Is Right for You?</h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
              Whether you're protecting personal passwords, managing IT for hundreds of clients, or building AI assistants — there's a product built exactly for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-7xl mx-auto">
            {/* AI Studio Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl hover-lift transition-all duration-300">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden mb-3 sm:mb-4 bg-black p-3 sm:p-4">
                  <img src={ultriumGPTLogo} alt="AI Studio" className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">AI Studio™</CardTitle>
                <CardDescription className="text-sm sm:text-base">Build Custom AI Assistants — No Code Required</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Create intelligent chatbots trained on your data in minutes. Perfect for customer support, lead capture, internal Q&A, and more.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm">No-code GPT builder</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Knowledge training & RAG</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm">White-label ready</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Full API access</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">💡 Want to build AI chatbots for your business or clients? Start here.</p>
                <Link to="/auth?return=ai-studio">
                  <Button className="w-full h-11 sm:h-10 touch-target tap-scale" size="lg">
                    Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Vanguard Card - Featured */}
            <Card className="border-2 border-cyan-500/30 bg-gradient-to-br from-[#0a0a0f] to-purple-900/20 hover:shadow-xl hover:shadow-cyan-500/20 hover-lift transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                v4.0 Enterprise Plus
              </div>
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden mb-3 sm:mb-4 bg-black p-3 sm:p-4">
                  <img src={vanguardLogo} alt="Vanguard" className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Vanguard™</CardTitle>
                <CardDescription className="text-sm sm:text-base">Replace Your Entire MSP Stack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <p className="text-sm sm:text-base text-muted-foreground">
                  RMM, helpdesk, XDR, compliance, documentation, and reporting — in one platform with AI built into every workflow.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">XDR/EDR & Threat Detection</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Honeypots & Deception Technology</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Traffic Analysis & DNS Tunneling</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">AI Security Copilot & Playbooks</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">💡 Need pentesting, RMM, helpdesk, or full IT operations? This is your platform.</p>
                <Link to="/auth?return=vanguard" className="w-full">
                  <Button 
                    className="w-full h-11 sm:h-10 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0 touch-target tap-scale" 
                    size="lg"
                  >
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* SafeSuite Card */}
            <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-900/10 hover:shadow-xl hover:shadow-emerald-500/20 hover-lift transition-all duration-300 relative overflow-hidden md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                Consumer & SMB
              </div>
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden mb-3 sm:mb-4 bg-black p-3 sm:p-4">
                  <img src={safesuiteLogo} alt="SafeSuite" className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">SafeSuite™</CardTitle>
                <CardDescription className="text-sm sm:text-base">Protect Your Digital Life</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Password vault, dark web monitoring, threat scanning, and AI security advisor — for individuals, families, and small teams.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">SafePass Password Manager</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">SafeScan Threat Detection</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">SafeWeb Dark Web Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">SafeTrack Asset Management</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">💡 Individual or small business? Start here — it's free forever.</p>
                <Link to="/auth?return=safesuite" className="w-full">
                  <Button 
                    className="w-full h-11 sm:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0 touch-target tap-scale" 
                    size="lg"
                  >
                    Start Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Studio Showcase */}
      <AIStudioShowcase />

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
                <Link to="/pricing/ai-studio">
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
                <Link to="/pricing/custom-apps">
                  <Button className="w-full">Get a Quote</Button>
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

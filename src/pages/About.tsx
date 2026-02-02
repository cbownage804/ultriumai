import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Shield, Heart, Target, Brain, Lock,
  ArrowRight, CheckCircle, Flag, Code
} from 'lucide-react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import heroSecurity from "@/assets/hero-security.jpg";
import heroCustomAI from "@/assets/hero-custom-ai.jpg";
import aiStudioLogo from '@/assets/ai-studio-logo.png';
import safesuiteLogo from '@/assets/safesuite-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "Every product we build prioritizes the security and privacy of our customers. Zero-knowledge architecture, end-to-end encryption, and transparent practices."
    },
    {
      icon: Brain,
      title: "AI Innovation",
      description: "We leverage cutting-edge artificial intelligence to solve real problems—from custom GPT assistants to automated threat detection."
    },
    {
      icon: Flag,
      title: "Veteran Values",
      description: "Founded by a U.S. military veteran with 15+ years in IT and cybersecurity. Integrity, discipline, and mission-focused execution."
    },
    {
      icon: Heart,
      title: "Customer Success",
      description: "We build tools that actually work for real businesses. No bloatware, no unnecessary complexity—just solutions that deliver value."
    }
  ];

  const products = [
    {
      name: "AI Studio",
      description: "Build custom GPT assistants trained on your data. Deploy via API, widget, or white-label solutions.",
      logo: aiStudioLogo,
      shadowColor: "shadow-primary/30"
    },
    {
      name: "SafeSuite",
      description: "Personal and SMB security toolkit featuring password vault, dark web monitoring, email/link scanning, and asset management.",
      logo: safesuiteLogo,
      shadowColor: "shadow-emerald-500/30"
    },
    {
      name: "Vanguard",
      description: "Enterprise-grade cybersecurity operations platform for MSPs. XDR/EDR, compliance monitoring, SIEM, and managed SOC services.",
      logo: vanguardLogo,
      shadowColor: "shadow-cyan-500/30"
    }
  ];


  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navigation />
      
      {/* Hero Section - Premium immersive design */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 overflow-hidden safe-area-inset-top">
        {/* Background Image with enhanced overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroSecurity} 
            alt="Digital security shield"
            className="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          {/* Scan line effect */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />
        </div>
        
        {/* Animated decorative orbs */}
        <div className="absolute top-1/3 left-1/4 w-60 md:w-80 h-60 md:h-80 bg-primary/15 rounded-full blur-[80px] md:blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-48 md:w-64 h-48 md:h-64 bg-emerald-500/10 rounded-full blur-[60px] md:blur-[80px] pointer-events-none animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 right-1/4 w-32 md:w-48 h-32 md:h-48 bg-cyan-500/10 rounded-full blur-[50px] pointer-events-none animate-[pulse_5s_ease-in-out_infinite]" />
        
        <div className="relative z-10 container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 md:mb-8 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm animate-fade-in bg-primary/10 border-primary/30 hover:bg-primary/20 transition-colors cursor-default group" variant="secondary">
            <Flag className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 md:mr-2 group-hover:animate-pulse" />
            Veteran-Owned Business
          </Badge>
          <h1 className="text-fluid-xl md:text-fluid-hero font-bold mb-6 md:mb-8 leading-tight animate-fade-in-up">
            AI Development & 
            <span className="block bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent bg-[size:200%_auto] animate-[gradient-shift_8s_ease_infinite]">
              Cybersecurity Agency
            </span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
            UltriumAI is a veteran-owned technology company building AI-powered tools and cybersecurity 
            solutions for businesses of all sizes. We combine 15+ years of IT and security expertise 
            with cutting-edge artificial intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-fade-in-up stagger-2">
            <Link to="/hub">
              <Button size="lg" className="w-full sm:w-auto px-6 md:px-8 py-5 md:py-6 text-base md:text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all touch-target group">
                Explore Our Products <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 md:px-8 py-5 md:py-6 text-base md:text-lg border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 transition-all touch-target">
                Get In Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Build - Mobile optimized product cards */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">What We Build</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Flagship products and custom AI solutions for businesses of all sizes
            </p>
          </div>
          
          {/* Product Cards - Responsive grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {products.map((product, index) => (
              <Card key={index} className="h-full hover:border-primary/30 transition-all duration-300 bg-card/50 hover:-translate-y-1 hover:shadow-lg group">
                <CardHeader className="flex flex-col items-center p-4 md:p-6">
                  <div className={`px-3 md:px-4 py-2 md:py-3 bg-black rounded-xl ${product.shadowColor} shadow-lg mb-3 md:mb-4 flex items-center justify-center min-w-[140px] md:min-w-[180px] min-h-[60px] md:min-h-[80px] group-hover:scale-105 transition-transform`}>
                    <img src={product.logo} alt={product.name} className="h-10 md:h-14 w-auto object-contain scale-125 md:scale-150" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <p className="text-sm md:text-base text-muted-foreground text-center">{product.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom AI Apps Card */}
          <Card className="overflow-hidden hover:border-primary/30 transition-colors bg-card/50">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto">
                <img 
                  src={heroCustomAI} 
                  alt="Custom AI Development"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 md:block hidden" />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Custom AI Applications</CardTitle>
                </div>
                <p className="text-muted-foreground mb-6">
                  Need something unique? We build custom AI-powered applications tailored to your specific business needs. 
                  From intelligent automation to specialized chatbots, our team delivers enterprise-grade solutions 
                  with security built in from the ground up.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary">Custom GPT Agents</Badge>
                  <Badge variant="secondary">Workflow Automation</Badge>
                  <Badge variant="secondary">Data Analysis</Badge>
                  <Badge variant="secondary">Integration APIs</Badge>
                </div>
                <Link to="/contact">
                  <Button>
                    Discuss Your Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Mission & Story */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="outline">Our Story</Badge>
              <h2 className="text-3xl font-bold mb-6">Built by Someone Who Gets It</h2>
              <p className="text-lg text-muted-foreground mb-6">
                UltriumAI was founded by a U.S. military veteran with over 15 years of hands-on experience 
                in IT infrastructure and cybersecurity. After seeing too many businesses struggle with 
                overpriced, overcomplicated security tools—or worse, no protection at all—we set out to 
                build something better.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Our approach is simple: take enterprise-grade technology and make it accessible. Whether 
                you're a solo entrepreneur who needs a secure password manager or an MSP managing security 
                for hundreds of clients, we've got you covered.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span>15+ years IT & cybersecurity experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span>U.S. veteran-owned and operated</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span>Based in Virginia, USA</span>
                </div>
              </div>
            </div>
            <div>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  <Target className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
                  <p className="text-muted-foreground mb-6">
                    Make enterprise-grade AI and cybersecurity tools accessible to every business—without 
                    the enterprise price tag or complexity.
                  </p>
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-2">We believe:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Security shouldn't require a PhD to configure</li>
                      <li>• AI should work for you, not the other way around</li>
                      <li>• Small businesses deserve big-business protection</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values - Premium card design */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We Work</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center h-full group hover:border-primary/30 hover:-translate-y-2 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                    <value.icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you need a custom AI assistant, a secure password vault, or enterprise-grade 
            security operations—we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hub">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;

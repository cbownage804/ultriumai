import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Shield, Heart, Target, Brain, Lock,
  ArrowRight, CheckCircle, Flag
} from 'lucide-react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import heroSecurity from "@/assets/hero-security.jpg";

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
      icon: Brain,
      color: "text-primary"
    },
    {
      name: "SafeSuite",
      description: "Personal and SMB security toolkit featuring password vault, dark web monitoring, email/link scanning, and asset management.",
      icon: Lock,
      color: "text-emerald-500"
    },
    {
      name: "Vanguard",
      description: "Enterprise-grade cybersecurity operations platform for MSPs. XDR/EDR, compliance monitoring, SIEM, and managed SOC services.",
      icon: Shield,
      color: "text-cyan-500"
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroSecurity} 
            alt="Digital security shield"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>
        <div className="relative z-10 container mx-auto text-center max-w-4xl">
          <Badge className="mb-6" variant="secondary">
            <Flag className="h-3 w-3 mr-1" />
            Veteran-Owned Business
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            AI Development & 
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {" "}Cybersecurity Agency
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            UltriumAI is a veteran-owned technology company building AI-powered tools and cybersecurity 
            solutions for businesses of all sizes. We combine 15+ years of IT and security expertise 
            with cutting-edge artificial intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hub">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Our Products <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Get In Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What We Build</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three flagship products designed to solve real problems for businesses
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Card key={index} className="h-full hover:border-primary/30 transition-colors">
                <CardHeader>
                  <product.icon className={`h-10 w-10 mb-4 ${product.color}`} />
                  <CardTitle>{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We Work</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center h-full">
                <CardHeader>
                  <value.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-lg">{value.title}</CardTitle>
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

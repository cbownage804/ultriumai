import { Link, useNavigate } from "react-router-dom";
import { Copyright, Shield, Mail, Phone, MapPin, Globe, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleNavigation = (path: string) => {
    if (path.startsWith('#')) {
      const element = document.querySelector(path);
      if (element) {
        const navHeight = 64;
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: elementTop, behavior: 'smooth' });
      }
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={ultraiumAiLogo} alt="UltriumAI - AI-powered knowledge management platform" className="h-12 w-auto" />
              <div>
                <span className="text-xl font-bold text-foreground">UltriumAI</span>
                <div className="text-xs text-muted-foreground">
                  A Division of <a 
                    href="https://ultriumllc.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Ultrium
                  </a>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Veteran-owned AI solutions company specializing in custom GPT development, cybersecurity automation, and knowledge management for MSPs and businesses.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Built for Business. Secure by Design</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Solutions</h3>
            <div className="space-y-2">
              <button onClick={() => handleNavigation('/ultriumgpt')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                UltriumGPT Platform
              </button>
              <button onClick={() => handleNavigation('/solutions')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Business Solutions
              </button>
              <button onClick={() => handleNavigation('/demos')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Live AI Demos
              </button>
              <button onClick={() => handleNavigation('/pricing')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing Plans
              </button>
              <button onClick={() => handleNavigation('/docs')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </button>
            </div>
          </div>

          {/* Security Products */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">AI Security Apps</h3>
            <div className="space-y-2">
              <button onClick={() => handleNavigation('/products/safeemail')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafeEmail™
              </button>
              <button onClick={() => handleNavigation('/products/safelink')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafeLink™
              </button>
              <button onClick={() => handleNavigation('/products/safedoc')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafeDoc™
              </button>
              <button onClick={() => handleNavigation('/products/safepass')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafePass™
              </button>
              <button onClick={() => handleNavigation('/products/safenet')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafeNet™
              </button>
              <button onClick={() => handleNavigation('/products/safecomp')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafeComp™
              </button>
              <button onClick={() => handleNavigation('/products/safeweb')} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                SafeWeb™
              </button>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:804-821-1410" className="hover:text-foreground transition-colors">
                  (804) 821-1410
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:support@ultriumai.com" className="hover:text-foreground transition-colors">
                  support@ultriumai.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Richmond, Virginia</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4 text-primary" />
                <a href="https://ultriumai.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  ultriumai.com
                </a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Copyright className="h-4 w-4" />
            <span>{currentYear} Ultrium LLC. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/security" className="text-muted-foreground hover:text-foreground transition-colors">
              Security Policy
            </Link>
            <button onClick={() => handleNavigation('#contact')} className="text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </button>
          </div>
        </div>

        {/* Veteran-Owned Badge */}
        <div className="text-center pt-6 border-t border-border/50 mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Proudly Veteran-Owned & Operated</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import ultriumGPTLogo from "@/assets/ultrium-gpt-logo.png";
import vanguardLogo from "@/assets/vanguard-logo.png";
import { safesuiteLogo } from "@/components/safesuite/SafeSuiteProductIcons";
import { safeWindowOpen } from "@/utils/security";

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
    <footer className="bg-muted/50 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto" />
              <span className="text-lg font-bold">UltriumAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We build custom AI solutions for business. From intelligent GPTs to enterprise security platforms.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">Veteran-Owned</span>
              <span>•</span>
              <span>15+ Years IT Experience</span>
            </div>
          </div>

          {/* Flagship Products */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Flagship Products</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleNavigation('/ai-studio')} 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
                >
                  <img src={ultriumGPTLogo} alt="AI Studio" className="h-6 w-6 rounded object-contain bg-black" />
                  AI Studio™
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = 'https://vanguard.ultriumai.com'} 
                  className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-2"
                >
                  <img src={vanguardLogo} alt="Vanguard" className="h-6 w-6 rounded object-contain bg-black" />
                  Vanguard™
                </button>
              </li>
              <li>
                <button 
                  onClick={() => safeWindowOpen('https://safesuite.ultriumai.com', '_blank')} 
                  className="text-sm text-muted-foreground hover:text-emerald-500 flex items-center gap-2"
                >
                  <img src={safesuiteLogo} alt="SafeSuite" className="h-6 w-6 rounded object-contain bg-black" />
                  SafeSuite™
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/portfolio')} className="text-sm text-muted-foreground hover:text-foreground">
                  Portfolio
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/pricing')} className="text-sm text-muted-foreground hover:text-foreground">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/contact')} className="text-sm text-muted-foreground hover:text-foreground">
                  Contact
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/about')} className="text-sm text-muted-foreground hover:text-foreground">
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:888-884-1410" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  888-884-1410
                </a>
              </li>
              <li>
                <a href="mailto:support@ultriumai.com" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@ultriumai.com
                </a>
              </li>
              <li>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Virginia, USA
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} UltriumAI. Proudly developed by Ultrium LLC.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link to="/security" className="text-muted-foreground hover:text-foreground">
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

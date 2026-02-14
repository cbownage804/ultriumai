import { Link, useNavigate } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import aiStudioLogo from "@/assets/ai-studio-logo.png";
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
    <footer className="relative bg-gradient-to-b from-background via-muted/20 to-muted/40 border-t border-border/20 overflow-hidden">
      {/* Decorative gradient overlay with animated glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info - Enhanced */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src={ultraiumAiLogo} 
                alt="UltriumAI" 
                className="h-11 w-auto transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(var(--primary),0.4)]" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-foreground transition-all duration-300">
                UltriumAI
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We build custom AI solutions for business. From intelligent GPTs to enterprise security platforms.
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-4 py-2 rounded-full font-medium border border-primary/20 shadow-sm hover:shadow-primary/20 transition-all duration-300 hover:scale-105 cursor-default">
                🎖️ Veteran-Owned
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground font-medium">15+ Years IT</span>
            </div>
          </div>

          {/* Flagship Products - Enhanced with glow effects */}
          <div className="space-y-5">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="h-1 w-6 bg-gradient-to-r from-primary to-cyan-500 rounded-full" />
              Flagship Products
            </h4>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => handleNavigation('/products/ai-studio')} 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-3 group transition-all duration-300 hover:translate-x-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-black to-gray-900 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-primary/40 transition-all duration-300 border border-primary/20 group-hover:border-primary/50 group-hover:scale-110">
                    <img src={aiStudioLogo} alt="AI Studio" className="h-7 w-7 object-contain" />
                  </div>
                  <span className="font-medium">AI Studio™</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/products/vanguard')} 
                  className="text-sm text-muted-foreground hover:text-cyan-400 flex items-center gap-3 group transition-all duration-300 hover:translate-x-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-black to-gray-900 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-cyan-500/40 transition-all duration-300 border border-cyan-500/20 group-hover:border-cyan-500/50 group-hover:scale-110">
                    <img src={vanguardLogo} alt="Vanguard" className="h-7 w-7 object-contain" />
                  </div>
                  <span className="font-medium">Vanguard™</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/products/safesuite')} 
                  className="text-sm text-muted-foreground hover:text-emerald-400 flex items-center gap-3 group transition-all duration-300 hover:translate-x-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-black to-gray-900 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-emerald-500/40 transition-all duration-300 border border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:scale-110">
                    <img src={safesuiteLogo} alt="SafeSuite" className="h-7 w-7 object-contain" />
                  </div>
                  <span className="font-medium">SafeSuite™</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links - Enhanced */}
          <div className="space-y-5">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="h-1 w-6 bg-gradient-to-r from-primary to-emerald-500 rounded-full" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { path: '/products', label: 'Products' },
                { path: '/pricing', label: 'Pricing' },
                { path: '/contact', label: 'Contact' },
                { path: '/docs', label: 'Documentation' },
              ].map((link) => (
                <li key={link.path}>
                  <button 
                    onClick={() => handleNavigation(link.path)} 
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1.5 inline-flex items-center gap-2 group"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
                    <span className="font-medium">{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Enhanced */}
          <div className="space-y-5">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="h-1 w-6 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
              Contact
            </h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:support@ultriumai.com" 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-3 transition-all duration-300 group hover:translate-x-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300 border border-primary/20">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">support@ultriumai.com</span>
                </a>
              </li>
              <li>
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Virginia, USA</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Enhanced with glassmorphism */}
        <div className="mt-16 pt-8 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © {currentYear} UltriumAI. Proudly developed by{' '}
              <span className="text-foreground font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>Ultrium LLC</span>.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              {[
                { path: '/privacy', label: 'Privacy Policy' },
                { path: '/terms', label: 'Terms of Service' },
                { path: '/security', label: 'Security' },
              ].map((link) => (
                <button 
                  key={link.path}
                  onClick={() => handleNavigation(link.path)}
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-0.5 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

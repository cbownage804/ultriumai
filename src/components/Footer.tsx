import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
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
    <footer className="relative bg-gradient-to-b from-background via-muted/30 to-muted/50 border-t border-border/30">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-emerald-500/[0.02] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src={ultraiumAiLogo} 
                alt="UltriumAI" 
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-110" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                UltriumAI
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We build custom AI solutions for business. From intelligent GPTs to enterprise security platforms.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-3 py-1.5 rounded-full font-medium border border-primary/20">
                Veteran-Owned
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">15+ Years IT Experience</span>
            </div>
          </div>

          {/* Flagship Products */}
          <div className="space-y-5">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">Flagship Products</h4>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => handleNavigation('/products/ai-studio')} 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-3 group transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-primary/20 transition-shadow">
                    <img src={aiStudioLogo} alt="AI Studio" className="h-6 w-6 object-contain" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">AI Studio™</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/products/vanguard')} 
                  className="text-sm text-muted-foreground hover:text-cyan-400 flex items-center gap-3 group transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-cyan-500/20 transition-shadow">
                    <img src={vanguardLogo} alt="Vanguard" className="h-6 w-6 object-contain" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">Vanguard™</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/products/safesuite')} 
                  className="text-sm text-muted-foreground hover:text-emerald-400 flex items-center gap-3 group transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-emerald-500/20 transition-shadow">
                    <img src={safesuiteLogo} alt="SafeSuite" className="h-6 w-6 object-contain" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">SafeSuite™</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { path: '/portfolio', label: 'Portfolio' },
                { path: '/pricing', label: 'Pricing' },
                { path: '/contact', label: 'Contact' },
                { path: '/about', label: 'About Us' },
              ].map((link) => (
                <li key={link.path}>
                  <button 
                    onClick={() => handleNavigation(link.path)} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:support@ultriumai.com" 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-3 transition-colors duration-200 group"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  support@ultriumai.com
                </a>
              </li>
              <li>
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Virginia, USA
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © {currentYear} UltriumAI. Proudly developed by{' '}
              <span className="text-foreground font-medium">Ultrium LLC</span>.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              {[
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms of Service' },
                { to: '/security', label: 'Security' },
              ].map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { Button } from "@/components/ui/button";
import { Shield, Play, Calendar, Users, Star, Lock, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";

const Hero = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    if (path.startsWith('#')) {
      // Scroll to section with nav offset
      const element = document.querySelector(path);
      if (element) {
        const navHeight = 64; // h-16 = 64px
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: elementTop, behavior: 'smooth' });
      }
    } else {
      // Navigate to page and scroll to top
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  return (
    <section className="relative min-h-[110vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-12 py-8">
          {/* Demo GIF Section - Moved to Top */}
          <div className="animate-fade-in">
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src="https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/gpt-logos/UltriumAI_intro_gif.gif"
                  alt="UltriumAI Demo"
                  className="w-full h-auto object-contain max-w-md mx-auto block"
                />
              </div>
            </div>
          </div>

          {/* Main heading with centered logo */}
          <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png" 
                alt="Ultrium Logo" 
                className="h-48 w-48"
              />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-normal animate-slide-up px-4 pb-4">
              Complete AI-Powered Business Platform
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in px-4" style={{animationDelay: '0.4s'}}>
              Build custom AI agents, deploy mobile technician apps, protect with enterprise security, and white-label everything for your clients. Complete platform from custom GPTs to mobile field operations.
            </p>
            <div className="flex items-center justify-center gap-2 text-base md:text-lg font-medium text-primary animate-bounce-gentle px-4">
              <span>Built for Business. Secure by Design</span>
            </div>
          </div>

          {/* Custom GPT Builder Call-out */}
          <div className="animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-bold text-primary">Now Available</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Build Your Own Custom GPTs</h3>
                  <p className="text-muted-foreground">
                    Create powerful AI agents tailored to your business needs with <span className="font-semibold text-primary">Ultrium AI's custom-tailored platform</span>
                  </p>
                  <Button 
                    className="mt-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={() => handleNavigation('/auth')}
                  >
                    Start Building Now
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Capabilities Showcase */}
          <div className="animate-fade-in" style={{animationDelay: '0.5s'}}>
            <div className="max-w-6xl mx-auto mb-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Complete Platform Capabilities</h3>
                <p className="text-muted-foreground">Everything you need to deploy AI-powered solutions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Mobile Technician App */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                     onClick={() => handleNavigation('/technician-mobile')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-6 w-6 text-blue-500" />
                    </div>
                    <h4 className="font-bold text-foreground">Mobile Technician App</h4>
                    <p className="text-sm text-muted-foreground">iOS & Android field operations app with GPS, camera, and real-time alerts</p>
                    <div className="text-xs text-blue-500 font-medium">✓ White-label Ready</div>
                  </div>
                </div>

                {/* Security Suite */}
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                     onClick={() => handleNavigation('#security')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="h-6 w-6 text-red-500" />
                    </div>
                    <h4 className="font-bold text-foreground">8 Security Apps</h4>
                    <p className="text-sm text-muted-foreground">SafeScan, SafeNet, SafePass & more with real-time scanning</p>
                    <div className="text-xs text-red-500 font-medium">✓ Enterprise Ready</div>
                  </div>
                </div>

                {/* MSP Solutions */}
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                     onClick={() => handleNavigation('/msps')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                    <h4 className="font-bold text-foreground">MSP Platform</h4>
                    <p className="text-sm text-muted-foreground">Client management, RMM integration, SIEM & SafeDesk automation</p>
                    <div className="text-xs text-green-500 font-medium">✓ Co-Management</div>
                  </div>
                </div>

                {/* API & Integration */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                     onClick={() => handleNavigation('/docs')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Play className="h-6 w-6 text-purple-500" />
                    </div>
                    <h4 className="font-bold text-foreground">API Access</h4>
                    <p className="text-sm text-muted-foreground">Full API access, webhook integrations, and custom development</p>
                    <div className="text-xs text-purple-500 font-medium">✓ Developer Friendly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Target Audience Buttons */}
          <div className="animate-fade-in mb-8" style={{animationDelay: '0.6s'}}>
            <p className="text-lg font-medium text-foreground mb-8">Choose Your Solution:</p>
            
            {/* Business Solutions */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Business Solutions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <Button 
                  size="lg" 
                  className="text-lg px-6 py-8 h-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow flex flex-col items-center gap-2"
                  onClick={() => handleNavigation('/small-business')}
                >
                  <Users className="h-6 w-6" />
                  <span>Small Business</span>
                  <span className="text-sm opacity-80">1-25 Employees</span>
                </Button>
                <Button 
                  size="lg" 
                  className="text-lg px-6 py-8 h-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow flex flex-col items-center gap-2"
                  onClick={() => handleNavigation('/medium-business')}
                >
                  <Users className="h-6 w-6" />
                  <span>Medium Business</span>
                  <span className="text-sm opacity-80">25-250 Employees</span>
                </Button>
                <Button 
                  size="lg" 
                  className="text-lg px-6 py-8 h-auto bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow flex flex-col items-center gap-2"
                  onClick={() => handleNavigation('/enterprise')}
                >
                  <Building className="h-6 w-6" />
                  <span>Enterprise</span>
                  <span className="text-sm opacity-80">250+ Employees</span>
                </Button>
              </div>
            </div>

            {/* Service Provider Solutions */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Service Provider Solutions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Button 
                  size="lg" 
                  className="text-lg px-6 py-8 h-auto bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow flex flex-col items-center gap-2"
                  onClick={() => handleNavigation('/msps')}
                >
                  <Users className="h-6 w-6" />
                  <span>MSPs</span>
                  <span className="text-sm opacity-80">Managed Service Providers</span>
                </Button>
                <Button 
                  size="lg" 
                  className="text-lg px-6 py-8 h-auto bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow flex flex-col items-center gap-2"
                  onClick={() => handleNavigation('/mssps')}
                >
                  <Lock className="h-6 w-6" />
                  <span>MSSPs</span>
                  <span className="text-sm opacity-80">Managed Security Service Providers</span>
                </Button>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{animationDelay: '0.8s'}}>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow"
              onClick={() => handleNavigation('/pricing')}
            >
              <Star className="mr-2 h-5 w-5" />
              Get Started - $15/month
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 h-auto border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300 hover:scale-105"
              onClick={() => handleNavigation('/live-demos')}
            >
              <Play className="mr-2 h-5 w-5" />
              See Live Demos
            </Button>
          </div>

          {/* Veteran-Owned Excellence Section */}
          <div className="pt-8 border-t border-border/50 animate-fade-in" style={{animationDelay: '0.8s'}}>
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-8 mb-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src="/lovable-uploads/4c07c97c-1f89-4a11-b3f2-ed9f86118834.png" 
                    alt="Ultrium Logo" 
                    className="h-16 w-16 dark:hidden"
                  />
                  <img 
                    src="/lovable-uploads/377dbc83-5d32-4888-92b3-19996bb3890d.png" 
                    alt="Ultrium Logo" 
                    className="h-16 w-16 hidden dark:block"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground">Need More Than AI? Get Full IT Support</h3>
                <p className="text-muted-foreground leading-relaxed">
                  While you're exploring AI solutions with UltriumAI, don't forget that our parent company, Ultrium, is your go-to partner for comprehensive IT services. From 24/7 managed support and advanced cybersecurity to seamless cloud migrations and compliance management - we've got your complete technology stack covered.
                </p>
                <div className="bg-primary/10 rounded-lg p-4 my-4">
                  <p className="text-sm font-medium text-primary mb-2">✓ 15+ Years Protecting Virginia Businesses</p>
                  <p className="text-sm font-medium text-primary mb-2">✓ Veteran-Owned & Operated Since Day One</p>
                  <p className="text-sm font-medium text-primary">✓ Your AI Strategy + Complete IT Infrastructure</p>
                </div>
                <Button 
                  variant="outline"
                  className="mt-4 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 text-lg px-6 py-3"
                  onClick={() => window.open('https://ultriumllc.com', '_blank', 'noopener,noreferrer')}
                >
                  <Building className="mr-2 h-5 w-5" />
                  Get Your Complete IT Solution →
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <Star className="h-4 w-4 text-success animate-glow" />
                <span>Security-First Design</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <Users className="h-4 w-4 text-info animate-glow" style={{animationDelay: '0.5s'}} />
                <span>15+ Years IT Experience</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <Star className="h-4 w-4 text-warning animate-glow" style={{animationDelay: '1s'}} />
                <span>Custom-Built Solutions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
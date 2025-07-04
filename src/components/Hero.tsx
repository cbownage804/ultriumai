import { Button } from "@/components/ui/button";
import { Shield, Play, Calendar, Users, Star } from "lucide-react";
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Main heading */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight animate-slide-up px-4">
              Transform Your Business with Custom AI Agents
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in px-4" style={{animationDelay: '0.2s'}}>
              From helpdesk GPTs to cybersecurity copilots—UltriumAI builds the tools to power your future.
            </p>
            <div className="flex items-center justify-center gap-2 text-base md:text-lg font-medium text-primary animate-bounce-gentle px-4">
              <Shield className="h-5 w-5 md:h-6 md:w-6" />
              <span>Built for Business. Secure by Design</span>
            </div>
          </div>

          {/* Custom GPT Builder Call-out */}
          <div className="animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-6 w-6 text-primary animate-glow" />
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

          {/* Video Section */}
          <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
            <div className="max-w-4xl mx-auto mb-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-1">
                <div className="bg-background/95 backdrop-blur-sm rounded-xl p-8">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">See UltriumAI in Action</h3>
                  <VideoPlayer videoUrl="https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/videos/UltriumAI.mp4" title="UltriumAI Demo Video" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{animationDelay: '0.6s'}}>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow"
              onClick={() => handleNavigation('#security')}
            >
              <Play className="mr-2 h-5 w-5" />
              See Our GPT Agents In Action
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 h-auto border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300 hover:scale-105"
              onClick={() => handleNavigation('#contact')}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book a Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-8 border-t border-border/50 animate-fade-in" style={{animationDelay: '0.8s'}}>
            <p className="text-sm text-muted-foreground mb-4">Proudly developed by Ultrium LLC - Veteran-owned IT solutions</p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <Shield className="h-4 w-4 text-success animate-glow" />
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
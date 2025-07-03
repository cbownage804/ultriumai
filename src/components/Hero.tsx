import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, Users, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/85 to-black/90" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
            UltriumGPT
          </h1>
          
          <p className="text-xl sm:text-2xl lg:text-3xl mb-4 text-foreground font-semibold drop-shadow-lg">
            Ready-to-Deploy Knowledge Management by UltriumAI
          </p>
          
          <p className="text-lg sm:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            From our proven custom AI agent expertise comes UltriumGPT - a ready-to-deploy knowledge management platform. 
            Built for Business. Secure by Design. Deploy instantly while we handle the complex AI development for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              Schedule Live Demo
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Call 804-821-1410
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <Brain className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">MSP Ready</h3>
              <p className="text-sm text-muted-foreground text-center">Purpose-built for managed service providers</p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <Users className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">White-Label</h3>
              <p className="text-sm text-muted-foreground text-center">Branded experience for each client</p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <MessageSquare className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Team Integration</h3>
              <p className="text-sm text-muted-foreground text-center">Embed in Teams, Slack, and custom apps</p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <Zap className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Proven ROI</h3>
              <p className="text-sm text-muted-foreground text-center">20-30% ticket reduction in month one</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
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
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-purple-600 bg-clip-text text-transparent">
            UltraKB
          </h1>
          
          <p className="text-xl sm:text-2xl lg:text-3xl mb-4 text-foreground/90 font-semibold">
            AI Knowledge-Base Chat Assistant
          </p>
          
          <p className="text-lg sm:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Reduce support tickets by 20-30% in the first month. Train custom AI assistants on your internal docs, 
            runbooks, and policies. White-label for multiple customers with branded frontends. 
            Embed seamlessly in Microsoft Teams and Slack.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              View Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <Brain className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground text-center">Instant accurate answers from your knowledge base</p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <Users className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground text-center">Separate knowledge bases for each customer</p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <MessageSquare className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Team Integration</h3>
              <p className="text-sm text-muted-foreground text-center">Embed in Teams, Slack, and custom apps</p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <Zap className="h-8 w-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Instant ROI</h3>
              <p className="text-sm text-muted-foreground text-center">Reduce support tickets 24/7 self-service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
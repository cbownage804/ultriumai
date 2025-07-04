import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Bot } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background))_70%)]"></div>
      
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary animate-glow" />
            <span className="text-sm font-medium text-primary">Powered by Advanced AI Technology</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            <span className="text-gradient">UltriumGPT</span>
            <br />
            <span className="text-foreground">Ready-to-Deploy Knowledge Management</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-primary/90 font-semibold mb-4 animate-fade-in">
            by UltriumAI
          </p>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in">
            From our proven custom AI agent expertise comes UltriumGPT - a ready-to-deploy knowledge management platform. 
            Built for Business. Secure by Design. Deploy instantly while we handle the complex AI development for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up">
            <Link to="/auth">
              <Button size="lg" className="btn-gradient text-lg px-8 py-4 h-auto group">
                Schedule Live Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto glass hover:bg-primary/10">
              Call 804-821-1410
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto animate-fade-in">
            <div className="flex flex-col items-center p-6 glass rounded-2xl card-glow">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">MSP Ready</h3>
              <p className="text-muted-foreground text-center text-sm">Purpose-built for managed service providers</p>
            </div>

            <div className="flex flex-col items-center p-6 glass rounded-2xl card-glow">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">White-Label</h3>
              <p className="text-muted-foreground text-center text-sm">Branded experience for each client</p>
            </div>

            <div className="flex flex-col items-center p-6 glass rounded-2xl card-glow">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Integration</h3>
              <p className="text-muted-foreground text-center text-sm">Embed in Teams, Slack, and custom apps</p>
            </div>

            <div className="flex flex-col items-center p-6 glass rounded-2xl card-glow">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Proven ROI</h3>
              <p className="text-muted-foreground text-center text-sm">20-30% ticket reduction in month one</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 animate-fade-in">
            <p className="text-sm text-muted-foreground mb-6">Trusted by IT professionals worldwide</p>
            <div className="flex justify-center items-center gap-6 opacity-60 flex-wrap">
              <div className="text-xs font-medium">MSPs</div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block"></div>
              <div className="text-xs font-medium">Enterprise IT</div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block"></div>
              <div className="text-xs font-medium">Cybersecurity Teams</div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block"></div>
              <div className="text-xs font-medium">DevOps Engineers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-bounce-gentle hidden lg:block"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-bounce-gentle hidden lg:block" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-primary/10 rounded-full blur-lg animate-bounce-gentle hidden lg:block" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};

export default Hero;
import { Button } from "@/components/ui/button";
import { MessageSquare, Menu } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">UltriumGPT</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </a>
            <a href="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#integrations" className="text-foreground/80 hover:text-foreground transition-colors">
              Integrations
            </a>
            <a href="#docs" className="text-foreground/80 hover:text-foreground transition-colors">
              Docs
            </a>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost">
              Contact Sales
            </Button>
            <Button variant="hero">
              Request Demo
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-foreground/80 hover:text-foreground">
                Features
              </a>
              <a href="/pricing" className="block px-3 py-2 text-foreground/80 hover:text-foreground">
                Pricing
              </a>
              <a href="#integrations" className="block px-3 py-2 text-foreground/80 hover:text-foreground">
                Integrations
              </a>
              <a href="#docs" className="block px-3 py-2 text-foreground/80 hover:text-foreground">
                Docs
              </a>
              <div className="flex flex-col space-y-2 pt-4 px-3">
                <Button variant="ghost" className="w-full">
                  Contact Sales
                </Button>
                <Button variant="hero" className="w-full">
                  Request Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
import ChatDemo from "./ChatDemo";
import { Button } from "@/components/ui/button";
import { useScrollAnimation, getAnimationClasses } from "@/hooks/useScrollAnimation";

const DemoSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: chatRef, isVisible: chatVisible } = useScrollAnimation({ delay: 200 });
  const { ref: sidebarRef, isVisible: sidebarVisible } = useScrollAnimation({ delay: 400 });

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className={getAnimationClasses(headerVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              See UltriumGPT in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Experience our AI assistant trained on common MSP procedures and client documentation. 
              Ask about user onboarding, password resets, or expense reports.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div ref={chatRef} className={`flex-1 ${getAnimationClasses(chatVisible, 'slideRight')}`}>
            <ChatDemo />
          </div>
          
          <div ref={sidebarRef} className={`flex-1 space-y-6 ${getAnimationClasses(sidebarVisible, 'slideLeft')}`}>
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Try These Sample Questions:</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto p-3 hover:scale-105 transition-transform duration-200"
                  onClick={() => {
                    // This would trigger the chat demo
                    console.log("Sample question clicked");
                  }}
                >
                  "How do I onboard a new user?"
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto p-3 hover:scale-105 transition-transform duration-200"
                  onClick={() => console.log("Sample question clicked")}
                >
                  "What's the password reset procedure?"
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto p-3 hover:scale-105 transition-transform duration-200"
                  onClick={() => console.log("Sample question clicked")}
                >
                  "How do I submit an expense report?"
                </Button>
              </div>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Key Benefits:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center hover:text-foreground transition-colors duration-200">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Instant answers 24/7
                </li>
                <li className="flex items-center hover:text-foreground transition-colors duration-200">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Reduces support ticket volume
                </li>
                <li className="flex items-center hover:text-foreground transition-colors duration-200">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Consistent, accurate responses
                </li>
                <li className="flex items-center hover:text-foreground transition-colors duration-200">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Learns from your documents
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
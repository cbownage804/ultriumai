import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface ContactHeaderProps {
  isVisible: boolean;
  animationClasses: string;
}

export const ContactHeader = ({ isVisible, animationClasses }: ContactHeaderProps) => {
  return (
    <div className={animationClasses}>
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">
          <MessageSquare className="h-4 w-4 mr-2" />
          Get In Touch
        </Badge>
        <h2 className="text-4xl font-bold mb-6 text-foreground">
          Ready to Transform Your Business with AI?
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Let's discuss how custom AI agents can streamline your operations while keeping security at the forefront.
          Book a free discovery call or reach out directly.
        </p>
      </div>
    </div>
  );
};
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
        <h1 className="text-4xl font-bold mb-6 text-foreground">
          Get in Touch with the Wrayth Team
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Have questions about Wrayth, Vault, Scan, Watch, Ray, pricing, or enterprise deployment?
          We'd love to help.
        </p>
      </div>
    </div>
  );
};

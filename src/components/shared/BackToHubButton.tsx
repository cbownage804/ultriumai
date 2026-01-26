import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackToHubButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export const BackToHubButton = ({ 
  variant = "outline", 
  size = "sm",
  className = "",
  label = "Back to Hub",
  showIcon = true
}: BackToHubButtonProps) => {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={() => navigate('/hub')}
      className={`gap-2 ${className}`}
    >
      {showIcon && <ArrowLeft className="h-4 w-4" />}
      {label}
    </Button>
  );
};

export const FloatingBackButton = () => {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={() => navigate('/hub')}
      className="fixed top-20 left-4 z-50 h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-accent"
      title="Back to Product Hub"
    >
      <LayoutDashboard className="h-4 w-4" />
    </Button>
  );
};

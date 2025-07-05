import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SolutionPurchaseButtonProps {
  solutionType: string;
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

export const SolutionPurchaseButton = ({ 
  solutionType, 
  variant = "default", 
  className = "",
  children 
}: SolutionPurchaseButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase this solution.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: solutionType,
          interval: 'monthly'
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Error",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handlePurchase}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
};
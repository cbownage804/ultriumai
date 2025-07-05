import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { UserCountSelector } from "./UserCountSelector";

interface SolutionPurchaseButtonProps {
  solutionType: string;
  solutionName: string;
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

export const SolutionPurchaseButton = ({ 
  solutionType, 
  solutionName,
  variant = "default", 
  className = "",
  children 
}: SolutionPurchaseButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (userCount: number, interval: 'monthly' | 'yearly') => {
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
          interval: interval,
          userCount: userCount
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          className={className}
        >
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <UserCountSelector
          solutionType={solutionType}
          solutionName={solutionName}
          onPurchase={handlePurchase}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
};
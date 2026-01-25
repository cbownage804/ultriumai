/**
 * Voice Credit Purchase Dialog
 * Allows users to buy additional voice minutes
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Zap, Check, Loader2 } from 'lucide-react';
import { VOICE_CREDIT_PACKAGES, formatPrice } from '@/config/voiceCreditPackages';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceCreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMinutes?: number;
}

export function VoiceCreditPurchaseDialog({ 
  open, 
  onOpenChange,
  currentMinutes = 0 
}: VoiceCreditPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    const pkg = VOICE_CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-credits-checkout', {
        body: { priceId: pkg.stripePriceId }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Could not start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-cyan-400" />
            Buy Voice Minutes
          </DialogTitle>
          <DialogDescription>
            Add more voice AI conversation time. Credits never expire.
          </DialogDescription>
        </DialogHeader>

        {currentMinutes > 0 && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mb-2">
            <Zap className="w-4 h-4 inline mr-1 text-amber-400" />
            You have <strong>{currentMinutes}</strong> purchased minutes remaining
          </div>
        )}

        <div className="grid gap-3">
          {VOICE_CREDIT_PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={cn(
                "cursor-pointer transition-all hover:border-cyan-400/50",
                selectedPackage === pkg.id && "border-cyan-400 bg-cyan-400/5",
                pkg.popular && "ring-1 ring-cyan-400/30"
              )}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    selectedPackage === pkg.id ? "bg-cyan-400 text-white" : "bg-muted"
                  )}>
                    {selectedPackage === pkg.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {pkg.name}
                      {pkg.popular && (
                        <Badge variant="secondary" className="text-xs bg-cyan-400/20 text-cyan-400 border-0">
                          Best Value
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.savings ? (
                        <span className="text-emerald-400">{pkg.savings}</span>
                      ) : (
                        `${formatPrice(pkg.priceCents / pkg.minutes * 100)}/min`
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(pkg.priceCents)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          className="w-full bg-cyan-500 hover:bg-cyan-600" 
          disabled={!selectedPackage || isLoading}
          onClick={handlePurchase}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Opening Checkout...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Purchase Minutes
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure checkout powered by Stripe. Credits are non-refundable.
        </p>
      </DialogContent>
    </Dialog>
  );
}

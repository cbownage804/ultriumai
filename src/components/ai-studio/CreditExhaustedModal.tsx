import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, AlertTriangle, Clock, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreditExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining?: number;
  resetDate?: string;
}

export const CreditExhaustedModal = ({ 
  isOpen, 
  onClose, 
  creditsRemaining = 0,
  resetDate 
}: CreditExhaustedModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  const handleViewUsage = () => {
    onClose();
    navigate('/dashboard/settings?tab=billing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Capacity Exhausted</DialogTitle>
              <DialogDescription className="text-base mt-1">
                You've used all your AI credits for this period
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Credits Remaining</div>
                <div className="text-sm text-muted-foreground">Current balance</div>
              </div>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {creditsRemaining.toLocaleString()}
            </Badge>
          </div>

          {/* Reset Info */}
          {resetDate && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Credits Reset</div>
                  <div className="text-sm text-muted-foreground">Next billing cycle</div>
                </div>
              </div>
              <span className="text-sm font-medium">{resetDate}</span>
            </div>
          )}

          {/* What This Means */}
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-2">
              What does this mean?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• AI features are temporarily unavailable</li>
              <li>• Your GPTs and data are safe</li>
              <li>• Upgrade or wait for credits to reset</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleViewUsage} className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            View Usage
          </Button>
          <Button onClick={handleUpgrade} className="flex-1 bg-gradient-to-r from-primary to-primary/80">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Plan
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

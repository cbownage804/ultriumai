import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Zap, Clock, TrendingUp } from "lucide-react";

interface UsageDisplayProps {
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    model: string;
  };
}

export const UsageDisplay = ({ usage }: UsageDisplayProps) => {
  if (!usage) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          Usage & Cost
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Model</span>
          <span className="font-medium">{usage.model}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Input</span>
            </div>
            <div className="font-medium">{usage.inputTokens.toLocaleString()}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Output</span>
            </div>
            <div className="font-medium">{usage.outputTokens.toLocaleString()}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Total</span>
            </div>
            <div className="font-medium">{usage.totalTokens.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">AI capacity used:</span>
            <span className="font-medium">{usage.totalTokens.toLocaleString()} tokens</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
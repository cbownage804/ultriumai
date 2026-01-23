import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  ArrowUp,
  Calculator,
  Brain,
  Sparkles,
  Inbox
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMSPRevenueOptimizer, RevenueOptimization } from "@/hooks/useMSPRevenueOptimizer";

export const MSPRevenueOptimizer = () => {
  const { optimizations, loading, totalPotential, refresh, applyPriceIncrease } = useMSPRevenueOptimizer();
  const { toast } = useToast();

  const handleApplyIncrease = async (optimization: RevenueOptimization) => {
    try {
      await applyPriceIncrease(optimization);
      toast({
        title: "Price Updated",
        description: `${optimization.company_name} rate updated to $${optimization.suggested_rate}/month`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pricing",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (optimizations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI Revenue Optimizer
            </h2>
            <p className="text-muted-foreground">
              AI-powered pricing suggestions to maximize your revenue
            </p>
          </div>
          <Button onClick={refresh} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Inbox className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Optimization Opportunities</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Add clients to your MSP account to start identifying revenue optimization opportunities with AI-powered analysis.
          </p>
          <Button variant="outline">
            <Target className="w-4 h-4 mr-2" />
            Add Your First Client
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Revenue Optimizer
          </h2>
          <p className="text-muted-foreground">
            AI-powered pricing suggestions to maximize your revenue
          </p>
        </div>
        <Button onClick={refresh} disabled={loading}>
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Revenue Potential Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="h-5 w-5" />
            Total Revenue Potential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600 mb-2">
            +${totalPotential.toLocaleString()}/month
          </div>
          <div className="text-2xl font-semibold text-green-700">
            +${(totalPotential * 12).toLocaleString()}/year
          </div>
          <p className="text-sm text-green-600 mt-2">
            {optimizations.length} optimization opportunities identified
          </p>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {optimizations.map((optimization) => (
          <Card key={optimization.client_id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{optimization.company_name}</CardTitle>
                <Badge className={getRiskColor(optimization.risk_level)}>
                  {optimization.risk_level} risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Rate</p>
                  <p className="text-2xl font-bold">${optimization.current_rate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suggested Rate</p>
                  <p className="text-2xl font-bold text-green-600">${optimization.suggested_rate}</p>
                </div>
              </div>

              {/* Potential Increase */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">
                    +${optimization.potential_increase}/month
                  </span>
                </div>
                <span className="text-sm text-green-600">
                  +${optimization.potential_increase * 12}/year
                </span>
              </div>

              {/* Confidence Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Confidence Score</span>
                  <span className="font-medium">{optimization.confidence_score}%</span>
                </div>
                <Progress value={optimization.confidence_score} className="h-2" />
              </div>

              {/* Reasoning */}
              <div className="space-y-2">
                <p className="text-sm font-medium">AI Reasoning:</p>
                <ul className="space-y-1">
                  {optimization.reasoning.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Market Data */}
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium">Market Intelligence:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Market Avg:</span>
                    <span className="font-medium ml-1">${optimization.market_data.avg_market_rate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Demand:</span>
                    <span className="font-medium ml-1">{optimization.market_data.demand_indicator}%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleApplyIncrease(optimization)}
                  className="flex-1"
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Apply Increase
                </Button>
                <Button variant="outline" size="sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  ROI Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

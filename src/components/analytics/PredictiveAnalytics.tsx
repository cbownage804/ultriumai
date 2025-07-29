import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PredictiveAnalyticsProps {
  timeRange: string;
}

export const PredictiveAnalytics = ({ timeRange }: PredictiveAnalyticsProps) => {
  // Mock predictive data
  const churnPredictions = [
    { month: 'Jan', predicted: 3.2, actual: 2.8, confidence: 85 },
    { month: 'Feb', predicted: 2.9, actual: 3.1, confidence: 88 },
    { month: 'Mar', predicted: 3.5, actual: 3.3, confidence: 82 },
    { month: 'Apr', predicted: 2.8, actual: null, confidence: 90 },
    { month: 'May', predicted: 3.1, actual: null, confidence: 87 },
    { month: 'Jun', predicted: 2.9, actual: null, confidence: 89 }
  ];

  const revenueForecast = [
    { month: 'Jan', actual: 125000, predicted: null },
    { month: 'Feb', actual: 132000, predicted: null },
    { month: 'Mar', actual: 128000, predicted: null },
    { month: 'Apr', actual: 145000, predicted: null },
    { month: 'May', actual: null, predicted: 152000 },
    { month: 'Jun', actual: null, predicted: 158000 },
    { month: 'Jul', actual: null, predicted: 163000 },
    { month: 'Aug', actual: null, predicted: 167000 }
  ];

  const riskAssessments = [
    {
      client: 'Acme Corp',
      riskScore: 75,
      riskLevel: 'Medium',
      factors: ['Payment delays', 'Increased tickets'],
      recommendation: 'Schedule review meeting'
    },
    {
      client: 'TechStart Inc',
      riskScore: 25,
      riskLevel: 'Low',
      factors: ['Consistent payments', 'Low support volume'],
      recommendation: 'Continue monitoring'
    },
    {
      client: 'Global Systems',
      riskScore: 90,
      riskLevel: 'High',
      factors: ['Contract expiring', 'Competitor contact'],
      recommendation: 'Immediate intervention'
    }
  ];

  const modelPerformance = [
    {
      model: 'Churn Prediction',
      accuracy: 87.5,
      lastTrained: '2024-01-15',
      predictions: 156,
      status: 'healthy'
    },
    {
      model: 'Revenue Forecast',
      accuracy: 92.3,
      lastTrained: '2024-01-10',
      predictions: 89,
      status: 'healthy'
    },
    {
      model: 'Demand Forecast',
      accuracy: 78.9,
      lastTrained: '2024-01-05',
      predictions: 234,
      status: 'warning'
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-500';
      case 'Medium': return 'text-orange-500';
      case 'High': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Low': return 'default';
      case 'Medium': return 'secondary';
      case 'High': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modelPerformance.map((model, index) => (
          <Card key={index} className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {model.model}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{model.accuracy}%</div>
                  <Badge variant={model.status === 'healthy' ? 'default' : 'secondary'}>
                    {model.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Last trained: {model.lastTrained}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {model.predictions} predictions made
                  </div>
                  <Progress value={model.accuracy} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Prediction */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Churn Prediction Model
            </CardTitle>
            <CardDescription>Predicted vs actual churn rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={churnPredictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${Number(value).toFixed(1)}%`,
                      name === 'predicted' ? 'Predicted' : 'Actual'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="predicted"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Forecast
            </CardTitle>
            <CardDescription>Historical data and future predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString()}`,
                      name === 'actual' ? 'Actual' : 'Predicted'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="actual"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeDasharray="5 5"
                    name="predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Client Risk Assessment
          </CardTitle>
          <CardDescription>AI-powered risk analysis for key clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskAssessments.map((assessment, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{assessment.client}</h4>
                      <Badge variant={getRiskBadge(assessment.riskLevel) as "default" | "secondary" | "destructive" | "outline"}>
                        {assessment.riskLevel} Risk
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Score: {assessment.riskScore}/100
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Risk Factors:</div>
                        <ul className="text-sm text-muted-foreground">
                          {assessment.factors.map((factor, idx) => (
                            <li key={idx}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Recommendation:</div>
                        <div className="text-sm text-muted-foreground">
                          {assessment.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-16 h-16 relative">
                      <Progress 
                        value={assessment.riskScore} 
                        className="w-full h-2 absolute top-1/2 transform -translate-y-1/2" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{assessment.riskScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights & Recommendations */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>Machine learning driven business insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Zap className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <div className="font-medium text-blue-900">Revenue Opportunity</div>
                  <div className="text-sm text-blue-700">
                    Model predicts 15% revenue increase with proactive client engagement
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <div className="font-medium text-green-900">Process Optimization</div>
                  <div className="text-sm text-green-700">
                    Automated ticket routing could reduce resolution time by 23%
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                <div>
                  <div className="font-medium text-orange-900">Cost Alert</div>
                  <div className="text-sm text-orange-700">
                    Infrastructure costs trending 8% above forecast
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Brain className="h-5 w-5 text-purple-500 mt-1" />
                <div>
                  <div className="font-medium text-purple-900">Market Trend</div>
                  <div className="text-sm text-purple-700">
                    Demand for security services expected to grow 25% next quarter
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
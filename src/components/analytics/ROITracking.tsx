import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Plus,
  Calculator,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ROITrackingProps {
  timeRange: string;
}

export const ROITracking = ({ timeRange }: ROITrackingProps) => {
  // Mock ROI data
  const roiProjects = [
    {
      id: '1',
      name: 'Security Automation Platform',
      type: 'security_tool',
      investment: 45000,
      benefits: 67500,
      roi: 50.0,
      paybackMonths: 8,
      status: 'completed',
      startDate: '2023-06-01'
    },
    {
      id: '2',
      name: 'RMM Tool Implementation',
      type: 'automation',
      investment: 25000,
      benefits: 38750,
      roi: 55.0,
      paybackMonths: 6,
      status: 'tracking',
      startDate: '2023-09-01'
    },
    {
      id: '3',
      name: 'Staff Training Program',
      type: 'training',
      investment: 15000,
      benefits: 18200,
      roi: 21.3,
      paybackMonths: 10,
      status: 'tracking',
      startDate: '2023-11-01'
    },
    {
      id: '4',
      name: 'Process Optimization',
      type: 'process_improvement',
      investment: 8000,
      benefits: 12400,
      roi: 55.0,
      paybackMonths: 4,
      status: 'completed',
      startDate: '2023-08-01'
    }
  ];

  const roiSummary = {
    totalInvestment: 93000,
    totalBenefits: 136850,
    avgROI: 47.2,
    avgPayback: 7.0,
    completedProjects: 2,
    activeProjects: 2
  };

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'tracking': return 'secondary';
      case 'planning': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeBadge = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'security_tool': return 'destructive';
      case 'automation': return 'default';
      case 'training': return 'secondary';
      case 'process_improvement': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'security_tool': return 'Security Tool';
      case 'automation': return 'Automation';
      case 'training': return 'Training';
      case 'process_improvement': return 'Process Improvement';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* ROI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">${roiSummary.totalInvestment.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Across {roiSummary.activeProjects + roiSummary.completedProjects} initiatives
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                ${roiSummary.totalBenefits.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Cumulative benefits realized
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="text-2xl font-bold">{roiSummary.avgROI}%</div>
                <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                Portfolio performance
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Payback Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{roiSummary.avgPayback} months</div>
              <div className="text-xs text-muted-foreground">
                Time to break even
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Projects */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                ROI Tracking Projects
              </CardTitle>
              <CardDescription>Monitor return on investment for key initiatives</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Initiative
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roiProjects.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="font-medium">{project.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getTypeBadge(project.type)}>
                        {getTypeLabel(project.type)}
                      </Badge>
                      <Badge variant={getStatusBadge(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">${project.investment.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Investment</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      ${project.benefits.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Benefits</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <div className="text-lg font-bold">{project.roi}%</div>
                      {project.roi > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">ROI</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">{project.paybackMonths}m</div>
                    <div className="text-sm text-muted-foreground">Payback</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress to break-even</span>
                    <span>
                      {project.status === 'completed' ? '100%' : `${Math.min((project.benefits / project.investment) * 100, 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <Progress 
                    value={project.status === 'completed' ? 100 : Math.min((project.benefits / project.investment) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            ROI Calculator
          </CardTitle>
          <CardDescription>Estimate potential returns for new initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Initial Investment ($)</label>
                <input 
                  type="number" 
                  placeholder="50000" 
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expected Annual Benefits ($)</label>
                <input 
                  type="number" 
                  placeholder="75000" 
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time Period (months)</label>
                <input 
                  type="number" 
                  placeholder="12" 
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <Button className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate ROI
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Estimated Results:</div>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>ROI:</span>
                    <span className="font-bold">50.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback Period:</span>
                    <span className="font-bold">8 months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Benefit:</span>
                    <span className="font-bold text-green-600">$25,000</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    This initiative shows strong ROI potential with reasonable payback period.
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
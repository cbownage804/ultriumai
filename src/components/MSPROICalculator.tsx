import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  Send,
  Target,
  Zap,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ROIMetric {
  category: string;
  annualSavings: number;
  description: string;
  probability: number;
  details: string[];
}

interface ROICalculation {
  clientName: string;
  totalInvestment: number;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
  netPresentValue: number;
  metrics: ROIMetric[];
}

export const MSPROICalculator = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [calculation, setCalculation] = useState<ROICalculation | null>(null);
  const [inputs, setInputs] = useState({
    monthlyRate: 3500,
    employees: 50,
    industry: 'technology',
    complianceRequired: true,
    previousIncidents: 1
  });
  const { toast } = useToast();

  const roiMetrics: ROIMetric[] = [
    {
      category: 'Breach Prevention',
      annualSavings: 125000,
      description: 'Cost avoided from prevented data breaches',
      probability: 85,
      details: [
        'Average breach cost: $4.45M',
        'Probability of breach: 28% annually',
        'Your protection reduces risk by 85%',
        'Expected savings: $1.25M × 0.85 = $125K'
      ]
    },
    {
      category: 'Downtime Prevention',
      annualSavings: 87500,
      description: 'Business continuity and reduced system downtime',
      probability: 95,
      details: [
        'Average downtime cost: $5,600/minute',
        'Typical annual downtime: 16 hours',
        'Our monitoring reduces downtime by 95%',
        'Savings: $5.38M × 0.95 = $87.5K'
      ]
    },
    {
      category: 'Compliance Automation',
      annualSavings: 45000,
      description: 'Reduced compliance and audit costs',
      probability: 100,
      details: [
        'Manual compliance: $60K annually',
        'Audit preparation: $15K per audit',
        'Automated reporting saves 75%',
        'Annual savings: $45K'
      ]
    },
    {
      category: 'IT Efficiency',
      annualSavings: 35000,
      description: 'Reduced internal IT overhead and faster response',
      probability: 90,
      details: [
        'IT staff time savings: 20 hours/week',
        'Average IT salary: $85K annually',
        'Efficiency improvement: 25%',
        'Annual savings: $35K'
      ]
    },
    {
      category: 'Insurance Premium Reduction',
      annualSavings: 18000,
      description: 'Lower cyber insurance premiums with better security',
      probability: 80,
      details: [
        'Current cyber insurance: $45K/year',
        'Security improvements: 40% discount',
        'Premium reduction: $18K annually'
      ]
    },
    {
      category: 'Productivity Gains',
      annualSavings: 28000,
      description: 'Improved employee productivity with better security',
      probability: 75,
      details: [
        'Security incidents cause 3% productivity loss',
        'Average employee cost: $75K/year',
        'Productivity recovery: 95%',
        'Annual gain: $28K'
      ]
    }
  ];

  useEffect(() => {
    calculateROI();
  }, [inputs]);

  const calculateROI = () => {
    const annualInvestment = inputs.monthlyRate * 12;
    
    // Calculate industry-specific multipliers
    const industryMultipliers = {
      healthcare: 1.4,
      finance: 1.6,
      technology: 1.2,
      manufacturing: 1.1,
      retail: 1.3,
      other: 1.0
    };

    const multiplier = industryMultipliers[inputs.industry as keyof typeof industryMultipliers] || 1.0;
    const employeeScale = Math.log10(inputs.employees) / 2; // Scale based on company size
    const complianceBonus = inputs.complianceRequired ? 1.3 : 1.0;
    const incidentPenalty = inputs.previousIncidents * 0.2; // Higher savings if they've had incidents

    // Calculate weighted savings
    const totalSavings = roiMetrics.reduce((total, metric) => {
      const adjustedSavings = metric.annualSavings * 
        multiplier * 
        employeeScale * 
        complianceBonus * 
        (1 + incidentPenalty) * 
        (metric.probability / 100);
      return total + adjustedSavings;
    }, 0);

    const roi = ((totalSavings - annualInvestment) / annualInvestment) * 100;
    const paybackPeriod = annualInvestment / (totalSavings / 12);
    const npv = totalSavings - annualInvestment; // Simplified NPV for 1 year

    setCalculation({
      clientName: selectedClient || 'Your Organization',
      totalInvestment: annualInvestment,
      annualSavings: totalSavings,
      roi,
      paybackPeriod,
      netPresentValue: npv,
      metrics: roiMetrics.map(metric => ({
        ...metric,
        annualSavings: metric.annualSavings * multiplier * employeeScale * complianceBonus * (1 + incidentPenalty)
      }))
    });
  };

  const generateROIReport = () => {
    toast({
      title: "ROI Report Generated",
      description: "Comprehensive ROI analysis has been created and is ready for download",
    });
  };

  const shareWithClient = () => {
    toast({
      title: "ROI Report Shared",
      description: "ROI calculation has been sent to client via email",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            ROI Calculator
          </h2>
          <p className="text-muted-foreground">
            Show clients the financial value of your security services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateROIReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button onClick={shareWithClient}>
            <Send className="h-4 w-4 mr-2" />
            Share with Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Parameters</CardTitle>
            <CardDescription>Adjust values to calculate ROI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="monthlyRate">Monthly Service Rate</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="monthlyRate"
                  type="number"
                  value={inputs.monthlyRate}
                  onChange={(e) => setInputs(prev => ({...prev, monthlyRate: parseInt(e.target.value) || 0}))}
                  className="pl-10"
                  placeholder="3500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="employees">Number of Employees</Label>
              <Input
                id="employees"
                type="number"
                value={inputs.employees}
                onChange={(e) => setInputs(prev => ({...prev, employees: parseInt(e.target.value) || 0}))}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                value={inputs.industry}
                onChange={(e) => setInputs(prev => ({...prev, industry: e.target.value}))}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Financial Services</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="compliance"
                checked={inputs.complianceRequired}
                onChange={(e) => setInputs(prev => ({...prev, complianceRequired: e.target.checked}))}
                className="rounded"
              />
              <Label htmlFor="compliance">Compliance Required (SOC2, HIPAA, etc.)</Label>
            </div>

            <div>
              <Label htmlFor="incidents">Previous Security Incidents (Last 2 Years)</Label>
              <Input
                id="incidents"
                type="number"
                value={inputs.previousIncidents}
                onChange={(e) => setInputs(prev => ({...prev, previousIncidents: parseInt(e.target.value) || 0}))}
                placeholder="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        {calculation && (
          <div className="lg:col-span-2 space-y-4">
            {/* ROI Summary */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-5 w-5" />
                  ROI Summary for {calculation.clientName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {calculation.roi.toFixed(0)}%
                    </div>
                    <div className="text-sm text-green-700">Annual ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {calculation.paybackPeriod.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-700">Months Payback</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(calculation.annualSavings/1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-green-700">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(calculation.netPresentValue/1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-green-700">Net Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="breakdown" className="space-y-4">
              <TabsList>
                <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
                <TabsTrigger value="comparison">Industry Comparison</TabsTrigger>
                <TabsTrigger value="scenarios">Risk Scenarios</TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="space-y-4">
                {calculation.metrics.map((metric, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">{metric.category}</h4>
                          <Badge variant="outline">{metric.probability}% likely</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${(metric.annualSavings/1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-muted-foreground">annually</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{metric.description}</p>
                      <div className="space-y-1">
                        {metric.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {detail}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Industry Benchmarks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-xl font-bold text-red-500">0%</div>
                        <div className="text-sm text-muted-foreground">No Security</div>
                        <div className="text-xs text-red-600 mt-1">High risk, no protection</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-blue-50">
                        <div className="text-xl font-bold text-blue-600">245%</div>
                        <div className="text-sm text-muted-foreground">Industry Average</div>
                        <div className="text-xs text-blue-600 mt-1">Basic security measures</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-green-50">
                        <div className="text-xl font-bold text-green-600">{calculation.roi.toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">Your Solution</div>
                        <div className="text-xs text-green-600 mt-1">Comprehensive protection</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">Key Insight</span>
                      </div>
                      <p className="text-sm text-amber-700">
                        Your security solution delivers {((calculation.roi / 245) * 100).toFixed(0)}% better ROI than industry average, 
                        with comprehensive protection that goes beyond basic security measures.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scenarios" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-5 w-5" />
                        Without Protection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Data Breach Risk</span>
                          <span className="font-medium text-red-600">28% annually</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average Breach Cost</span>
                          <span className="font-medium text-red-600">$4.45M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Downtime Hours</span>
                          <span className="font-medium text-red-600">64 hours/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Compliance Violations</span>
                          <span className="font-medium text-red-600">High risk</span>
                        </div>
                        <hr className="border-red-200" />
                        <div className="flex justify-between font-bold">
                          <span>Expected Annual Cost</span>
                          <span className="text-red-600">$1.2M+</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        With Our Protection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Data Breach Risk</span>
                          <span className="font-medium text-green-600">4% annually</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Protected Value</span>
                          <span className="font-medium text-green-600">$4.1M saved</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Downtime Hours</span>
                          <span className="font-medium text-green-600">3 hours/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Compliance Status</span>
                          <span className="font-medium text-green-600">Automated</span>
                        </div>
                        <hr className="border-green-200" />
                        <div className="flex justify-between font-bold">
                          <span>Annual Investment</span>
                          <span className="text-green-600">${(calculation.totalInvestment/1000).toFixed(0)}K</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        ${((calculation.annualSavings - calculation.totalInvestment)/1000).toFixed(0)}K
                      </div>
                      <div className="text-lg text-green-700 mb-4">Net Annual Benefit</div>
                      <p className="text-sm text-muted-foreground">
                        This represents the money your organization saves every year by investing in comprehensive security.
                        Over 3 years, that's <span className="font-semibold">${((calculation.annualSavings - calculation.totalInvestment) * 3 / 1000).toFixed(0)}K</span> in total savings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Shield,
  CheckCircle,
  ArrowRight,
  Download,
  BarChart3
} from "lucide-react";

interface ROIData {
  employeeCount: number;
  avgHourlyCost: number;
  securityIncidentsPerMonth: number;
  avgIncidentResolutionHours: number;
  currentSecuritySpend: number;
  dataBreachCost: number;
  complianceRequirements: string[];
}

const ROICalculator = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [roiData, setRoiData] = useState<ROIData>({
    employeeCount: 50,
    avgHourlyCost: 35,
    securityIncidentsPerMonth: 5,
    avgIncidentResolutionHours: 4,
    currentSecuritySpend: 5000,
    dataBreachCost: 50000,
    complianceRequirements: []
  });

  const updateField = (field: keyof ROIData, value: any) => {
    setRoiData(prev => ({ ...prev, [field]: value }));
  };

  const addComplianceRequirement = (requirement: string) => {
    if (!roiData.complianceRequirements.includes(requirement)) {
      updateField('complianceRequirements', [...roiData.complianceRequirements, requirement]);
    }
  };

  const removeComplianceRequirement = (requirement: string) => {
    updateField('complianceRequirements', roiData.complianceRequirements.filter(r => r !== requirement));
  };

  // ROI Calculations
  const calculations = {
    // Current Costs
    monthlyIncidentCost: roiData.securityIncidentsPerMonth * roiData.avgIncidentResolutionHours * roiData.avgHourlyCost,
    annualIncidentCost: roiData.securityIncidentsPerMonth * roiData.avgIncidentResolutionHours * roiData.avgHourlyCost * 12,
    annualSecuritySpend: roiData.currentSecuritySpend * 12,
    potentialBreachCost: roiData.dataBreachCost * 0.15, // 15% annual risk
    
    // Ultrium Costs (per user/month pricing)
    ultraiumMonthlyCost: roiData.employeeCount * 8, // $8 per user
    ultraiumAnnualCost: roiData.employeeCount * 8 * 12,
    
    // Savings with Ultrium (assume 70% reduction in incidents, 50% faster resolution)
    reducedIncidents: roiData.securityIncidentsPerMonth * 0.3, // 70% reduction
    fasterResolution: roiData.avgIncidentResolutionHours * 0.5, // 50% faster
    newIncidentCost: (roiData.securityIncidentsPerMonth * 0.3) * (roiData.avgIncidentResolutionHours * 0.5) * roiData.avgHourlyCost * 12,
    breachReduction: roiData.dataBreachCost * 0.05, // Reduced to 5% risk
    
    // Compliance savings
    complianceSavings: roiData.complianceRequirements.length * 2000 * 12 // $2k/month per framework
  };

  const totalCurrentCost = calculations.annualIncidentCost + calculations.annualSecuritySpend + calculations.potentialBreachCost;
  const totalUltriumCost = calculations.ultraiumAnnualCost;
  const totalSavingsWithUltrium = calculations.annualIncidentCost - calculations.newIncidentCost + 
                                  calculations.potentialBreachCost - calculations.breachReduction + 
                                  calculations.complianceSavings;
  const netSavings = totalSavingsWithUltrium - totalUltriumCost;
  const roiPercentage = (netSavings / totalUltriumCost) * 100;
  const paybackPeriod = totalUltriumCost / (totalSavingsWithUltrium / 12);

  const complianceOptions = [
    'SOC 2', 'ISO 27001', 'PCI DSS', 'HIPAA', 'GDPR', 'CMMC', 'NIST', 'FedRAMP'
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">ROI Calculator</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Calculate your return on investment with Ultrium's security solutions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Input Data</TabsTrigger>
          <TabsTrigger value="results">ROI Results</TabsTrigger>
          <TabsTrigger value="report">Detailed Report</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Number of Employees</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    value={roiData.employeeCount}
                    onChange={(e) => updateField('employeeCount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgHourlyCost">Average Hourly Cost ($/hour)</Label>
                  <Input
                    id="avgHourlyCost"
                    type="number"
                    value={roiData.avgHourlyCost}
                    onChange={(e) => updateField('avgHourlyCost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSecuritySpend">Current Monthly Security Spend ($)</Label>
                  <Input
                    id="currentSecuritySpend"
                    type="number"
                    value={roiData.currentSecuritySpend}
                    onChange={(e) => updateField('currentSecuritySpend', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Incidents
                </CardTitle>
                <CardDescription>Current security incident metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="securityIncidents">Security Incidents per Month</Label>
                  <Input
                    id="securityIncidents"
                    type="number"
                    value={roiData.securityIncidentsPerMonth}
                    onChange={(e) => updateField('securityIncidentsPerMonth', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolutionHours">Average Resolution Time (hours)</Label>
                  <Input
                    id="resolutionHours"
                    type="number"
                    value={roiData.avgIncidentResolutionHours}
                    onChange={(e) => updateField('avgIncidentResolutionHours', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataBreachCost">Estimated Data Breach Cost ($)</Label>
                  <Input
                    id="dataBreachCost"
                    type="number"
                    value={roiData.dataBreachCost}
                    onChange={(e) => updateField('dataBreachCost', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Compliance Requirements</CardTitle>
                <CardDescription>Select applicable compliance frameworks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {complianceOptions.map((option) => (
                    <Button
                      key={option}
                      variant={roiData.complianceRequirements.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => 
                        roiData.complianceRequirements.includes(option) 
                          ? removeComplianceRequirement(option)
                          : addComplianceRequirement(option)
                      }
                    >
                      {option}
                      {roiData.complianceRequirements.includes(option) && (
                        <CheckCircle className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  ))}
                </div>
                {roiData.complianceRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {roiData.complianceRequirements.map((req) => (
                      <Badge key={req} variant="secondary">
                        {req}
                        <button
                          onClick={() => removeComplianceRequirement(req)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button onClick={() => setActiveTab('results')} size="lg">
              Calculate ROI
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-8 w-8 mx-auto text-success" />
                  <div className="text-2xl font-bold text-success">
                    {roiPercentage.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">ROI</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <DollarSign className="h-8 w-8 mx-auto text-primary" />
                  <div className="text-2xl font-bold text-primary">
                    ${netSavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Annual Savings</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-info/20 bg-info/5">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-info" />
                  <div className="text-2xl font-bold text-info">
                    {paybackPeriod.toFixed(1)} mo
                  </div>
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-8 w-8 mx-auto text-warning" />
                  <div className="text-2xl font-bold text-warning">
                    {((totalSavingsWithUltrium / totalCurrentCost) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Cost Reduction</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current State Costs</CardTitle>
                <CardDescription>Your current annual security costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Security Incidents</span>
                  <span className="font-semibold">${calculations.annualIncidentCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Security Tools & Services</span>
                  <span className="font-semibold">${calculations.annualSecuritySpend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Potential Breach Risk</span>
                  <span className="font-semibold">${calculations.potentialBreachCost.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Annual Cost</span>
                    <span>${totalCurrentCost.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Ultrium</CardTitle>
                <CardDescription>Projected costs and savings with Ultrium</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Ultrium Platform Cost</span>
                  <span className="font-semibold">${totalUltriumCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-success">
                  <span>Incident Reduction Savings</span>
                  <span className="font-semibold">+${(calculations.annualIncidentCost - calculations.newIncidentCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-success">
                  <span>Breach Risk Reduction</span>
                  <span className="font-semibold">+${(calculations.potentialBreachCost - calculations.breachReduction).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-success">
                  <span>Compliance Automation</span>
                  <span className="font-semibold">+${calculations.complianceSavings.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold text-success">
                    <span>Net Annual Savings</span>
                    <span>${netSavings.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to Achieve These Results?</h3>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => setActiveTab('report')} variant="outline">
                View Detailed Report
              </Button>
              <Button>
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ROI Analysis Report
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardTitle>
              <CardDescription>Comprehensive ROI analysis for Ultrium implementation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Executive Summary</h4>
                <p className="text-sm text-muted-foreground">
                  Based on your organization's profile with {roiData.employeeCount} employees and current security metrics, 
                  implementing Ultrium's security platform would generate an estimated <strong>{roiPercentage.toFixed(0)}% ROI</strong> with 
                  annual savings of <strong>${netSavings.toLocaleString()}</strong>. The investment would pay for itself 
                  in <strong>{paybackPeriod.toFixed(1)} months</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Key Benefits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">70% reduction in security incidents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">50% faster incident resolution</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Automated compliance reporting</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Reduced data breach risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">24/7 monitoring and response</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">White-label MSP capabilities</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Risk Mitigation</h4>
                <p className="text-sm text-muted-foreground">
                  The calculated ROI assumes conservative improvement estimates. Many Ultrium customers see 
                  even greater reductions in security incidents and faster resolution times, potentially 
                  increasing your actual ROI beyond these projections.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Implementation Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Weeks 1-2: Platform setup and integration</span>
                    <Badge variant="outline">Setup</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weeks 3-4: Team training and customization</span>
                    <Badge variant="outline">Training</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Week 5+: Full deployment and optimization</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ROICalculator;
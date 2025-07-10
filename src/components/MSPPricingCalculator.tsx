import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2,
  CheckCircle,
  ArrowRight,
  Target
} from "lucide-react";

interface ServiceOption {
  id: string;
  name: string;
  chargePrice: number;
  costPrice: number;
  unit: string;
  description: string;
}

const MSPPricingCalculator = () => {
  const [clients, setClients] = useState([50]);
  const [usersPerClient, setUsersPerClient] = useState([10]);
  const [selectedServices, setSelectedServices] = useState<string[]>(['safepass', 'safedoc']);

  const services: ServiceOption[] = [
    {
      id: 'safepass',
      name: 'SafePass Password Manager',
      chargePrice: 15,
      costPrice: 5,
      unit: 'user/month',
      description: 'White-label password management'
    },
    {
      id: 'safedoc', 
      name: 'SafeDoc Document Scanner',
      chargePrice: 12,
      costPrice: 4,
      unit: 'user/month',
      description: 'Document security scanning'
    },
    {
      id: 'safemail',
      name: 'SafeMail Email Security',
      chargePrice: 10,
      costPrice: 4,
      unit: 'user/month',
      description: 'Email threat protection'
    },
    {
      id: 'safenet',
      name: 'SafeNet Network Security',
      chargePrice: 40,
      costPrice: 15,
      unit: 'client/month',
      description: 'Network monitoring & scanning'
    },
    {
      id: 'safeweb',
      name: 'SafeWeb Dark Web Monitor',
      chargePrice: 30,
      costPrice: 10,
      unit: 'user/month',
      description: 'Dark web monitoring'
    },
    {
      id: 'rmm',
      name: 'Ultrium RMM',
      chargePrice: 45,
      costPrice: 15,
      unit: 'client/month',
      description: 'Remote monitoring & management'
    },
    {
      id: 'ticketing',
      name: 'Ultrium Helpdesk',
      chargePrice: 40,
      costPrice: 15,
      unit: 'user/month',
      description: 'AI-powered ticketing system'
    },
    {
      id: 'safeav',
      name: 'Ultrium SafeAV',
      chargePrice: 30,
      costPrice: 10,
      unit: 'endpoint/month',
      description: 'AI-powered endpoint protection'
    },
    {
      id: 'safemdr',
      name: 'Ultrium SafeMDR',
      chargePrice: 150,
      costPrice: 50,
      unit: 'client/month',
      description: '24/7 managed detection & response'
    }
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateRevenue = () => {
    const numClients = clients[0];
    const avgUsers = usersPerClient[0];
    
    let monthlyRevenue = 0;
    let monthlyCosts = 0;
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const isPerUser = service.unit.includes('user') || service.unit.includes('endpoint');
        const quantity = isPerUser ? numClients * avgUsers : numClients;
        
        monthlyRevenue += service.chargePrice * quantity;
        monthlyCosts += service.costPrice * quantity;
      }
    });

    const monthlyProfit = monthlyRevenue - monthlyCosts;
    const annualProfit = monthlyProfit * 12;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    return {
      monthlyRevenue,
      monthlyCosts,
      monthlyProfit,
      annualProfit,
      profitMargin
    };
  };

  const results = calculateRevenue();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">MSP Revenue Calculator</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Calculate your potential recurring revenue with Ultrium's white-label security solutions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Number of Clients: {clients[0]}</Label>
                <Slider
                  value={clients}
                  onValueChange={setClients}
                  max={500}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>500</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Average Users per Client: {usersPerClient[0]}</Label>
                <Slider
                  value={usersPerClient}
                  onValueChange={setUsersPerClient}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
              <CardDescription>Choose which Ultrium solutions to offer your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div 
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedServices.includes(service.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-border/80'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            ${service.chargePrice}/{service.unit}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ${service.chargePrice - service.costPrice} profit
                          </Badge>
                        </div>
                      </div>
                      {selectedServices.includes(service.id) && (
                        <CheckCircle className="h-5 w-5 text-primary mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card className="border-2 border-success/20 bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success-foreground">
                <TrendingUp className="h-5 w-5" />
                Revenue Projection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-success mb-2">
                  ${results.monthlyProfit.toLocaleString()}
                </div>
                <div className="text-muted-foreground">Monthly Profit</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${results.monthlyRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    ${results.monthlyCosts.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Costs</div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Profit Margin</span>
                  <span className="font-medium">{results.profitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Annual Profit</span>
                  <span className="font-bold text-success">
                    ${results.annualProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Growth Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Current Setup</span>
                <span className="font-medium">${results.monthlyProfit.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+50% more clients</span>
                <span className="font-medium text-success">
                  ${Math.round(results.monthlyProfit * 1.5).toLocaleString()}/mo
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+100% more clients</span>
                <span className="font-medium text-success">
                  ${Math.round(results.monthlyProfit * 2).toLocaleString()}/mo
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <h3 className="font-semibold">Ready to get started?</h3>
              <p className="text-sm text-muted-foreground">
                Connect with our team to discuss your MSP partnership
              </p>
              <Button className="w-full" variant="hero">
                Schedule Partnership Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MSPPricingCalculator;
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Building2, Users, Settings, CheckCircle, Globe, Phone, Mail, MapPin } from "lucide-react";

interface OnboardingData {
  // Company Info
  companyName: string;
  domain: string;
  industry: string;
  employeeCount: string;
  
  // Contact Info
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  billingContactName: string;
  billingContactEmail: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Services
  subscriptionTier: string;
  services: string[];
  specialRequirements: string;
  
  // Technical
  existingTools: string[];
  integrationNeeds: string[];
  complianceRequirements: string[];
}

const initialData: OnboardingData = {
  companyName: "",
  domain: "",
  industry: "",
  employeeCount: "",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  billingContactName: "",
  billingContactEmail: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  subscriptionTier: "",
  services: [],
  specialRequirements: "",
  existingTools: [],
  integrationNeeds: [],
  complianceRequirements: []
};

const industries = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", 
  "Education", "Legal", "Real Estate", "Construction", "Other"
];

const employeeCounts = [
  "1-10", "11-50", "51-100", "101-250", "251-500", "500+"
];

const subscriptionTiers = [
  { value: "starter", label: "Starter Plan", price: "$99/month" },
  { value: "professional", label: "Professional Plan", price: "$299/month" },
  { value: "enterprise", label: "Enterprise Plan", price: "$599/month" },
  { value: "custom", label: "Custom Plan", price: "Contact us" }
];

const availableServices = [
  "24/7 Security Monitoring", "Endpoint Protection", "Network Security", 
  "Backup & Recovery", "Patch Management", "Compliance Reporting",
  "Vulnerability Scanning", "Incident Response", "Security Training"
];

const tools = [
  "Microsoft 365", "Google Workspace", "Salesforce", "Slack", "Teams",
  "QuickBooks", "Xero", "Zoom", "DocuSign", "SharePoint"
];

const complianceFrameworks = [
  "SOC 2", "HIPAA", "PCI DSS", "GDPR", "ISO 27001", "NIST", "CMMC"
];

export const ClientOnboardingFlow = ({ onComplete }: { onComplete?: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const steps = [
    { title: "Company Information", icon: Building2, description: "Basic company details" },
    { title: "Contact Information", icon: Users, description: "Primary and billing contacts" },
    { title: "Service Configuration", icon: Settings, description: "Choose services and plan" },
    { title: "Review & Complete", icon: CheckCircle, description: "Confirm and create client" }
  ];

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    const currentArray = data[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateData(field, newArray);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(data.companyName && data.domain && data.industry && data.employeeCount);
      case 1:
        return !!(data.primaryContactName && data.primaryContactEmail && data.billingContactEmail);
      case 2:
        return !!(data.subscriptionTier && data.services.length > 0);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Please complete required fields",
        description: "All required fields must be filled before continuing.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Submit to Supabase MSP clients endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast({
        title: "Client onboarded successfully!",
        description: `${data.companyName} has been added to your client portfolio.`
      });
      
      onComplete?.();
    } catch (error) {
      toast({
        title: "Error creating client",
        description: "There was an issue creating the client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Client Onboarding</h1>
        <p className="text-gray-600">Welcome a new client to your MSP portfolio</p>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-primary border-primary text-white' :
                  'bg-gray-100 border-gray-300 text-gray-400'}
              `}>
                {isCompleted ? <CheckCircle className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 0: Company Information */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={data.companyName}
                    onChange={(e) => updateData('companyName', e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="domain">Company Domain *</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="domain"
                      value={data.domain}
                      onChange={(e) => updateData('domain', e.target.value)}
                      placeholder="acme.com"
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={data.industry} onValueChange={(value) => updateData('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employeeCount">Employee Count *</Label>
                  <Select value={data.employeeCount} onValueChange={(value) => updateData('employeeCount', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee count" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeCounts.map(count => (
                        <SelectItem key={count} value={count}>{count}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={data.address}
                    onChange={(e) => updateData('address', e.target.value)}
                    placeholder="123 Business St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={data.city}
                      onChange={(e) => updateData('city', e.target.value)}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={data.state}
                      onChange={(e) => updateData('state', e.target.value)}
                      placeholder="CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={data.zipCode}
                      onChange={(e) => updateData('zipCode', e.target.value)}
                      placeholder="94105"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={data.country}
                      onChange={(e) => updateData('country', e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Primary Contact
                </h3>
                
                <div>
                  <Label htmlFor="primaryContactName">Full Name *</Label>
                  <Input
                    id="primaryContactName"
                    value={data.primaryContactName}
                    onChange={(e) => updateData('primaryContactName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="primaryContactEmail">Email *</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="primaryContactEmail"
                      type="email"
                      value={data.primaryContactEmail}
                      onChange={(e) => updateData('primaryContactEmail', e.target.value)}
                      placeholder="john@acme.com"
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="primaryContactPhone">Phone</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="primaryContactPhone"
                      value={data.primaryContactPhone}
                      onChange={(e) => updateData('primaryContactPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Billing Contact
                </h3>
                
                <div>
                  <Label htmlFor="billingContactName">Full Name</Label>
                  <Input
                    id="billingContactName"
                    value={data.billingContactName}
                    onChange={(e) => updateData('billingContactName', e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="billingContactEmail">Email *</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="billingContactEmail"
                      type="email"
                      value={data.billingContactEmail}
                      onChange={(e) => updateData('billingContactEmail', e.target.value)}
                      placeholder="billing@acme.com"
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> If billing contact is the same as primary contact, 
                    you can leave billing fields empty.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Service Configuration */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plan *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {subscriptionTiers.map(tier => (
                    <Card 
                      key={tier.value}
                      className={`cursor-pointer transition-all ${
                        data.subscriptionTier === tier.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => updateData('subscriptionTier', tier.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-semibold text-gray-900">{tier.label}</h4>
                        <p className="text-sm text-primary font-medium">{tier.price}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Services *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableServices.map(service => (
                    <Button
                      key={service}
                      variant={data.services.includes(service) ? "default" : "outline"}
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => toggleArrayItem('services', service)}
                    >
                      <CheckCircle className={`h-4 w-4 mr-2 ${
                        data.services.includes(service) ? 'text-white' : 'text-gray-400'
                      }`} />
                      {service}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={data.specialRequirements}
                  onChange={(e) => updateData('specialRequirements', e.target.value)}
                  placeholder="Any specific security requirements, compliance needs, or custom configurations..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Existing Tools</h4>
                  <div className="space-y-2">
                    {tools.map(tool => (
                      <Badge
                        key={tool}
                        variant={data.existingTools.includes(tool) ? "default" : "outline"}
                        className="mr-2 mb-2 cursor-pointer"
                        onClick={() => toggleArrayItem('existingTools', tool)}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Compliance Requirements</h4>
                  <div className="space-y-2">
                    {complianceFrameworks.map(framework => (
                      <Badge
                        key={framework}
                        variant={data.complianceRequirements.includes(framework) ? "default" : "outline"}
                        className="mr-2 mb-2 cursor-pointer"
                        onClick={() => toggleArrayItem('complianceRequirements', framework)}
                      >
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Complete */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Name:</strong> {data.companyName}</div>
                    <div><strong>Domain:</strong> {data.domain}</div>
                    <div><strong>Industry:</strong> {data.industry}</div>
                    <div><strong>Employees:</strong> {data.employeeCount}</div>
                    {data.address && (
                      <div><strong>Address:</strong> {data.address}, {data.city}, {data.state} {data.zipCode}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Primary:</strong> {data.primaryContactName}</div>
                    <div><strong>Email:</strong> {data.primaryContactEmail}</div>
                    {data.primaryContactPhone && (
                      <div><strong>Phone:</strong> {data.primaryContactPhone}</div>
                    )}
                    {data.billingContactEmail && (
                      <div><strong>Billing:</strong> {data.billingContactEmail}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Service Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <strong>Plan:</strong> {subscriptionTiers.find(t => t.value === data.subscriptionTier)?.label}
                  </div>
                  <div>
                    <strong>Services:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.services.map(service => (
                        <Badge key={service} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </div>
                  {data.existingTools.length > 0 && (
                    <div>
                      <strong>Existing Tools:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.existingTools.map(tool => (
                          <Badge key={tool} variant="outline">{tool}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.complianceRequirements.length > 0 && (
                    <div>
                      <strong>Compliance:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.complianceRequirements.map(req => (
                          <Badge key={req} variant="outline">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={nextStep} className="flex items-center gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? "Creating Client..." : "Complete Onboarding"}
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
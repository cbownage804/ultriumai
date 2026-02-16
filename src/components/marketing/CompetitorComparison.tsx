import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ComparisonFeature {
  name: string;
  us: boolean | string;
  competitor1: boolean | string;
  competitor2?: boolean | string;
}

interface CompetitorComparisonProps {
  product: 'safesuite' | 'ai_studio' | 'vanguard';
}

const comparisons: Record<string, {
  title: string;
  subtitle: string;
  usName: string;
  competitors: string[];
  features: ComparisonFeature[];
  savings: string;
  ctaLink: string;
}> = {
  safesuite: {
    title: "SafeSuite vs Competitors",
    subtitle: "Enterprise security features at a fraction of the cost",
    usName: "SafeSuite Pro",
    competitors: ["1Password Business", "LastPass Teams"],
    features: [
      { name: "Price per user/month", us: "$9.99", competitor1: "$7.99", competitor2: "$4" },
      { name: "Password entries", us: "Unlimited", competitor1: "Unlimited", competitor2: "Unlimited" },
      { name: "Dark web monitoring", us: true, competitor1: true, competitor2: "$3 add-on" },
      { name: "Threat scanning (files/links)", us: true, competitor1: false, competitor2: false },
      { name: "Secure file storage", us: "1GB", competitor1: "1GB", competitor2: "1GB" },
      { name: "SSO integration", us: "Business+", competitor1: "$14.99/user", competitor2: "$6/user" },
      { name: "Admin audit logs", us: true, competitor1: true, competitor2: "Enterprise only" },
      { name: "Browser extension", us: true, competitor1: true, competitor2: true },
      { name: "Mobile apps", us: true, competitor1: true, competitor2: true },
      { name: "AI-powered threat intel", us: true, competitor1: false, competitor2: false },
    ],
    savings: "Save 40% vs 1Password with more security features",
    ctaLink: "/pricing/safesuite",
  },
  ai_studio: {
    title: "AI Studio vs Competitors",
    subtitle: "Build custom AI assistants without the complexity",
    usName: "UltriumGPT",
    competitors: ["ChatGPT Team", "Claude for Work"],
    features: [
      { name: "Starting price", us: "$59/team", competitor1: "$25/user", competitor2: "$25/user" },
      { name: "Custom AI training", us: true, competitor1: "Limited", competitor2: "Limited" },
      { name: "Knowledge base upload", us: true, competitor1: true, competitor2: true },
      { name: "White-label delivery", us: true, competitor1: false, competitor2: false },
      { name: "API access", us: true, competitor1: "Enterprise", competitor2: "Enterprise" },
      { name: "Voice AI agents", us: true, competitor1: false, competitor2: false },
      { name: "Custom actions/integrations", us: true, competitor1: "GPTs only", competitor2: false },
      { name: "Team collaboration", us: true, competitor1: true, competitor2: true },
      { name: "Usage analytics", us: true, competitor1: "Limited", competitor2: "Basic" },
      { name: "MSP multi-tenant", us: true, competitor1: false, competitor2: false },
    ],
    savings: "Unlimited users at flat rate vs per-seat pricing",
    ctaLink: "/pricing/ai-studio",
  },
  vanguard: {
    title: "Vanguard vs Competitors",
    subtitle: "Unified MSP platform with AI-powered security",
    usName: "Vanguard Suite",
    competitors: ["ConnectWise", "Datto RMM"],
    features: [
      { name: "RMM per endpoint/month", us: "$3", competitor1: "$4+", competitor2: "$3-5" },
      { name: "Helpdesk per agent/month", us: "$29", competitor1: "$55+", competitor2: "$50+" },
      { name: "Built-in SIEM", us: true, competitor1: "Add-on", competitor2: "Add-on" },
      { name: "AI threat detection", us: true, competitor1: "Limited", competitor2: false },
      { name: "Automated remediation", us: true, competitor1: "Basic", competitor2: "Basic" },
      { name: "Client portal", us: true, competitor1: true, competitor2: true },
      { name: "Dark web monitoring", us: true, competitor1: "Add-on", competitor2: "Add-on" },
      { name: "Asset management", us: true, competitor1: true, competitor2: true },
      { name: "Compliance reporting", us: true, competitor1: "Enterprise", competitor2: "Add-on" },
      { name: "White-label branding", us: true, competitor1: true, competitor2: true },
    ],
    savings: "Save 40-60% vs legacy RMM/PSA platforms",
    ctaLink: "/pricing/vanguard",
  },
};

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-emerald-500" />
    ) : (
      <X className="h-5 w-5 text-red-400" />
    );
  }
  return <span className="text-sm">{value}</span>;
};

export const CompetitorComparison = ({ product }: CompetitorComparisonProps) => {
  const data = comparisons[product];
  
  if (!data) return null;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{data.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{data.subtitle}</p>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b font-semibold text-sm">
              <div>Feature</div>
              <div className="text-center">
                <Badge className="bg-primary">{data.usName}</Badge>
              </div>
              <div className="text-center text-muted-foreground">{data.competitors[0]}</div>
              {data.competitors[1] && (
                <div className="text-center text-muted-foreground">{data.competitors[1]}</div>
              )}
            </div>
            
            {/* Feature Rows */}
            {data.features.map((feature, i) => (
              <div 
                key={i} 
                className={`grid grid-cols-4 gap-4 p-4 items-center ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
              >
                <div className="text-sm font-medium">{feature.name}</div>
                <div className="flex justify-center">
                  <FeatureValue value={feature.us} />
                </div>
                <div className="flex justify-center text-muted-foreground">
                  <FeatureValue value={feature.competitor1} />
                </div>
                {feature.competitor2 !== undefined && (
                  <div className="flex justify-center text-muted-foreground">
                    <FeatureValue value={feature.competitor2} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Savings Banner */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl text-center">
          <p className="text-lg font-semibold mb-4">{data.savings}</p>
          <Button asChild>
            <Link to={data.ctaLink}>
              View Pricing <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

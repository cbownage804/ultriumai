import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Star, ArrowRight, Crown, Shield } from "lucide-react";

interface ComparisonFeature {
  feature: string;
  ultrium: boolean | string;
  competitor1: boolean | string;
  competitor2: boolean | string;
  competitor3: boolean | string;
  category: 'core' | 'advanced' | 'pricing' | 'support';
}

const comparisonData: ComparisonFeature[] = [
  // Core Features
  { 
    feature: 'White-Label Customization', 
    ultrium: true, 
    competitor1: 'Limited', 
    competitor2: false, 
    competitor3: 'Paid Add-on',
    category: 'core'
  },
  { 
    feature: 'MSP Multi-Tenant Dashboard', 
    ultrium: true, 
    competitor1: true, 
    competitor2: false, 
    competitor3: true,
    category: 'core'
  },
  { 
    feature: 'Real-time Threat Detection', 
    ultrium: true, 
    competitor1: true, 
    competitor2: true, 
    competitor3: 'Delayed',
    category: 'core'
  },
  { 
    feature: 'API Integration', 
    ultrium: 'Full REST API', 
    competitor1: 'Limited', 
    competitor2: 'Basic', 
    competitor3: 'Full REST API',
    category: 'core'
  },
  
  // Advanced Features
  { 
    feature: 'AI-Powered Analysis', 
    ultrium: 'Advanced ML', 
    competitor1: 'Basic AI', 
    competitor2: false, 
    competitor3: 'Rule-based',
    category: 'advanced'
  },
  { 
    feature: 'Custom Domain Hosting', 
    ultrium: true, 
    competitor1: false, 
    competitor2: false, 
    competitor3: 'Enterprise Only',
    category: 'advanced'
  },
  { 
    feature: 'Webhook Notifications', 
    ultrium: true, 
    competitor1: 'Limited', 
    competitor2: false, 
    competitor3: true,
    category: 'advanced'
  },
  { 
    feature: 'Compliance Reporting', 
    ultrium: 'Automated', 
    competitor1: 'Manual', 
    competitor2: 'Basic', 
    competitor3: 'Automated',
    category: 'advanced'
  },
  
  // Pricing
  { 
    feature: 'Starting Price (per user/month)', 
    ultrium: '$5', 
    competitor1: '$12', 
    competitor2: '$8', 
    competitor3: '$15',
    category: 'pricing'
  },
  { 
    feature: 'Setup Fees', 
    ultrium: '$0', 
    competitor1: '$500', 
    competitor2: '$0', 
    competitor3: '$1,000',
    category: 'pricing'
  },
  { 
    feature: 'MSP Profit Margin', 
    ultrium: '60-70%', 
    competitor1: '40-50%', 
    competitor2: '30-40%', 
    competitor3: '50-60%',
    category: 'pricing'
  },
  
  // Support
  { 
    feature: '24/7 Technical Support', 
    ultrium: true, 
    competitor1: 'Business Hours', 
    competitor2: false, 
    competitor3: 'Paid Tier',
    category: 'support'
  },
  { 
    feature: 'Dedicated Success Manager', 
    ultrium: 'Standard', 
    competitor1: 'Enterprise Only', 
    competitor2: false, 
    competitor3: 'Enterprise Only',
    category: 'support'
  },
  { 
    feature: 'Implementation Support', 
    ultrium: 'Free', 
    competitor1: 'Paid Service', 
    competitor2: 'Self-Service', 
    competitor3: 'Paid Service',
    category: 'support'
  }
];

const CompetitorComparison = () => {
  const renderFeatureValue = (value: boolean | string, isUltrium = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className={`h-5 w-5 ${isUltrium ? 'text-success' : 'text-muted-foreground'}`} />
      ) : (
        <X className="h-5 w-5 text-destructive" />
      );
    }
    
    return (
      <span className={`text-sm font-medium ${
        isUltrium ? 'text-success' : 'text-foreground'
      }`}>
        {value}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Shield className="h-4 w-4" />;
      case 'advanced': return <Star className="h-4 w-4" />;
      case 'pricing': return <span className="text-xs font-bold">$</span>;
      case 'support': return <span className="text-xs font-bold">?</span>;
      default: return null;
    }
  };

  const groupedFeatures = comparisonData.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, ComparisonFeature[]>);

  const categoryTitles = {
    core: 'Core Features',
    advanced: 'Advanced Features', 
    pricing: 'Pricing & Value',
    support: 'Support & Service'
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">How Ultrium Compares</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why leading MSPs choose Ultrium over other security platforms
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="space-y-1">
                <CardTitle className="text-lg">Features</CardTitle>
                <CardDescription>Comparison Overview</CardDescription>
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                </div>
                <h3 className="font-bold text-primary">Ultrium</h3>
                <p className="text-sm text-muted-foreground">Complete Solution</p>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Competitor A</h3>
                <p className="text-sm text-muted-foreground">Enterprise Focus</p>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Competitor B</h3>
                <p className="text-sm text-muted-foreground">Budget Option</p>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Competitor C</h3>
                <p className="text-sm text-muted-foreground">Legacy Platform</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {Object.entries(groupedFeatures).map(([category, features]) => (
              <div key={category}>
                <div className="bg-muted/50 px-6 py-3 border-b">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h4 className="font-medium text-foreground">
                      {categoryTitles[category as keyof typeof categoryTitles]}
                    </h4>
                  </div>
                </div>
                
                {features.map((row, index) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-5 gap-4 items-center p-4 border-b hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium text-sm">{row.feature}</div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-full">
                        {renderFeatureValue(row.ultrium, true)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-full">
                        {renderFeatureValue(row.competitor1)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-full">
                        {renderFeatureValue(row.competitor2)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-full">
                        {renderFeatureValue(row.competitor3)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Differentiators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-success/20 bg-success/5">
            <CardHeader>
              <CardTitle className="text-success-foreground flex items-center gap-2">
                <Crown className="h-5 w-5" />
                True White-Label
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Complete brand control with custom domains, logos, and styling. Your clients never see the Ultrium name.
              </p>
              <Badge variant="outline" className="text-success border-success">
                Exclusive Feature
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary-foreground flex items-center gap-2">
                <Star className="h-5 w-5" />
                Higher Margins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Earn 60-70% profit margins vs. 30-50% with competitors. Better pricing means more revenue for MSPs.
              </p>
              <Badge variant="outline" className="text-primary border-primary">
                Best Value
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-info/20 bg-info/5">
            <CardHeader>
              <CardTitle className="text-info-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Machine learning-powered threat detection with lower false positives and faster response times.
              </p>
              <Badge variant="outline" className="text-info border-info">
                Next-Gen Technology
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center space-y-6">
          <h3 className="text-2xl font-bold">Ready to Switch to the Better Solution?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of MSPs who've already made the switch and are seeing better results, 
            higher margins, and happier clients.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="default">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Schedule Comparison Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitorComparison;
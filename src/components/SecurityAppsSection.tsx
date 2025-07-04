import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Link, Mail, FileText, Search, Check, Play, ArrowRight, Lock, Users, Star, Zap, ExternalLink, Network } from "lucide-react";

const SecurityAppsSection = () => {
  const securityApps = [
    {
      id: 'safeemail',
      name: 'Ultrium SafeEmail™',
      icon: Mail,
      description: 'AI-powered email analysis and threat detection',
      features: ['Real-time phishing detection', 'Malware scanning', 'Social engineering detection'],
      riskTypes: ['Phishing', 'Malware', 'BEC'],
      category: 'Email Security',
      demoUrl: '/demos/safeemail'
    },
    {
      id: 'safelink',
      name: 'Ultrium SafeLink™',
      icon: Link,
      description: 'Comprehensive URL analysis and safety verification',
      features: ['URL reputation analysis', 'Malware detection', 'SSL certificate validation'],
      riskTypes: ['Phishing', 'Malware', 'Suspicious Sites'],
      category: 'Link Security',
      demoUrl: '/demos/safelink'
    },
    {
      id: 'safedoc',
      name: 'Ultrium SafeDoc™',
      icon: FileText,
      description: 'Secure document storage and knowledge management',
      features: ['Secure document storage', 'Version control', 'Advanced search'],
      riskTypes: ['Malware', 'Data Leaks', 'Unauthorized Access'],
      category: 'Document Management',
      demoUrl: '/demos/safedoc'
    },
    {
      id: 'safescan',
      name: 'Ultrium SafeScan™',
      icon: Shield,
      description: 'Document analysis and content safety verification',
      features: ['Multi-format scanning', 'Macro analysis', 'Embedded threat detection'],
      riskTypes: ['Malware', 'Trojans', 'Macros'],
      category: 'Document Security',
      demoUrl: '/demos/safedoc'
    },
    {
      id: 'safepass',
      name: 'Ultrium SafePass™',
      icon: Lock,
      description: 'Enterprise password management and security platform',
      features: ['Secure password generation', 'Breach monitoring', 'Team sharing'],
      riskTypes: ['Weak Passwords', 'Breached Credentials', 'Policy Violations'],
      category: 'Password Security',
      demoUrl: '/demos/safepass'
    },
    {
      id: 'safeweb',
      name: 'Ultrium SafeWEB™',
      icon: Search,
      description: 'Dark web monitoring and threat intelligence platform',
      features: ['Credential monitoring', 'Data breach detection', 'Threat actor tracking'],
      riskTypes: ['Data Breaches', 'Credential Theft', 'Identity Theft'],
      category: 'Threat Intelligence',
      demoUrl: '/demos/safeweb'
    },
    {
      id: 'safecomp',
      name: 'Ultrium SafeComp™',
      icon: Users,
      description: 'Comprehensive compliance management and audit platform',
      features: ['Compliance monitoring', 'Audit automation', 'Risk assessment'],
      riskTypes: ['Compliance Violations', 'Audit Failures', 'Regulatory Risks'],
      category: 'Compliance Management',
      demoUrl: '/demos/safecomp'
    },
    {
      id: 'safenet',
      name: 'Ultrium SafeNet™',
      icon: Network,
      description: 'Advanced network discovery and topology mapping platform',
      features: ['Network topology mapping', 'Device discovery', 'Performance monitoring'],
      riskTypes: ['Network Vulnerabilities', 'Unauthorized Devices', 'Performance Issues'],
      category: 'Network Security',
      demoUrl: '/demos/safenet'
    }
  ];

  const pricingTiers = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '14 days',
      icon: Star,
      features: [
        'Access to all security apps',
        'Up to 100 scans per app',
        'Basic reporting',
        'Email support'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Premium',
      price: '$29',
      duration: 'per user/month',
      icon: Zap,
      features: [
        'Unlimited scans across all apps',
        'Advanced analytics & reporting',
        'Priority support',
        'API access',
        'Team collaboration tools'
      ],
      popular: true,
      cta: 'Start Premium'
    },
    {
      name: 'Enterprise',
      price: '$79',
      duration: 'per user/month',
      icon: Users,
      features: [
        'Everything in Premium',
        'White-label customization',
        'SSO & SAML integration',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const appBundles = [
    {
      name: 'Document & Password Bundle',
      apps: ['SafeDoc', 'SafePass'],
      originalPrice: '$58',
      bundlePrice: '$45',
      enterprisePrice: '$35',
      savings: '$13',
      enterpriseSavings: '$23'
    },
    {
      name: 'Email & Link Security Bundle',
      apps: ['SafeEmail', 'SafeScan', 'SafeLink'],
      originalPrice: '$87',
      bundlePrice: '$65',
      enterprisePrice: '$50',
      savings: '$22',
      enterpriseSavings: '$37'
    },
    {
      name: 'Network & Document Bundle',
      apps: ['SafeNet', 'SafeDoc', 'SafePass'],
      originalPrice: '$87',
      bundlePrice: '$65',
      enterprisePrice: '$50',
      savings: '$22',
      enterpriseSavings: '$37'
    },
    {
      name: 'Compliance & Intelligence Bundle',
      apps: ['SafeComp', 'SafeWEB'],
      originalPrice: '$58',
      bundlePrice: '$45',
      enterprisePrice: '$35',
      savings: '$13',
      enterpriseSavings: '$23'
    },
    {
      name: 'Complete Security Suite',
      apps: ['All 8 Apps'],
      originalPrice: '$232',
      bundlePrice: '$140',
      enterprisePrice: '$99',
      savings: '$92',
      enterpriseSavings: '$133'
    }
  ];

  return (
    <section id="security" className="py-20 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Shield className="h-4 w-4 mr-2" />
            AI-Powered Security Suite
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Ultrium Security Apps
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Enterprise-grade AI security tools that integrate seamlessly with your Custom GPTs. 
            Protect against cyber threats with real-time scanning and analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge className="bg-green-500 text-white">14-Day Free Trial</Badge>
            <Badge variant="outline">Monthly Billing Per User</Badge>
            <Badge variant="outline">Bundle Discounts Available</Badge>
          </div>
        </div>

        {/* Security Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityApps.map((app) => {
            const Icon = app.icon;
            return (
              <Card key={app.id} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-red-200">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <Icon className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="text-sm">{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      {app.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-2">Detects:</div>
                      <div className="flex flex-wrap gap-1">
                        {app.riskTypes.map((risk, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {/* Demo Button */}
                    <Button
                      onClick={() => window.location.href = app.demoUrl}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Try Live Demo
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pricing Tiers Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Choose Your Security Plan</h3>
            <p className="text-muted-foreground mb-8">Start with a free trial, then choose the plan that fits your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <Card key={index} className={`relative ${tier.popular ? 'border-primary border-2' : ''} hover:shadow-lg transition-all duration-300`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {tier.price}
                      <span className="text-sm font-normal text-muted-foreground">/{tier.duration}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* App Bundles Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-8 mb-12">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold mb-3">Save with App Bundles</h4>
              <p className="text-muted-foreground">Get multiple security apps together and save up to 57%</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {appBundles.map((bundle, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{bundle.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {bundle.apps.join(' + ')}
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4 space-y-2">
                      <div className="text-sm text-muted-foreground line-through">
                        {bundle.originalPrice}/month
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-primary">
                          Premium: {bundle.bundlePrice}/month
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          Save {bundle.savings}/month
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-orange-600">
                          Enterprise: {bundle.enterprisePrice}/month
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          Save {bundle.enterpriseSavings}/month
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        Get Premium Bundle
                      </Button>
                      <Button className="w-full" variant="secondary">
                        Get Enterprise Bundle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Secure Your Custom GPTs?</h3>
            <p className="text-muted-foreground mb-6">
              Add enterprise-grade security scanning to your AI agents. Protect your users from cyber threats with real-time analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    View All Security Apps
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Security Apps Access</DialogTitle>
                    <DialogDescription>
                      Sign up to access the full Security Apps marketplace with subscription options
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Security Apps are available in your dashboard after signing up. Choose from:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Individual apps starting at $29/user/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Bundle discounts save up to 57%
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        14-day free trial for all 8 apps
                      </li>
                    </ul>
                    <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                      Start Free Trial
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="lg">
                Schedule Demo Call
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityAppsSection;
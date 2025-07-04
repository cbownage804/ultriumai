import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Link, Mail, FileText, Search, Check, Play, ArrowRight, Lock, Users, Star, Zap, ExternalLink, Network } from "lucide-react";
import { useScrollAnimation, useStaggeredScrollAnimation } from "@/hooks/useScrollAnimation";

const SecurityAppsSection = () => {
  const headerAnimation = useScrollAnimation();
  const { ref: cardsRef, visibleItems: visibleCards } = useStaggeredScrollAnimation(8, 150);
  const pricingAnimation = useScrollAnimation();
  const bundlesAnimation = useScrollAnimation();

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
      price: '$20',
      duration: 'per user/month per app',
      icon: Zap,
      features: [
        'Up to 1,000 scans per app per month',
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
      price: '$35',
      duration: 'per user/month per app',
      icon: Users,
      features: [
        'Unlimited scans across all apps',
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
      originalPrice: '$40',
      bundlePrice: '$35',
      enterprisePrice: '$62',
      savings: '$5',
      enterpriseSavings: '$22'
    },
    {
      name: 'Email & Link Security Bundle',
      apps: ['SafeEmail', 'SafeScan', 'SafeLink'],
      originalPrice: '$60',
      bundlePrice: '$53',
      enterprisePrice: '$92',
      savings: '$7',
      enterpriseSavings: '$32'
    },
    {
      name: 'Network & Document Bundle',
      apps: ['SafeNet', 'SafeDoc', 'SafePass'],
      originalPrice: '$60',
      bundlePrice: '$53',
      enterprisePrice: '$92',
      savings: '$7',
      enterpriseSavings: '$32'
    },
    {
      name: 'Compliance & Intelligence Bundle',
      apps: ['SafeComp', 'SafeWEB'],
      originalPrice: '$40',
      bundlePrice: '$35',
      enterprisePrice: '$62',
      savings: '$5',
      enterpriseSavings: '$22'
    },
    {
      name: 'Complete Security Suite',
      apps: ['All 8 Apps'],
      originalPrice: '$160',
      bundlePrice: '$141',
      enterprisePrice: '$246',
      savings: '$19',
      enterpriseSavings: '$86'
    }
  ];

  return (
    <section id="security" className="py-20 bg-gradient-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={headerAnimation.ref}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <Badge variant="secondary" className="mb-4 animate-pulse-glow">
            <Shield className="h-4 w-4 mr-2 animate-bounce-gentle" />
            AI-Powered Security Suite
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-foreground animate-fade-in-up">
            Ultrium Security Apps
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in-up delay-200">
            Enterprise-grade AI security tools that integrate seamlessly with your Custom GPTs. 
            Protect against cyber threats with real-time scanning and analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8 animate-fade-in-up delay-400">
            <Badge className="bg-success text-success-foreground">14-Day Free Trial</Badge>
            <Badge variant="outline">Monthly Billing Per User</Badge>
            <Badge variant="outline">Bundle Discounts Available</Badge>
          </div>
        </div>

        {/* Security Apps Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityApps.map((app, index) => {
            const Icon = app.icon;
            return (
              <Card 
                key={app.id} 
                className={`hover:shadow-lg transition-all duration-500 border-2 hover:border-primary/20 card-elevated animate-scale-on-hover transform-gpu ${
                  visibleCards[index] 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                }`}
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  transform: visibleCards[index] ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'
                }}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center animate-float">
                    <Icon className="h-8 w-8 text-primary animate-glow" />
                  </div>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="text-sm">{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      {app.features.slice(0, 3).map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm animate-fade-in" style={{ animationDelay: `${(index * 150) + (featureIndex * 50)}ms` }}>
                          <Check className="h-3 w-3 text-success animate-pulse" />
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
                      className="w-full mt-4 btn-glow hover:scale-105 transition-all duration-300"
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
        <div 
          ref={pricingAnimation.ref}
          className={`mb-16 transition-all duration-1000 ${
            pricingAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 animate-fade-in-up">Choose Your Security Plan</h3>
            <p className="text-muted-foreground mb-8 animate-fade-in-up delay-200">Start with a free trial, then choose the plan that fits your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <Card 
                  key={index} 
                  className={`relative ${tier.popular ? 'border-primary border-2 animate-pulse-glow' : ''} hover:shadow-lg transition-all duration-500 card-elevated animate-scale-on-hover ${
                    pricingAnimation.isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 200}ms`
                  }}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
                      <Badge className="bg-primary text-primary-foreground animate-glow">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center animate-float">
                      <Icon className="h-6 w-6 text-primary animate-pulse" />
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
                          <Check className="h-4 w-4 text-success flex-shrink-0" />
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
          <div 
            ref={bundlesAnimation.ref}
            className={`bg-gradient-secondary rounded-lg p-8 mb-12 card-elevated transition-all duration-1000 ${
              bundlesAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold mb-3 animate-fade-in-up">Save with App Bundles</h4>
              <p className="text-muted-foreground animate-fade-in-up delay-200">Get multiple security apps together and save up to 35%</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {appBundles.map((bundle, index) => (
                <Card 
                  key={index} 
                  className={`hover:shadow-lg transition-all duration-500 card-elevated animate-scale-on-hover ${
                    bundlesAnimation.isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 150}ms`
                  }}
                >
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
                        <div className="text-sm text-success font-medium">
                          Save {bundle.savings}/month
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-warning">
                          Enterprise: {bundle.enterprisePrice}/month
                        </div>
                        <div className="text-sm text-success font-medium">
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
          <div className="bg-card rounded-lg p-8 shadow-lg max-w-2xl mx-auto card-elevated animate-scale-on-hover">
            <h3 className="text-2xl font-bold mb-4 animate-fade-in-up">Ready to Secure Your Custom GPTs?</h3>
            <p className="text-muted-foreground mb-6 animate-fade-in-up delay-200">
              Add enterprise-grade security scanning to your AI agents. Protect your users from cyber threats with real-time analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex items-center gap-2 btn-glow animate-pulse-glow">
                    <Shield className="h-5 w-5 animate-bounce-gentle" />
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
                        <Check className="h-4 w-4 text-success" />
                        Individual apps starting at $20/user/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        Bundle discounts save up to 35%
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        14-day free trial for all 8 apps
                      </li>
                    </ul>
                    <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                      Start Free Trial
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="lg" className="animate-scale-on-hover">
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
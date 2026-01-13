import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Target, Eye, FileCheck, Database, Globe, Brain, 
  ArrowRight, Check, Zap, Lock, AlertTriangle, Network,
  BarChart3, Users, Clock, Award
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Threat Detection',
    description: 'AI-powered real-time threat detection with behavioral analysis and anomaly detection',
    capabilities: ['EDR/XDR capabilities', 'Behavioral analytics', 'Zero-day detection', 'Automated containment']
  },
  {
    icon: Eye,
    title: 'SOC Operations',
    description: '24/7 security operations center with AI-assisted triage and response',
    capabilities: ['Alert correlation', 'Case management', 'MITRE ATT&CK mapping', 'Automated playbooks']
  },
  {
    icon: Shield,
    title: 'Penetration Testing',
    description: 'Continuous automated vulnerability assessment and penetration testing',
    capabilities: ['Network scanning', 'Web app testing', 'Credential testing', 'Compliance validation']
  },
  {
    icon: Database,
    title: 'SIEM Dashboard',
    description: 'Centralized log aggregation with advanced threat correlation',
    capabilities: ['Multi-source ingestion', 'Real-time correlation', 'Custom detection rules', 'Compliance reporting']
  },
  {
    icon: Globe,
    title: 'Threat Intelligence',
    description: 'Real-time threat feeds from VirusTotal, AbuseIPDB, and proprietary sources',
    capabilities: ['IOC lookup', 'Reputation scoring', 'Dark web monitoring', 'Breach detection']
  },
  {
    icon: Brain,
    title: 'User Behavior Analytics',
    description: 'Detect insider threats and compromised accounts with ML-powered analytics',
    capabilities: ['Baseline profiling', 'Anomaly detection', 'Risk scoring', 'Automated alerts']
  }
];

const stats = [
  { label: 'Threats Blocked', value: '2M+', icon: Shield },
  { label: 'Avg Response Time', value: '<5min', icon: Clock },
  { label: 'Organizations Protected', value: '500+', icon: Users },
  { label: 'Compliance Frameworks', value: '15+', icon: Award }
];

const pricing = [
  {
    name: 'Security Essentials',
    price: 15,
    description: 'Core protection for small teams',
    features: ['Threat detection', 'Basic SIEM', 'Email support', 'Up to 50 endpoints'],
    cta: 'Start Free Trial'
  },
  {
    name: 'Security Professional',
    price: 35,
    description: 'Advanced protection with SOC capabilities',
    features: ['Everything in Essentials', 'SOC operations', 'Pen testing', 'Threat intelligence', 'Up to 250 endpoints'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise Security',
    price: null,
    description: 'Full platform with dedicated support',
    features: ['Everything in Professional', 'UBA', 'Dark web monitoring', 'Custom integrations', 'Unlimited endpoints', 'Dedicated CSM'],
    cta: 'Contact Sales'
  }
];

export default function SecuritySuitePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <Badge className="mb-4 bg-red-500/10 text-red-500 border-red-500/20">
            <Shield className="h-3 w-3 mr-1" />
            Security Suite
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl">
            Enterprise-Grade Security Operations Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Unified XDR, SOC, SIEM, and threat intelligence—powered by AI. 
            Detect, investigate, and respond to threats in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Security Operations</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to protect your organization from modern threats
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.capabilities.map((cap, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Per-endpoint pricing. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? 'border-red-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-red-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/endpoint/mo</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">Custom Pricing</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.price ? '/vanguard/auth' : '/contact'} className="block">
                    <Button className={`w-full ${plan.popular ? 'bg-red-500 hover:bg-red-600' : ''}`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Organization?</h2>
          <p className="text-muted-foreground mb-8">
            Start your free 14-day trial. No credit card required.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/vanguard/suite">
              <Button size="lg" variant="outline">
                View Full Suite
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
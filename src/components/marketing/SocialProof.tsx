import { Badge } from "@/components/ui/badge";
import { Shield, Users, Building2, Award, CheckCircle2 } from "lucide-react";

interface SocialProofProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const SocialProof = ({ variant = 'compact', className = '' }: SocialProofProps) => {
  const stats = [
    { icon: Users, value: '500+', label: 'Active Users' },
    { icon: Building2, value: '50+', label: 'Businesses Protected' },
    { icon: Shield, value: '99.9%', label: 'Uptime SLA' },
    { icon: Award, value: 'SOC 2', label: 'Compliant' },
  ];

  const trustBadges = [
    'End-to-End Encrypted',
    'GDPR Compliant',
    'SOC 2 Type II',
    '24/7 Monitoring',
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
        {trustBadges.map((badge, i) => (
          <Badge key={i} variant="secondary" className="px-3 py-1 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1.5 text-emerald-500" />
            {badge}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={`py-12 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-3">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {trustBadges.map((badge, i) => (
            <Badge key={i} variant="outline" className="px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TrustedByLogos = ({ className = '' }: { className?: string }) => {
  // Placeholder for "As seen in" / "Trusted by" logos
  const companies = [
    'TechCrunch',
    'Forbes',
    'Inc. 500',
    'Gartner',
    'G2 Crowd',
  ];

  return (
    <div className={`py-8 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Trusted by security-conscious teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
          {companies.map((company, i) => (
            <div 
              key={i} 
              className="text-lg font-semibold text-muted-foreground/70"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const UserCountBadge = ({ className = '' }: { className?: string }) => {
  return (
    <Badge 
      variant="secondary" 
      className={`px-4 py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 ${className}`}
    >
      <Users className="h-4 w-4 mr-2" />
      Join 500+ businesses using UltriumAI
    </Badge>
  );
};

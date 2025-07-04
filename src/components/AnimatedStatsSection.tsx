import { useState, useEffect, useRef } from "react";
import { Shield, Users, Zap, CheckCircle, TrendingUp, Globe } from "lucide-react";

interface StatItem {
  icon: React.ComponentType<any>;
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
  description: string;
}

const statsData: StatItem[] = [
  {
    icon: Shield,
    value: 2500000,
    suffix: "+",
    label: "Threats Blocked",
    description: "Malicious threats detected and neutralized"
  },
  {
    icon: Users,
    value: 15000,
    suffix: "+",
    label: "Active Users",
    description: "Businesses trust UltriumAI for security"
  },
  {
    icon: Zap,
    value: 99.8,
    suffix: "%",
    label: "Accuracy Rate",
    description: "Precision in threat detection"
  },
  {
    icon: CheckCircle,
    value: 50000000,
    suffix: "+",
    label: "Scans Performed",
    description: "Security analyses completed"
  },
  {
    icon: TrendingUp,
    value: 24,
    suffix: "/7",
    label: "Monitoring",
    description: "Round-the-clock protection"
  },
  {
    icon: Globe,
    value: 150,
    suffix: "+",
    label: "Countries Served",
    description: "Global security coverage"
  }
];

const useCountAnimation = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = start;
    const totalChange = end - start;

    const updateCount = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (totalChange * easeOut);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    const timer = setTimeout(() => {
      updateCount();
    }, 100); // Small delay for better visual effect

    return () => clearTimeout(timer);
  }, [isVisible, end, duration, start]);

  return { count, elementRef };
};

const formatNumber = (num: number, suffix: string): string => {
  if (suffix === "%") {
    return num.toFixed(1);
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  
  return Math.floor(num).toLocaleString();
};

const StatCard = ({ stat, index }: { stat: StatItem; index: number }) => {
  const { count, elementRef } = useCountAnimation(stat.value, 2500 + index * 200);
  const Icon = stat.icon;

  return (
    <div 
      ref={elementRef}
      className="group relative p-6 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg"
      style={{
        animationDelay: `${index * 150}ms`
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        {/* Value */}
        <div className="space-y-1 mb-3">
          <div className="text-3xl md:text-4xl font-bold text-foreground">
            {stat.prefix}{formatNumber(count, stat.suffix)}{stat.suffix}
          </div>
          <div className="text-sm font-medium text-primary">
            {stat.label}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {stat.description}
        </p>

        {/* Animated underline */}
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </div>
  );
};

const AnimatedStatsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-4">
            Trusted by Thousands Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered security platform delivers real results for businesses of all sizes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {statsData.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-muted-foreground mb-6">
            Join thousands of organizations protecting their digital assets with UltriumAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 hover:transform hover:scale-105">
              Start Free Trial
            </button>
            <button className="px-8 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors duration-200">
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedStatsSection;
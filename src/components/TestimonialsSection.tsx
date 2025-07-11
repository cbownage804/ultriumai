import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Building2, Users, TrendingUp } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  companySize: string;
  industry: string;
  quote: string;
  rating: number;
  results: {
    metric: string;
    value: string;
    improvement: string;
  }[];
  avatar?: string;
  verified: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Michael Rodriguez',
    title: 'IT Director',
    company: 'TechFlow Solutions',
    companySize: '150+ employees',
    industry: 'MSP',
    quote: "Ultrium's white-label solutions have transformed our security offerings. We've increased our recurring revenue by 40% in just 6 months, and our clients love the seamless integration.",
    rating: 5,
    results: [
      { metric: 'Revenue Increase', value: '40%', improvement: '+$15K/month' },
      { metric: 'Client Satisfaction', value: '96%', improvement: '+12%' },
      { metric: 'Deployment Time', value: '85%', improvement: 'faster' }
    ],
    verified: true
  },
  {
    id: '2',
    name: 'Sarah Chen',
    title: 'CEO',
    company: 'SecureNet MSP',
    companySize: '50+ employees',
    industry: 'Cybersecurity',
    quote: "The SafeDoc scanner has been a game-changer for our document security services. Our clients trust us more, and we've prevented several major incidents. The ROI is incredible.",
    rating: 5,
    results: [
      { metric: 'Threats Blocked', value: '2,400+', improvement: 'per month' },
      { metric: 'False Positives', value: '<1%', improvement: 'accuracy' },
      { metric: 'Client Retention', value: '98%', improvement: '+8%' }
    ],
    verified: true
  },
  {
    id: '3',
    name: 'David Park',
    title: 'Managed Services Manager',
    company: 'CloudTech Partners',
    companySize: '300+ employees',
    industry: 'Cloud Services',
    quote: "Ultrium's RMM platform has streamlined our operations significantly. We can now manage 3x more devices with the same team, and our response times have improved dramatically.",
    rating: 5,
    results: [
      { metric: 'Device Management', value: '3x', improvement: 'more devices' },
      { metric: 'Response Time', value: '75%', improvement: 'faster' },
      { metric: 'Operational Efficiency', value: '60%', improvement: 'increase' }
    ],
    verified: true
  },
  {
    id: '4',
    name: 'Jennifer Walsh',
    title: 'Security Operations Lead',
    company: 'Enterprise Shield',
    companySize: '75+ employees',
    industry: 'Cybersecurity',
    quote: "The SafeMDR service from Ultrium provides 24/7 coverage our team couldn't offer alone. Their expert analysts have caught threats we would have missed, protecting our clients' critical data.",
    rating: 5,
    results: [
      { metric: 'Threat Detection', value: '99.8%', improvement: 'accuracy' },
      { metric: 'Response Time', value: '<15min', improvement: 'average' },
      { metric: 'Client Satisfaction', value: '94%', improvement: '+18%' }
    ],
    verified: true
  },
  {
    id: '5',
    name: 'Robert Kim',
    title: 'CTO',
    company: 'InnovateTech',
    companySize: '200+ employees',
    industry: 'Technology',
    quote: "SafePass has solved our password management challenges across all client organizations. The white-label customization is perfect - our clients see our brand, not a third party.",
    rating: 5,
    results: [
      { metric: 'Password Compliance', value: '95%', improvement: '+45%' },
      { metric: 'Security Incidents', value: '70%', improvement: 'reduction' },
      { metric: 'User Adoption', value: '89%', improvement: 'rate' }
    ],
    verified: true
  },
  {
    id: '6',
    name: 'Amanda Foster',
    title: 'VP of Operations',
    company: 'ReliableTech MSP',
    companySize: '120+ employees',
    industry: 'Managed Services',
    quote: "SafeDesk has revolutionized our ticketing operations. AI-powered automation handles 60% of routine tickets, freeing our team to focus on complex issues.",
    rating: 5,
    results: [
      { metric: 'Ticket Automation', value: '60%', improvement: 'handled by AI' },
      { metric: 'Resolution Time', value: '50%', improvement: 'faster' },
      { metric: 'Customer Satisfaction', value: '4.8/5', improvement: 'rating' }
    ],
    verified: true
  }
];

const TestimonialsSection = () => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Trusted by Leading MSPs</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how managed service providers are growing their business with Ultrium's solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                  {testimonial.verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Company Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{testimonial.company}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {testimonial.companySize}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {testimonial.industry}
                    </Badge>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(testimonial.rating)}</div>
                  <span className="text-sm text-muted-foreground">
                    {testimonial.rating}/5
                  </span>
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="h-6 w-6 text-primary/20 absolute -top-2 -left-1" />
                  <p className="text-sm leading-relaxed pl-5 italic">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Results */}
                <div className="space-y-3 pt-4 border-t">
                  <h5 className="font-medium text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Key Results
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {testimonial.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{result.metric}:</span>
                        <div className="text-right">
                          <span className="font-semibold text-success">{result.value}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {result.improvement}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">MSP Partners</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">99.8%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-info">24/7</div>
              <div className="text-sm text-muted-foreground">Expert Support</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-warning">4.9/5</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
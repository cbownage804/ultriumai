import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  content: string;
  rating: number;
  product?: 'safesuite' | 'ai_studio' | 'vanguard' | 'general';
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Michael C.',
    role: 'IT Director',
    company: 'Manufacturing Company',
    content: "SafeSuite replaced three different security tools for us. The dark web monitoring caught a credential leak before it became an incident. Worth every penny.",
    rating: 5,
    product: 'safesuite',
  },
  {
    id: '2',
    name: 'Sarah R.',
    role: 'MSP Owner',
    company: 'Managed Services Provider',
    content: "Vanguard's unified dashboard finally gave us visibility across all our clients. The AI threat detection is surprisingly accurate - caught two ransomware attempts last month.",
    rating: 5,
    product: 'vanguard',
  },
  {
    id: '3',
    name: 'David P.',
    role: 'Operations Manager',
    company: 'Technology Firm',
    content: "We built a custom AI assistant for our sales team in under an hour. It knows our entire product catalog and pricing. Game changer for quote generation.",
    rating: 5,
    product: 'ai_studio',
  },
  {
    id: '4',
    name: 'Jennifer W.',
    role: 'CEO',
    company: 'Consulting Firm',
    content: "Finally, enterprise security without enterprise pricing. Our team actually uses SafePass daily - the browser extension is seamless.",
    rating: 5,
    product: 'safesuite',
  },
  {
    id: '5',
    name: 'Robert K.',
    role: 'CTO',
    company: 'Tech Startup',
    content: "The AI Studio lets us offer custom AI solutions to clients without hiring ML engineers. White-label delivery is exactly what our MSP needed.",
    rating: 5,
    product: 'ai_studio',
  },
  {
    id: '6',
    name: 'Amanda T.',
    role: 'Security Manager',
    company: 'Healthcare Organization',
    content: "Switched from 1Password to SafePass. Better team features, better price, and the threat scanning is a bonus we didn't expect.",
    rating: 5,
    product: 'safesuite',
  },
];

interface TestimonialsProps {
  product?: 'safesuite' | 'ai_studio' | 'vanguard' | 'general';
  maxItems?: number;
  title?: string;
  subtitle?: string;
}

export const Testimonials = ({ 
  product, 
  maxItems = 3,
  title = "Trusted by Security-Conscious Teams",
  subtitle = "See what our customers are saying"
}: TestimonialsProps) => {
  const filteredTestimonials = product 
    ? testimonials.filter(t => t.product === product || t.product === 'general')
    : testimonials;
  
  const displayTestimonials = filteredTestimonials.slice(0, maxItems);

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

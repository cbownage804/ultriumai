import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Headphones, BookOpen, ShoppingCart, Shield, 
  Wrench, FileText, Users, Brain, Bot, Sparkles, Code2 
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface UseCase {
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  color: string;
  tools: string[];
  result: string;
}

const useCases: UseCase[] = [
  {
    title: 'Customer Support Bot',
    description: 'Train a GPT on your knowledge base, FAQs, and product docs. Deploy as a chat widget on your site for 24/7 automated support.',
    icon: Headphones,
    category: 'Support',
    color: 'text-emerald-400',
    tools: ['GPT Builder', 'Knowledge Upload'],
    result: '70% ticket deflection',
  },
  {
    title: 'Internal Knowledge Base',
    description: 'Upload SOPs, runbooks, and documentation. Let your team ask questions in natural language and get instant answers.',
    icon: BookOpen,
    category: 'Operations',
    color: 'text-blue-400',
    tools: ['GPT Builder', 'RAG'],
    result: '5x faster onboarding',
  },
  {
    title: 'Sales & Lead Qualifier',
    description: 'Build an AI assistant that qualifies leads, answers product questions, and schedules demos automatically.',
    icon: ShoppingCart,
    category: 'Sales',
    color: 'text-amber-400',
    tools: ['GPT Builder', 'Actions'],
    result: '3x lead conversion',
  },
  {
    title: 'Security Policy Advisor',
    description: 'Create a GPT trained on your security policies, compliance frameworks, and incident playbooks for your team.',
    icon: Shield,
    category: 'Security',
    color: 'text-red-400',
    tools: ['GPT Builder', 'SafeSuite Integration'],
    result: 'Instant policy answers',
  },
  {
    title: 'IT Helpdesk Automator',
    description: 'Auto-triage tickets, suggest solutions from past resolutions, and escalate intelligently using AI agents.',
    icon: Wrench,
    category: 'IT',
    color: 'text-cyan-400',
    tools: ['AI Agents', 'Vanguard Integration'],
    result: '50% faster resolution',
  },
  {
    title: 'Document Analyzer',
    description: 'Upload contracts, reports, or compliance docs. AI extracts key information, flags risks, and generates summaries.',
    icon: FileText,
    category: 'Legal',
    color: 'text-violet-400',
    tools: ['GPT Builder', 'Document Processing'],
    result: '10x review speed',
  },
  {
    title: 'HR Onboarding Assistant',
    description: 'Guide new hires through policies, benefits, and procedures with a conversational AI trained on your HR docs.',
    icon: Users,
    category: 'HR',
    color: 'text-pink-400',
    tools: ['GPT Builder', 'Knowledge Upload'],
    result: 'Self-service onboarding',
  },
  {
    title: 'Custom SaaS App',
    description: 'Use App Builder to generate a full-stack web application with database, auth, and AI features — all from a prompt.',
    icon: Code2,
    category: 'Development',
    color: 'text-primary',
    tools: ['App Builder', 'Supabase', 'Stripe'],
    result: 'Ship in hours, not months',
  },
];

const categories = ['All', ...Array.from(new Set(useCases.map(uc => uc.category)))];

export default function AIStudioUseCases() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <Badge className="bg-primary/10 text-primary border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Use Case Gallery
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">
            What Will <span className="text-primary">You</span> Build?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore real-world use cases and templates. Each one can be customized and deployed in minutes with AI Studio.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <Card key={uc.title} className="group border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl bg-muted/50 ${uc.color}`}>
                      <uc.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{uc.category}</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground">{uc.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uc.tools.map((tool) => (
                      <span key={tool} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {tool}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="text-xs text-muted-foreground font-medium">{uc.result}</span>
                    <Link to="/ai-studio">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary">
                        Try It <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent border-t border-primary/10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Build Your AI Solution?</h2>
          <p className="text-muted-foreground">Start with a template or build from scratch. No code required.</p>
          <div className="flex justify-center gap-4">
            <Link to="/ai-studio">
              <Button size="lg" className="bg-gradient-to-r from-primary to-violet-500">
                <Bot className="mr-2 h-5 w-5" />
                Open AI Studio
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">Talk to Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Bot, Zap, Code2 } from 'lucide-react';
import aiStudioLogo from '@/assets/ai-studio-logo.png';

interface CrossProductUpsellProps {
  /** Context product the user is currently viewing */
  context: 'vanguard' | 'safesuite' | 'general';
  /** Compact mode for sidebars / smaller placements */
  compact?: boolean;
}

const contextMessages: Record<string, { headline: string; body: string; features: string[] }> = {
  vanguard: {
    headline: 'Supercharge Vanguard with AI Studio',
    body: 'Build custom GPTs trained on your SOPs, runbooks, and ticket history. Automate L1 responses and get AI-powered incident summaries.',
    features: ['Ticket Auto-Triage GPT', 'Runbook Assistant', 'Client-Facing Chat Bot'],
  },
  safesuite: {
    headline: 'Add AI Power to SafeSuite',
    body: 'Create AI assistants that help your team identify threats faster, train employees on security, and automate breach response.',
    features: ['Phishing Coach GPT', 'Security Policy Bot', 'Breach Response Helper'],
  },
  general: {
    headline: 'Build Custom AI in Minutes',
    body: 'AI Studio lets you create GPTs, full-stack apps, and autonomous agents—no code required.',
    features: ['Custom GPT Builder', 'AI App Builder', 'Autonomous Agents'],
  },
};

export function CrossProductUpsell({ context, compact = false }: CrossProductUpsellProps) {
  const msg = contextMessages[context];
  const icons = [Bot, Zap, Code2];

  if (compact) {
    return (
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
              <img src={aiStudioLogo} alt="AI Studio" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-primary">AI Studio</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">New</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{msg.body}</p>
          <Link to="/ai-studio-platform">
            <Button size="sm" variant="outline" className="w-full text-xs border-primary/30 hover:bg-primary/10">
              Explore AI Studio <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5 border-y border-primary/10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Left — Messaging */}
          <div className="flex-1 space-y-4">
            <Badge className="bg-primary/10 text-primary border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI Studio
            </Badge>
            <h3 className="text-2xl font-bold">{msg.headline}</h3>
            <p className="text-muted-foreground">{msg.body}</p>
            <div className="flex flex-wrap gap-3">
              {msg.features.map((f, i) => {
                const Icon = icons[i];
                return (
                  <div key={f} className="flex items-center gap-1.5 text-sm text-foreground/80 bg-muted/50 rounded-full px-3 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {f}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <Link to="/ai-studio-platform">
                <Button className="bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-400">
                  Try AI Studio Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/ai-studio">
                <Button variant="outline">Explore AI Studio</Button>
              </Link>
            </div>
          </div>

          {/* Right — Visual */}
          <div className="w-full md:w-72 shrink-0">
            <Card className="border-primary/20 bg-background/80 backdrop-blur">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-black p-1.5 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                    <img src={aiStudioLogo} alt="AI Studio" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">AI Studio™</div>
                    <div className="text-xs text-muted-foreground">Build • Deploy • Scale</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {['GPT Builder', 'App Builder', 'AI Agents', 'Studio Assistant'].map((tool) => (
                    <div key={tool} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {tool}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-center text-muted-foreground pt-1 border-t border-border/30">
                  Free tier available • No credit card
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

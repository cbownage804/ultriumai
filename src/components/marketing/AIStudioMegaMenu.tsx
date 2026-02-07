import { useNavigate } from 'react-router-dom';
import { 
  Bot, Zap, Code2, Workflow, Brain, Sparkles, ArrowRight, 
  Palette, MessageSquare, Shield, BarChart3 
} from 'lucide-react';
import aiStudioLogo from '@/assets/ai-studio-logo.png';

interface MegaMenuProps {
  onNavigate: (path: string) => void;
}

const tools = [
  { 
    icon: Bot, 
    label: 'GPT Builder', 
    description: 'Build custom AI assistants with your data',
    path: '/ai-studio',
    color: 'text-primary'
  },
  { 
    icon: Code2, 
    label: 'App Builder', 
    description: 'Generate full-stack apps with AI',
    path: '/ai-studio/app-builder',
    color: 'text-violet-400'
  },
  { 
    icon: Workflow, 
    label: 'AI Agents', 
    description: 'Autonomous workflows & automations',
    path: '/ai-studio/agents',
    color: 'text-cyan-400'
  },
  { 
    icon: MessageSquare, 
    label: 'Studio Assistant', 
    description: 'Chat with your AI copilot',
    path: '/ai-studio/assistant',
    color: 'text-emerald-400'
  },
];

const useCases = [
  { label: 'Customer Support Bot', path: '/ai-studio/use-cases' },
  { label: 'Knowledge Base GPT', path: '/ai-studio/use-cases' },
  { label: 'Sales Assistant', path: '/ai-studio/use-cases' },
  { label: 'Internal IT Helper', path: '/ai-studio/use-cases' },
];

export function AIStudioMegaMenu({ onNavigate }: MegaMenuProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.8fr] gap-0 min-w-[480px] max-w-[640px]">
      {/* Left — Tools */}
      <div className="p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center overflow-hidden">
            <img src={aiStudioLogo} alt="AI Studio" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Studio Tools</span>
        </div>
        {tools.map((tool) => (
          <button
            key={tool.label}
            onClick={() => onNavigate(tool.path)}
            className="group/tool flex items-start gap-3 w-full p-2.5 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all text-left"
          >
            <div className="mt-0.5 shrink-0">
              <tool.icon className={`h-5 w-5 ${tool.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-foreground group-hover/tool:text-primary transition-colors">{tool.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/tool:opacity-100 group-hover/tool:translate-x-0 transition-all" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Right — Use Cases & CTA */}
      <div className="p-4 bg-muted/30 border-l border-border/30 flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Popular Use Cases</span>
        <div className="space-y-1.5 flex-1">
          {useCases.map((uc) => (
            <button
              key={uc.label}
              onClick={() => onNavigate(uc.path)}
              className="flex items-center gap-2 w-full text-left text-sm text-foreground/70 hover:text-primary transition-colors py-1"
            >
              <Sparkles className="h-3 w-3 text-primary/50" />
              {uc.label}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/30">
          <button
            onClick={() => onNavigate('/ai-studio-platform')}
            className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 flex items-center justify-center gap-1 transition-colors"
          >
            View All AI Studio Features <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

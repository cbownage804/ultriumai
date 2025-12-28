import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  Network, 
  Mail, 
  Search, 
  FileText,
  Globe,
  Bug,
  Code,
  Lightbulb,
  Calculator,
  PenTool,
  BookOpen,
  Zap,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChatMode = 'security' | 'general';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  prompt: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  actions: QuickAction[];
}

// Security mode suggested questions
const SECURITY_SUGGESTED_QUESTIONS = [
  { icon: Shield, prompt: "Give me a quick security status check" },
  { icon: Mail, prompt: "Check if my email has been in any breaches" },
  { icon: Globe, prompt: "Scan a URL for phishing or malware" },
  { icon: Network, prompt: "Check if this IP address is malicious" },
];

// General mode suggested questions
const GENERAL_SUGGESTED_QUESTIONS = [
  { icon: Sparkles, prompt: "What can you help me with?" },
  { icon: Code, prompt: "Help me write some code" },
  { icon: PenTool, prompt: "Help me draft an email or document" },
  { icon: Brain, prompt: "Help me think through a problem" },
];

// Security mode categories
const SECURITY_CATEGORIES: Category[] = [
  {
    id: 'breach',
    label: 'Breach Detection',
    icon: Shield,
    color: 'hsl(var(--copilot-accent))',
    actions: [
      { icon: Mail, label: "Check Email Breach", prompt: "Check if this email address has been exposed in data breaches: " },
      { icon: Search, label: "Check Domain Breaches", prompt: "Check this domain for leaked credentials: " },
    ]
  },
  {
    id: 'scanning',
    label: 'URL & Content Scanning',
    icon: AlertTriangle,
    color: 'hsl(var(--cyber-orange, 30 100% 50%))',
    actions: [
      { icon: Globe, label: "Scan URL", prompt: "Scan this URL for phishing or malicious content: " },
      { icon: FileText, label: "Scan for Sensitive Data", prompt: "Scan this document for sensitive data like SSNs, credit cards, or API keys: " },
      { icon: Bug, label: "Malware Check", prompt: "Check this content for malware patterns: " },
    ]
  },
  {
    id: 'intel',
    label: 'Threat Intelligence',
    icon: Search,
    color: 'hsl(var(--cyber-red, 0 100% 50%))',
    actions: [
      { icon: Network, label: "Check IP Reputation", prompt: "Check the reputation of this IP address: " },
      { icon: AlertTriangle, label: "Analyze Threat", prompt: "Analyze this potential security threat: " },
    ]
  },
];

// General mode categories
const GENERAL_CATEGORIES: Category[] = [
  {
    id: 'coding',
    label: 'Coding Help',
    icon: Code,
    color: 'hsl(var(--cyber-green))',
    actions: [
      { icon: Code, label: "Write Code", prompt: "Write a function that " },
      { icon: Bug, label: "Debug Code", prompt: "Help me debug this code: " },
      { icon: BookOpen, label: "Explain Code", prompt: "Explain what this code does: " },
      { icon: Zap, label: "Optimize Code", prompt: "Help me optimize this code: " },
    ]
  },
  {
    id: 'writing',
    label: 'Writing & Content',
    icon: PenTool,
    color: 'hsl(var(--cyber-purple))',
    actions: [
      { icon: Mail, label: "Draft Email", prompt: "Help me write a professional email about " },
      { icon: FileText, label: "Summarize", prompt: "Summarize this text: " },
      { icon: PenTool, label: "Improve Writing", prompt: "Improve this writing for clarity: " },
    ]
  },
  {
    id: 'ideas',
    label: 'Brainstorm & Ideas',
    icon: Lightbulb,
    color: 'hsl(var(--cyber-yellow, 45 100% 50%))',
    actions: [
      { icon: Lightbulb, label: "Generate Ideas", prompt: "Give me 5 creative ideas for " },
      { icon: Brain, label: "Problem Solve", prompt: "Help me solve this problem: " },
      { icon: Sparkles, label: "Name Generator", prompt: "Generate creative names for " },
    ]
  },
  {
    id: 'learn',
    label: 'Learn & Explain',
    icon: BookOpen,
    color: 'hsl(var(--cyber-blue))',
    actions: [
      { icon: BookOpen, label: "Explain Simply", prompt: "Explain in simple terms: " },
      { icon: Brain, label: "Teach Me", prompt: "Teach me about " },
      { icon: Search, label: "Compare", prompt: "Compare and contrast: " },
    ]
  },
  {
    id: 'analyze',
    label: 'Math & Analysis',
    icon: Calculator,
    color: 'hsl(280 70% 60%)',
    actions: [
      { icon: Calculator, label: "Solve Math", prompt: "Solve this math problem: " },
      { icon: Search, label: "Analyze Data", prompt: "Analyze this data: " },
      { icon: Brain, label: "Logic Puzzle", prompt: "Help me solve this logic puzzle: " },
    ]
  },
];

interface CopilotQuickActionsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
  compact?: boolean;
  mode?: ChatMode;
}

export function CopilotQuickActions({ 
  onSelectAction, 
  disabled, 
  compact = false,
  mode = 'security'
}: CopilotQuickActionsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const suggestedQuestions = mode === 'security' ? SECURITY_SUGGESTED_QUESTIONS : GENERAL_SUGGESTED_QUESTIONS;
  const categories = mode === 'security' ? SECURITY_CATEGORIES : GENERAL_CATEGORIES;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Suggested Questions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
          <div className="space-y-1.5">
            {suggestedQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectAction(q.prompt)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left",
                  "bg-[hsl(var(--copilot-surface))] hover:bg-[hsl(var(--copilot-surface-hover))]",
                  "border border-[hsl(var(--copilot-border))] hover:border-primary/30",
                  "transition-all duration-200 text-xs"
                )}
              >
                <q.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[hsl(var(--copilot-text))] truncate">{q.prompt}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category Dropdowns */}
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-border))] to-transparent" />
          <span className="text-[10px] text-[hsl(var(--copilot-text-muted))] uppercase tracking-wider">More Actions</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-border))] to-transparent" />
        </div>

        <div className="space-y-1">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left",
                  "bg-[hsl(var(--copilot-surface))] hover:bg-[hsl(var(--copilot-surface-hover))]",
                  "border border-[hsl(var(--copilot-border))] rounded-lg",
                  "transition-all duration-200",
                  expandedCategory === category.id && "rounded-b-none border-b-0"
                )}
              >
                <div 
                  className="p-1.5 rounded-md"
                  style={{ 
                    backgroundColor: `${category.color}15`,
                    color: category.color
                  }}
                >
                  <category.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-[hsl(var(--copilot-text))] flex-1">
                  {category.label}
                </span>
                <span className="text-[10px] text-[hsl(var(--copilot-text-muted))]">
                  {category.actions.length}
                </span>
                {expandedCategory === category.id ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--copilot-text-muted))]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--copilot-text-muted))]" />
                )}
              </button>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-t-0 border-[hsl(var(--copilot-border))] rounded-b-lg bg-[hsl(var(--copilot-surface))/50] p-1.5 space-y-1">
                      {category.actions.map((action, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => onSelectAction(action.prompt)}
                          disabled={disabled}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
                            "hover:bg-[hsl(var(--copilot-surface-hover))]",
                            "transition-all duration-150 group"
                          )}
                        >
                          <action.icon 
                            className="h-3 w-3 transition-transform group-hover:scale-110" 
                            style={{ color: category.color }}
                          />
                          <span className="text-[11px] text-[hsl(var(--copilot-text))]">
                            {action.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Original grid layout for non-compact mode
  const allActions = categories.flatMap(cat => 
    cat.actions.map(action => ({ ...action, category: cat.id, color: cat.color }))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-border))] to-transparent" />
        <span className="text-xs text-[hsl(var(--copilot-text-muted))] uppercase tracking-wider">Quick Actions</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-border))] to-transparent" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {allActions.slice(0, 10).map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Button
              variant="outline"
              onClick={() => onSelectAction(action.prompt)}
              disabled={disabled}
              className={cn(
                "w-full h-auto py-3 px-3 flex flex-col items-center gap-2 text-center",
                "bg-[hsl(var(--copilot-surface))] border-[hsl(var(--copilot-border))]",
                "hover:bg-[hsl(var(--copilot-surface-hover))] hover:border-[hsl(var(--copilot-accent)/0.5)]",
                "transition-all duration-200 group"
              )}
            >
              <div 
                className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110"
                style={{ 
                  backgroundColor: `${action.color}15`,
                  color: action.color
                }}
              >
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] text-[hsl(var(--copilot-text))] font-medium leading-tight">
                {action.label}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

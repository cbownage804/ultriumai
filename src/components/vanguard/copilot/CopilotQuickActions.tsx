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
  Lock,
  Scan,
  ChevronDown,
  ChevronRight,
  Users,
  Key,
  Bug,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const SUGGESTED_QUESTIONS = [
  { icon: Mail, prompt: "Check if test@example.com has been breached" },
  { icon: Globe, prompt: "Scan https://example.com for phishing threats" },
  { icon: Network, prompt: "Is IP 8.8.8.8 malicious?" },
  { icon: Search, prompt: "Check my domain company.com for leaked credentials" },
];

const CATEGORIES: Category[] = [
  {
    id: 'breach',
    label: 'Breach Detection',
    icon: AlertTriangle,
    color: 'hsl(var(--copilot-accent))',
    actions: [
      { icon: Mail, label: "Check Email Breach", prompt: "Check if my email address has been exposed in any data breaches" },
      { icon: Globe, label: "Check Domain Breach", prompt: "Scan my domain for any leaked credentials or compromised accounts" },
      { icon: Users, label: "Bulk Email Check", prompt: "I have a list of email addresses to check for breaches" },
      { icon: AlertTriangle, label: "Recent Breaches", prompt: "What are the most recent major data breaches I should know about?" },
    ]
  },
  {
    id: 'scanning',
    label: 'URL & Content Scanning',
    icon: Scan,
    color: 'hsl(var(--cyber-purple))',
    actions: [
      { icon: Globe, label: "Scan URL", prompt: "Scan this URL for phishing or malicious content: https://example.com" },
      { icon: Search, label: "Check Link Safety", prompt: "Is this link safe to click? Check it for me" },
      { icon: FileText, label: "Scan Document", prompt: "I have some text I need to scan for sensitive data like SSNs or credit cards" },
      { icon: Bug, label: "Malware Check", prompt: "Check this content for malware or suspicious patterns" },
    ]
  },
  {
    id: 'intel',
    label: 'Threat Intelligence',
    icon: Shield,
    color: 'hsl(var(--cyber-blue))',
    actions: [
      { icon: Network, label: "IP Reputation", prompt: "Check if this IP address is malicious or on any blocklists" },
      { icon: Globe, label: "Domain Analysis", prompt: "Analyze this domain for security issues and reputation" },
      { icon: AlertTriangle, label: "Latest Threats", prompt: "What are the latest security threats I should be aware of?" },
      { icon: Shield, label: "Security News", prompt: "Give me a quick security news update" },
    ]
  },
  {
    id: 'help',
    label: 'Security Guidance',
    icon: MessageSquare,
    color: 'hsl(var(--cyber-green))',
    actions: [
      { icon: Key, label: "Password Tips", prompt: "What are the best practices for creating strong passwords?" },
      { icon: Shield, label: "Security Basics", prompt: "Give me a quick overview of essential security practices" },
      { icon: Lock, label: "2FA Setup", prompt: "How do I set up two-factor authentication properly?" },
      { icon: Mail, label: "Phishing Prevention", prompt: "How can I identify and avoid phishing emails?" },
    ]
  },
];

interface CopilotQuickActionsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function CopilotQuickActions({ onSelectAction, disabled, compact = false }: CopilotQuickActionsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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
            {SUGGESTED_QUESTIONS.map((q, i) => (
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
          {CATEGORIES.map((category) => (
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
  const allActions = CATEGORIES.flatMap(cat => 
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

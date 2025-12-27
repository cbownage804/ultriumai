import { motion } from "framer-motion";
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
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  prompt: string;
  category: 'security' | 'scan' | 'intel';
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Shield, label: "Security Overview", prompt: "Give me a quick overview of my security posture. Any issues I should know about?", category: 'security' },
  { icon: AlertTriangle, label: "Active Threats", prompt: "Are there any active threats or alerts I need to address right now?", category: 'security' },
  { icon: Network, label: "Scan Network", prompt: "Can you run a network scan and tell me what devices you find?", category: 'scan' },
  { icon: Mail, label: "Email Breach Check", prompt: "Can you check if my email has been in any data breaches?", category: 'intel' },
  { icon: Search, label: "Check URL Safety", prompt: "I want to check if a website is safe before I visit it", category: 'intel' },
  { icon: Globe, label: "Domain Intel", prompt: "Check my domain for any leaked credentials or security issues", category: 'intel' },
  { icon: Lock, label: "IP Reputation", prompt: "I need to check if an IP address is malicious or on any blocklists", category: 'intel' },
  { icon: FileText, label: "Compliance Status", prompt: "How are we doing on compliance? Any gaps I should know about?", category: 'security' },
  { icon: Scan, label: "Vulnerability Scan", prompt: "Run a vulnerability assessment on my systems", category: 'scan' },
  { icon: Activity, label: "System Health", prompt: "How are my agents performing? Any issues with system health?", category: 'security' },
];

interface CopilotQuickActionsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

export function CopilotQuickActions({ onSelectAction, disabled }: CopilotQuickActionsProps) {
  const getCategoryColor = (category: QuickAction['category']) => {
    switch (category) {
      case 'security': return 'hsl(var(--copilot-accent))';
      case 'scan': return 'hsl(var(--cyber-purple))';
      case 'intel': return 'hsl(var(--cyber-blue))';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-border))] to-transparent" />
        <span className="text-xs text-[hsl(var(--copilot-text-muted))] uppercase tracking-wider">Quick Actions</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-border))] to-transparent" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {QUICK_ACTIONS.map((action, i) => (
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
                  backgroundColor: `${getCategoryColor(action.category)}15`,
                  color: getCategoryColor(action.category)
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

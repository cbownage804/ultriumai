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
  Activity,
  ChevronDown,
  ChevronRight,
  Server,
  HardDrive,
  Users,
  Key,
  Bug,
  Radio,
  Wifi,
  Database,
  Eye,
  Zap,
  Clock,
  BarChart3,
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
  { icon: AlertTriangle, prompt: "What are the latest security threats?" },
];

const CATEGORIES: Category[] = [
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    color: 'hsl(var(--copilot-accent))',
    actions: [
      { icon: Shield, label: "Security Overview", prompt: "Give me a quick overview of my security posture. Any issues I should know about?" },
      { icon: AlertTriangle, label: "Active Threats", prompt: "Are there any active threats or alerts I need to address right now?" },
      { icon: FileText, label: "Compliance Status", prompt: "How are we doing on compliance? Any gaps I should know about?" },
      { icon: Activity, label: "System Health", prompt: "How are my agents performing? Any issues with system health?" },
      { icon: Eye, label: "Recent Events", prompt: "Show me the most recent security events and alerts" },
    ]
  },
  {
    id: 'scanning',
    label: 'Scanning',
    icon: Scan,
    color: 'hsl(var(--cyber-purple))',
    actions: [
      { icon: Network, label: "Scan Network", prompt: "Can you run a network scan and tell me what devices you find?" },
      { icon: Scan, label: "Vulnerability Scan", prompt: "Run a vulnerability assessment on my systems" },
      { icon: Activity, label: "Port Scan", prompt: "Scan for open ports on my network and identify any risks" },
      { icon: Shield, label: "Malware Scan", prompt: "Check my endpoints for any malware or suspicious files" },
      { icon: Wifi, label: "Wireless Scan", prompt: "Scan for rogue wireless access points on my network" },
    ]
  },
  {
    id: 'intel',
    label: 'Threat Intel',
    icon: Globe,
    color: 'hsl(var(--cyber-blue))',
    actions: [
      { icon: Mail, label: "Email Breach Check", prompt: "Can you check if my email has been in any data breaches?" },
      { icon: Search, label: "Check URL Safety", prompt: "I want to check if a website is safe before I visit it" },
      { icon: Globe, label: "Domain Intel", prompt: "Check my domain for any leaked credentials or security issues" },
      { icon: Lock, label: "IP Reputation", prompt: "I need to check if an IP address is malicious or on any blocklists" },
      { icon: Bug, label: "CVE Lookup", prompt: "Look up the latest CVE vulnerabilities affecting common software" },
    ]
  },
  {
    id: 'assets',
    label: 'Assets & Inventory',
    icon: Server,
    color: 'hsl(var(--cyber-green))',
    actions: [
      { icon: Server, label: "List Devices", prompt: "Show me all devices and endpoints in my network" },
      { icon: HardDrive, label: "Storage Status", prompt: "What's the status of my storage and backup systems?" },
      { icon: Database, label: "Database Security", prompt: "Check my database configurations for security issues" },
      { icon: Radio, label: "Agent Status", prompt: "Show me which agents are online and their health status" },
    ]
  },
  {
    id: 'users',
    label: 'Users & Access',
    icon: Users,
    color: 'hsl(var(--cyber-orange))',
    actions: [
      { icon: Users, label: "User Activity", prompt: "Show me recent user login activity and any suspicious patterns" },
      { icon: Key, label: "Password Audit", prompt: "Run a password policy compliance check across users" },
      { icon: Lock, label: "Access Review", prompt: "Review privileged access and admin accounts" },
      { icon: AlertTriangle, label: "Failed Logins", prompt: "Show me failed login attempts in the last 24 hours" },
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    color: 'hsl(var(--cyber-cyan))',
    actions: [
      { icon: BarChart3, label: "Security Report", prompt: "Generate a security summary report for the past week" },
      { icon: Clock, label: "Trend Analysis", prompt: "Show me security trends over the last 30 days" },
      { icon: Zap, label: "Performance Metrics", prompt: "What are my key security performance metrics?" },
      { icon: FileText, label: "Audit Report", prompt: "Generate a compliance audit report" },
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

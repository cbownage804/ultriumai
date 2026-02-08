import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ArrowRight, Home, Shield, Zap, Sparkles, Bot, Code2,
  BarChart3, Settings, BookOpen, Users, FileText, Headphones,
  Lock, AlertTriangle, Monitor, Globe, MessageSquare, Palette,
  Rocket, Key, Database, Activity, CreditCard, Building2,
  Layers, Bell, Eye, ToggleLeft, Calendar, Wifi
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  keywords: string[];
}

const COMMANDS: CommandItem[] = [
  // Core Navigation
  { id: "home", label: "Home", category: "Navigate", icon: Home, route: "/", keywords: ["home", "landing"] },
  { id: "hub", label: "Product Hub", category: "Navigate", icon: Layers, route: "/hub", keywords: ["hub", "dashboard", "my"] },
  { id: "profile", label: "My Profile", category: "Navigate", icon: Users, route: "/profile", keywords: ["profile", "account", "me"] },
  { id: "settings", label: "Platform Settings", category: "Navigate", icon: Settings, route: "/settings", keywords: ["settings", "preferences", "config"] },
  { id: "docs", label: "Documentation", category: "Navigate", icon: BookOpen, route: "/docs", keywords: ["docs", "documentation", "help", "guide"] },
  { id: "pricing", label: "Pricing", category: "Navigate", icon: CreditCard, route: "/pricing", keywords: ["pricing", "plans", "billing"] },
  { id: "contact", label: "Contact Us", category: "Navigate", icon: MessageSquare, route: "/contact", keywords: ["contact", "support", "help"] },

  // AI Studio
  { id: "ai-studio", label: "AI Studio Dashboard", category: "AI Studio", icon: Sparkles, route: "/ai-studio", keywords: ["ai", "studio", "dashboard"] },
  { id: "new-gpt", label: "Create New GPT", category: "AI Studio", icon: Bot, route: "/dashboard/gpt/build", keywords: ["new", "gpt", "create", "build", "assistant"] },
  { id: "app-builder", label: "App Builder", category: "AI Studio", icon: Code2, route: "/ai-studio/app-builder", keywords: ["app", "builder", "ide", "code"] },
  { id: "ai-agents", label: "AI Agents", category: "AI Studio", icon: Zap, route: "/ai-studio/agents", keywords: ["agents", "automation"] },
  { id: "workflows", label: "Workflows", category: "AI Studio", icon: Rocket, route: "/ai-studio/workflows", keywords: ["workflows", "canvas"] },
  { id: "my-gpts", label: "My GPTs", category: "AI Studio", icon: MessageSquare, route: "/dashboard/gpt", keywords: ["gpts", "assistants"] },
  { id: "ai-analytics", label: "AI Analytics", category: "AI Studio", icon: BarChart3, route: "/dashboard/analytics", keywords: ["analytics", "usage", "credits"] },

  // Vanguard
  { id: "vanguard", label: "Vanguard Dashboard", category: "Vanguard", icon: Monitor, route: "/vanguard", keywords: ["vanguard", "msp", "rmm"] },
  { id: "horizon", label: "Horizon (RMM)", category: "Vanguard", icon: Monitor, route: "/vanguard/horizon", keywords: ["horizon", "rmm", "devices", "endpoints"] },
  { id: "response", label: "Response (Service Desk)", category: "Vanguard", icon: Headphones, route: "/vanguard/tickets", keywords: ["response", "tickets", "helpdesk", "service"] },
  { id: "pursuit", label: "Pursuit (XDR)", category: "Vanguard", icon: Shield, route: "/vanguard/pursuit", keywords: ["pursuit", "xdr", "antivirus", "edr"] },
  { id: "sentinel", label: "Sentinel (SaaS Security)", category: "Vanguard", icon: Eye, route: "/vanguard/sentinel", keywords: ["sentinel", "saas", "security"] },
  { id: "recon", label: "Recon (Security Assessment)", category: "Vanguard", icon: AlertTriangle, route: "/vanguard/recon", keywords: ["recon", "vulnerability", "scan", "assessment"] },
  { id: "atlas", label: "Atlas (Documentation)", category: "Vanguard", icon: BookOpen, route: "/vanguard/atlas", keywords: ["atlas", "documentation", "it glue", "sops"] },
  { id: "ledger", label: "Ledger (Reports)", category: "Vanguard", icon: FileText, route: "/vanguard/ledger", keywords: ["ledger", "reports", "reporting"] },
  { id: "cortex", label: "Cortex (AI Hub)", category: "Vanguard", icon: Sparkles, route: "/vanguard/cortex", keywords: ["cortex", "ai", "intelligence"] },
  { id: "comply", label: "Comply (Compliance)", category: "Vanguard", icon: Shield, route: "/vanguard/comply", keywords: ["comply", "compliance", "audit"] },

  // SafeSuite
  { id: "safesuite", label: "SafeSuite", category: "SafeSuite", icon: Shield, route: "/safesuite", keywords: ["safesuite", "security", "personal"] },
  { id: "safepass", label: "SafePass (Vault)", category: "SafeSuite", icon: Lock, route: "/safepass/dashboard", keywords: ["safepass", "passwords", "vault"] },
  { id: "safescan", label: "SafeScan", category: "SafeSuite", icon: AlertTriangle, route: "/safescan", keywords: ["safescan", "scan", "dark web"] },

  // Admin
  { id: "admin", label: "Admin Center", category: "Admin", icon: Settings, route: "/admin", keywords: ["admin", "management"] },
  { id: "admin-users", label: "Admin → Users", category: "Admin", icon: Users, route: "/admin", keywords: ["admin", "users", "manage"] },
  { id: "admin-health", label: "Admin → System Health", category: "Admin", icon: Activity, route: "/admin", keywords: ["health", "system", "status"] },
  { id: "admin-features", label: "Admin → Feature Flags", category: "Admin", icon: ToggleLeft, route: "/admin", keywords: ["feature", "flags", "toggle"] },
  { id: "admin-billing", label: "Admin → Billing", category: "Admin", icon: CreditCard, route: "/admin", keywords: ["billing", "subscriptions"] },
];

export const GlobalCommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : COMMANDS;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatList = Object.values(grouped).flat();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback((cmd: CommandItem) => {
    setOpen(false);
    navigate(cmd.route);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatList[selectedIndex]) {
      handleSelect(flatList[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md transition-opacity" />

      <div className="relative flex justify-center pt-[15vh]" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
            <Search className="h-5 w-5 text-primary" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, tools, and settings..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {flatList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No results for &ldquo;{query}&rdquo;</p>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">{category}</p>
                  {items.map(cmd => {
                    const globalIdx = flatList.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        data-index={globalIdx}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                          isSelected
                            ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                            : "text-foreground/70 hover:bg-muted/50"
                        }`}
                      >
                        <cmd.icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-primary" : ""}`} />
                        <span className="text-sm flex-1">{cmd.label}</span>
                        {isSelected && <ArrowRight className="h-3.5 w-3.5 text-primary/60" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <kbd className="bg-muted px-1 py-0.5 rounded font-mono text-[9px]">↑↓</kbd> Navigate
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <kbd className="bg-muted px-1 py-0.5 rounded font-mono text-[9px]">↵</kbd> Open
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="bg-muted px-1 py-0.5 rounded font-mono text-[9px]">⌘K</kbd> Toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

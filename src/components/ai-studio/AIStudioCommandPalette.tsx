import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot, Code2, Zap, BarChart3, Settings, BookOpen, Search,
  Home, MessageSquare, Palette, Rocket, Globe, Shield,
  FileText, ArrowRight
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
  { id: "home", label: "AI Studio Home", category: "Navigate", icon: Home, route: "/ai-studio", keywords: ["home", "dashboard", "hub"] },
  { id: "new-gpt", label: "Create New GPT", category: "Create", icon: Bot, route: "/dashboard/gpt/build", keywords: ["new", "gpt", "create", "build", "assistant"] },
  { id: "app-builder", label: "Open App Builder", category: "Create", icon: Code2, route: "/ai-studio/app-builder", keywords: ["app", "builder", "ide", "code"] },
  { id: "new-agent", label: "Create AI Agent", category: "Create", icon: Zap, route: "/ai-studio/agents/builder", keywords: ["agent", "workflow", "automation"] },
  { id: "my-gpts", label: "My GPTs", category: "Navigate", icon: MessageSquare, route: "/dashboard/gpt", keywords: ["gpts", "assistants", "list"] },
  { id: "agents", label: "AI Agents", category: "Navigate", icon: Zap, route: "/ai-studio/agents", keywords: ["agents", "list"] },
  { id: "workflows", label: "Workflows", category: "Navigate", icon: Rocket, route: "/ai-studio/workflows", keywords: ["workflows", "canvas"] },
  { id: "analytics", label: "Analytics Dashboard", category: "Navigate", icon: BarChart3, route: "/dashboard/analytics", keywords: ["analytics", "usage", "credits", "stats"] },
  { id: "templates", label: "GPT Templates", category: "Navigate", icon: Palette, route: "/dashboard/gpt/templates", keywords: ["templates", "gallery"] },
  { id: "assistant", label: "Studio Assistant", category: "Navigate", icon: Bot, route: "/ai-studio/assistant", keywords: ["assistant", "help", "guide"] },
  { id: "docs", label: "Documentation", category: "Help", icon: BookOpen, route: "/docs/ai-studio", keywords: ["docs", "documentation", "help"] },
  { id: "settings", label: "Settings", category: "Navigate", icon: Settings, route: "/settings", keywords: ["settings", "preferences"] },
  { id: "pricing", label: "Pricing", category: "Navigate", icon: Globe, route: "/pricing/ai-studio", keywords: ["pricing", "plans", "upgrade"] },
  { id: "security", label: "Security", category: "Help", icon: Shield, route: "/security", keywords: ["security", "policy"] },
];

export const AIStudioCommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Palette */}
      <div className="relative flex justify-center pt-[20vh]" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-lg bg-card border border-border/50 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {flatList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase px-3 py-1">{category}</p>
                  {items.map(cmd => {
                    const globalIdx = flatList.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          globalIdx === selectedIndex ? "bg-violet-500/10 text-foreground" : "text-foreground/70 hover:bg-muted/50"
                        }`}
                      >
                        <cmd.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm flex-1">{cmd.label}</span>
                        {globalIdx === selectedIndex && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">↑↓ Navigate · Enter Select</span>
            <span className="text-[10px] text-muted-foreground">⌘K to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

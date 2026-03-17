import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Globe, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface PreviewURLBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onRefresh: () => void;
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  projectFiles?: ProjectFile[];
  isLoading?: boolean;
}

/** Extract React Router routes from project files */
function detectRoutes(files: ProjectFile[]): string[] {
  const routes = new Set<string>(['/']);

  for (const file of files) {
    if (!/\.(tsx?|jsx?)$/.test(file.path)) continue;

    // Match <Route path="..." /> patterns
    const routeRegex = /<Route\s+[^>]*path\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = routeRegex.exec(file.content)) !== null) {
      const path = match[1];
      if (path && !path.includes(':') && !path.includes('*')) {
        routes.add(path.startsWith('/') ? path : '/' + path);
      }
    }

    // Match to="/path" in <Link> / <NavLink>
    const linkRegex = /(?:<Link|<NavLink)\s+[^>]*to\s*=\s*["']([^"']+)["']/g;
    while ((match = linkRegex.exec(file.content)) !== null) {
      const path = match[1];
      if (path && !path.includes(':') && !path.startsWith('#') && !path.startsWith('http')) {
        routes.add(path.startsWith('/') ? path : '/' + path);
      }
    }
  }

  return Array.from(routes).sort();
}

export function PreviewURLBar({
  currentUrl,
  onNavigate,
  onRefresh,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  projectFiles = [],
  isLoading = false,
}: PreviewURLBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentUrl);
  const [showRoutes, setShowRoutes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const routes = detectRoutes(projectFiles);

  useEffect(() => {
    if (!isEditing) setDraft(currentUrl);
  }, [currentUrl, isEditing]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showRoutes) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRoutes(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRoutes]);

  const handleSubmit = useCallback(() => {
    setIsEditing(false);
    const url = draft.startsWith('/') ? draft : '/' + draft;
    onNavigate(url);
  }, [draft, onNavigate]);

  return (
    <div className="flex items-center gap-1 h-8 px-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
      {/* Nav buttons */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          "h-5 w-5 rounded flex items-center justify-center transition-colors",
          canGoBack ? "text-white/50 hover:text-white/80 hover:bg-white/5" : "text-white/15 cursor-not-allowed"
        )}
      >
        <ArrowLeft className="h-3 w-3" />
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className={cn(
          "h-5 w-5 rounded flex items-center justify-center transition-colors",
          canGoForward ? "text-white/50 hover:text-white/80 hover:bg-white/5" : "text-white/15 cursor-not-allowed"
        )}
      >
        <ArrowRight className="h-3 w-3" />
      </button>
      <button
        onClick={onRefresh}
        className="h-5 w-5 rounded flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
      >
        <RotateCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
      </button>

      {/* URL input */}
      <div className="flex-1 relative" ref={dropdownRef}>
        <div className="flex items-center gap-1.5 h-6 px-2 bg-white/[0.03] rounded border border-white/[0.04] hover:border-white/[0.08] transition-colors">
          <Globe className="h-3 w-3 text-white/30 flex-shrink-0" />
          {isEditing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setDraft(currentUrl);
                }
              }}
              onBlur={() => {
                setIsEditing(false);
                setDraft(currentUrl);
              }}
              className="flex-1 bg-transparent text-xs text-white/90 outline-none font-mono min-w-0"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => inputRef.current?.select(), 0);
              }}
              className="flex-1 text-left text-xs text-white/60 font-mono truncate min-w-0"
            >
              {currentUrl}
            </button>
          )}
          {routes.length > 1 && (
            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Route dropdown */}
        {showRoutes && routes.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
            {routes.map((route) => (
              <button
                key={route}
                onClick={() => {
                  onNavigate(route);
                  setShowRoutes(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs font-mono transition-colors flex items-center gap-2",
                  route === currentUrl
                    ? "text-purple-400 bg-purple-500/10"
                    : "text-white/60 hover:text-white/90 hover:bg-white/5"
                )}
              >
                <span className="text-white/20">→</span>
                {route}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* External link */}
      <button
        onClick={() => window.open(currentUrl, '_blank')}
        className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
        title="Open in new tab"
      >
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

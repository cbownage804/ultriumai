import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const AIStudioCTABanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Don't show for authenticated users
    if (user) return;
    const wasDismissed = sessionStorage.getItem("ai-studio-cta-dismissed");
    if (!wasDismissed) {
      // Small delay so it doesn't pop immediately
      const timer = setTimeout(() => setDismissed(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("ai-studio-cta-dismissed", "true");
  };

  if (dismissed || user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-[fade-in_0.3s_ease-out]">
      <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium truncate">
              <span className="hidden sm:inline">Build custom AI assistants and full-stack apps with </span>
              <span className="font-bold">AI Studio</span>
              <span className="hidden md:inline"> — start free, no credit card required</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="bg-white text-violet-600 hover:bg-white/90 text-xs sm:text-sm h-8"
              asChild
            >
              <Link to="/ai-studio-platform">
                Try Free <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

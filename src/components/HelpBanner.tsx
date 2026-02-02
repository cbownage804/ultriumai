import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HelpBannerProps {
  className?: string;
}

export function HelpBanner({ className }: HelpBannerProps) {
  const navigate = useNavigate();

  return (
    <div className={`group relative flex items-center justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-violet-500/5 border border-primary/20 rounded-xl px-4 py-3 overflow-hidden hover:border-primary/40 transition-all duration-300 ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="space-y-0.5 relative z-10">
        <p className="font-medium text-sm group-hover:text-primary transition-colors">Need more help?</p>
        <p className="text-xs text-muted-foreground">Browse full documentation</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/docs/ai-studio')}
        className="relative z-10 border-primary/30 hover:border-primary hover:bg-primary/10 group/btn"
      >
        <BookOpen className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
        Docs
        <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
      </Button>
    </div>
  );
}

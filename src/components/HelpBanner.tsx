import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HelpBannerProps {
  className?: string;
}

export function HelpBanner({ className }: HelpBannerProps) {
  const navigate = useNavigate();

  return (
    <div className={`flex items-center justify-between bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg px-4 py-3 ${className}`}>
      <div className="space-y-0.5">
        <p className="font-medium text-sm">Need more help?</p>
        <p className="text-xs text-muted-foreground">Browse full documentation</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/docs/ai-studio')}>
        <BookOpen className="h-4 w-4 mr-2" />
        Docs
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

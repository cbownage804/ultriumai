import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  CheckCircle2, 
  Lightbulb, 
  Sparkles,
  Heart,
  Star,
} from 'lucide-react';
import { GPTTemplate } from '@/types/templates';
import { TemplateRatingStars } from './TemplateRatingStars';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: GPTTemplate;
  onDetails: () => void;
  onInstall: () => void;
  onToggleFavorite: () => void;
  onRate: () => void;
  isFavorite: boolean;
  userRating?: number;
  isInstalling: boolean;
  canInstall: boolean;
}

export function TemplateCard({
  template,
  onDetails,
  onInstall,
  onToggleFavorite,
  onRate,
  isFavorite,
  userRating,
  isInstalling,
  canInstall,
}: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full flex flex-col border-2 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${template.config.theme_color}15` }}
            >
              {template.icon}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight break-words">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className="text-[10px]"
                  style={{ borderColor: template.config.theme_color, color: template.config.theme_color }}
                >
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {template.config.enable_web_search && (
              <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                <Globe className="h-3 w-3" />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground"
                )} 
              />
            </Button>
          </div>
        </div>
        <CardDescription className="mt-2 text-sm">
          {template.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Rating */}
          <div className="flex items-center justify-between">
            <TemplateRatingStars 
              rating={template.rating} 
              totalReviews={template.use_count}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onRate();
              }}
            >
              <Star className={cn(
                "h-3 w-3",
                userRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
              )} />
              {userRating ? 'Update' : 'Rate'}
            </Button>
          </div>

          {/* Features Preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Key Capabilities
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {template.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Starter Questions Preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Try asking
            </p>
            <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2 italic">
              "{template.starter_questions[0]}"
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onDetails}
          >
            Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onInstall}
            disabled={isInstalling || !canInstall}
          >
            Use Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

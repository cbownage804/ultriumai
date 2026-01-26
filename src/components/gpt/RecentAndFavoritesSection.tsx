import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Heart, ArrowRight, Zap } from 'lucide-react';
import { GPTTemplate } from '@/types/templates';
import { motion } from 'framer-motion';
import { TemplateRatingStars } from './TemplateRatingStars';

interface RecentAndFavoritesSectionProps {
  recentTemplateIds: string[];
  favoriteTemplateIds: string[];
  allTemplates: GPTTemplate[];
  onInstall: (template: GPTTemplate) => void;
  onToggleFavorite: (templateId: string) => void;
  isInstalling: boolean;
  canInstall: boolean;
}

export function RecentAndFavoritesSection({
  recentTemplateIds,
  favoriteTemplateIds,
  allTemplates,
  onInstall,
  onToggleFavorite,
  isInstalling,
  canInstall,
}: RecentAndFavoritesSectionProps) {
  const recentTemplates = recentTemplateIds
    .map(id => allTemplates.find(t => t.id === id))
    .filter((t): t is GPTTemplate => t !== undefined)
    .slice(0, 4);

  const favoriteTemplates = favoriteTemplateIds
    .map(id => allTemplates.find(t => t.id === id))
    .filter((t): t is GPTTemplate => t !== undefined);

  if (recentTemplates.length === 0 && favoriteTemplates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Favorites Section */}
      {favoriteTemplates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            </div>
            <h3 className="text-lg font-medium">Your Favorites</h3>
            <Badge variant="secondary" className="text-xs">
              {favoriteTemplates.length} saved
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {favoriteTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <p className="font-medium text-sm leading-tight">{template.name}</p>
                          <Badge 
                            variant="outline" 
                            className="text-[9px] mt-0.5"
                            style={{ borderColor: template.config.theme_color }}
                          >
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onToggleFavorite(template.id)}
                      >
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <TemplateRatingStars rating={template.rating} size="sm" showCount={false} />
                      <Button 
                        size="sm" 
                        className="h-7 text-xs gap-1"
                        onClick={() => onInstall(template)}
                        disabled={isInstalling || !canInstall}
                      >
                        <Zap className="h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Used Section */}
      {recentTemplates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium">Recently Used</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all duration-200 border-dashed">
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{template.category}</p>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onInstall(template)}
                      disabled={isInstalling || !canInstall}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

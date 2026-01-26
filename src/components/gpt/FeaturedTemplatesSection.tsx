import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Crown, TrendingUp, Zap } from 'lucide-react';
import { GPTTemplate } from '@/types/templates';
import { motion } from 'framer-motion';
import { TemplateRatingStars } from './TemplateRatingStars';

interface FeaturedTemplatesSectionProps {
  templates: GPTTemplate[];
  onInstall: (template: GPTTemplate) => void;
  onViewDetails: (template: GPTTemplate) => void;
  isInstalling: boolean;
  canInstall: boolean;
}

// Featured template IDs - handpicked best templates
const FEATURED_IDS = [
  'it-helpdesk',
  'cybersecurity-analyst', 
  'devops-engineer',
  'credit-dispute-specialist',
  'power-bi-expert',
  'real-estate-agent',
];

export function FeaturedTemplatesSection({
  templates,
  onInstall,
  onViewDetails,
  isInstalling,
  canInstall,
}: FeaturedTemplatesSectionProps) {
  const featuredTemplates = templates.filter(t => FEATURED_IDS.includes(t.id));

  if (featuredTemplates.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
          <Crown className="h-5 w-5 text-yellow-500" />
        </div>
        <h2 className="text-xl font-semibold">Featured Templates</h2>
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Staff Picks
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 bg-gradient-to-br from-background to-primary/5">
              {/* Featured badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                FEATURED
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md"
                    style={{ 
                      background: `linear-gradient(135deg, ${template.config.theme_color}30, ${template.config.theme_color}10)`,
                      border: `1px solid ${template.config.theme_color}40`
                    }}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <TemplateRatingStars rating={template.rating} totalReviews={template.use_count} />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="text-sm line-clamp-2 mb-3">
                  {template.description}
                </CardDescription>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {template.use_count.toLocaleString()} uses
                  </div>
                  <span>•</span>
                  <Badge 
                    variant="outline" 
                    className="text-[10px]"
                    style={{ borderColor: template.config.theme_color, color: template.config.theme_color }}
                  >
                    {template.category}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onViewDetails(template)}
                  >
                    Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => onInstall(template)}
                    disabled={isInstalling || !canInstall}
                  >
                    <Zap className="h-3 w-3" />
                    Use Now
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

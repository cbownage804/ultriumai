import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GPTTemplate } from "@/types/templates";
import { Sparkles, TrendingUp, Lightbulb, ArrowRight, Zap, Target, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SmartRecommendationsProps {
  templates: GPTTemplate[];
  recentTemplateIds: string[];
  favoriteIds: string[];
  onInstall: (template: GPTTemplate) => void;
  onViewDetails: (template: GPTTemplate) => void;
  isInstalling?: boolean;
  canInstall?: boolean;
}

interface Recommendation {
  template: GPTTemplate;
  reason: string;
  icon: React.ElementType;
  score: number;
}

export function SmartRecommendations({
  templates,
  recentTemplateIds,
  favoriteIds,
  onInstall,
  onViewDetails,
  isInstalling = false,
  canInstall = true
}: SmartRecommendationsProps) {
  const recommendations = useMemo(() => {
    const results: Recommendation[] = [];
    
    // Get categories user has shown interest in
    const recentTemplates = recentTemplateIds
      .map(id => templates.find(t => t.id === id))
      .filter(Boolean) as GPTTemplate[];
    
    const favoriteTemplates = favoriteIds
      .map(id => templates.find(t => t.id === id))
      .filter(Boolean) as GPTTemplate[];
    
    const interestCategories = new Set([
      ...recentTemplates.map(t => t.category),
      ...favoriteTemplates.map(t => t.category)
    ]);
    
    const usedIds = new Set([...recentTemplateIds, ...favoriteIds]);
    
    // 1. Trending in your categories
    if (interestCategories.size > 0) {
      const categoryMatches = templates
        .filter(t => interestCategories.has(t.category) && !usedIds.has(t.id))
        .sort((a, b) => b.use_count - a.use_count)
        .slice(0, 2);
      
      categoryMatches.forEach(template => {
        results.push({
          template,
          reason: `Popular in ${template.category}`,
          icon: TrendingUp,
          score: template.use_count + (template.rating * 100)
        });
      });
    }
    
    // 2. Highly rated you haven't tried
    const highRated = templates
      .filter(t => !usedIds.has(t.id) && t.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);
    
    highRated.forEach(template => {
      if (!results.find(r => r.template.id === template.id)) {
        results.push({
          template,
          reason: `Top rated (${template.rating}★)`,
          icon: Sparkles,
          score: template.rating * 200
        });
      }
    });
    
    // 3. Complementary templates (different category from what you use)
    if (interestCategories.size > 0) {
      const complementary = templates
        .filter(t => !interestCategories.has(t.category) && !usedIds.has(t.id))
        .sort((a, b) => b.use_count - a.use_count)
        .slice(0, 2);
      
      complementary.forEach(template => {
        if (!results.find(r => r.template.id === template.id)) {
          results.push({
            template,
            reason: `Expand to ${template.category}`,
            icon: Lightbulb,
            score: template.use_count * 0.8
          });
        }
      });
    }
    
    // 4. Quick wins - templates with high feature count
    const featureRich = templates
      .filter(t => !usedIds.has(t.id) && t.features.length >= 5)
      .sort((a, b) => b.features.length - a.features.length)
      .slice(0, 2);
    
    featureRich.forEach(template => {
      if (!results.find(r => r.template.id === template.id)) {
        results.push({
          template,
          reason: `${template.features.length} powerful features`,
          icon: Zap,
          score: template.features.length * 50
        });
      }
    });
    
    // 5. Fallback: Most popular overall
    if (results.length < 3) {
      const popular = templates
        .filter(t => !usedIds.has(t.id))
        .sort((a, b) => b.use_count - a.use_count)
        .slice(0, 3 - results.length);
      
      popular.forEach(template => {
        if (!results.find(r => r.template.id === template.id)) {
          results.push({
            template,
            reason: "Most popular",
            icon: TrendingUp,
            score: template.use_count
          });
        }
      });
    }
    
    // Sort by score and take top 4
    return results.sort((a, b) => b.score - a.score).slice(0, 4);
  }, [templates, recentTemplateIds, favoriteIds]);

  if (recommendations.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Recommended for You</CardTitle>
            <CardDescription>
              Based on your activity and preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                  "group"
                )}
                onClick={() => onViewDetails(rec.template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${rec.template.config.theme_color}20` }}
                    >
                      {rec.template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {rec.template.name}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className="text-xs mt-1 flex items-center gap-1 w-fit"
                      >
                        <rec.icon className="h-3 w-3" />
                        {rec.reason}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {rec.template.description}
                  </p>
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInstall(rec.template);
                    }}
                    disabled={isInstalling || !canInstall}
                    style={{ backgroundColor: rec.template.config.theme_color }}
                  >
                    Install
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

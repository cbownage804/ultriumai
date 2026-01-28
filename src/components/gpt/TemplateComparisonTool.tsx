import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GPTTemplate } from "@/types/templates";
import { Check, X, Download, Scale, Sparkles, Star, Users, Zap, Brain, Globe, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateRatingStars } from "./TemplateRatingStars";
import { CREDIT_COSTS } from "@/types/credits";

interface TemplateComparisonToolProps {
  templates: GPTTemplate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (template: GPTTemplate) => void;
  initialTemplates?: GPTTemplate[];
}

interface ComparisonFeature {
  name: string;
  icon: React.ElementType;
  getValue: (template: GPTTemplate) => string | boolean | number;
  type: "text" | "boolean" | "number" | "rating";
}

const comparisonFeatures: ComparisonFeature[] = [
  { name: "Category", icon: Sparkles, getValue: t => t.category, type: "text" },
  { name: "Rating", icon: Star, getValue: t => t.rating, type: "rating" },
  { name: "Usage Count", icon: Users, getValue: t => t.use_count, type: "number" },
  { name: "AI Model", icon: Brain, getValue: t => t.config.preferred_model || "gpt-4o-mini", type: "text" },
  { name: "Web Search", icon: Globe, getValue: t => t.config.enable_web_search || false, type: "boolean" },
  { name: "Feature Count", icon: Zap, getValue: t => t.features.length, type: "number" },
  { name: "Starter Prompts", icon: Sparkles, getValue: t => t.starter_questions.length, type: "number" },
];

export function TemplateComparisonTool({
  templates,
  open,
  onOpenChange,
  onInstall,
  initialTemplates = []
}: TemplateComparisonToolProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<(GPTTemplate | null)[]>(
    initialTemplates.length > 0 
      ? [...initialTemplates, null, null].slice(0, 3)
      : [null, null, null]
  );

  const handleSelectTemplate = (index: number, templateId: string) => {
    const template = templates.find(t => t.id === templateId) || null;
    setSelectedTemplates(prev => {
      const next = [...prev];
      next[index] = template;
      return next;
    });
  };

  const getAvailableTemplates = (currentIndex: number) => {
    const selectedIds = selectedTemplates
      .filter((_, i) => i !== currentIndex)
      .filter(Boolean)
      .map(t => t!.id);
    return templates.filter(t => !selectedIds.includes(t.id));
  };

  const renderValue = (feature: ComparisonFeature, template: GPTTemplate | null) => {
    if (!template) return <span className="text-muted-foreground">-</span>;
    
    const value = feature.getValue(template);
    
    switch (feature.type) {
      case "boolean":
        return value ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-red-500" />
        );
      case "rating":
        return <TemplateRatingStars rating={value as number} size="sm" />;
      case "number":
        return <span className="font-semibold">{value.toLocaleString()}</span>;
      default:
        return <span>{String(value)}</span>;
    }
  };

  const activeTemplates = selectedTemplates.filter(Boolean) as GPTTemplate[];
  const getBestFor = (feature: ComparisonFeature): GPTTemplate | null => {
    if (activeTemplates.length < 2) return null;
    
    let best: GPTTemplate | null = null;
    let bestValue: number = -Infinity;
    
    for (const template of activeTemplates) {
      const value = feature.getValue(template);
      if (typeof value === "number" && value > bestValue) {
        bestValue = value;
        best = template;
      } else if (feature.type === "boolean" && value === true && !best) {
        best = template;
      }
    }
    
    return best;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Compare Templates
          </DialogTitle>
          <DialogDescription>
            Select up to 3 templates to compare their features side by side
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Template Selectors */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {selectedTemplates.map((template, index) => (
              <div key={index} className="space-y-3">
                <Select
                  value={template?.id || ""}
                  onValueChange={(value) => handleSelectTemplate(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select template ${index + 1}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTemplates(index).map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span className="truncate">{t.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {template && (
                  <Card 
                    className="border-2"
                    style={{ borderColor: template.config.theme_color }}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${template.config.theme_color}20` }}
                        >
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">{template.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className="text-xs mt-1"
                            style={{ borderColor: template.config.theme_color, color: template.config.theme_color }}
                          >
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {template.description}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full gap-1"
                        onClick={() => onInstall(template)}
                        style={{ backgroundColor: template.config.theme_color }}
                      >
                        <Coins className="h-3 w-3" />
                        {template.credit_cost ?? CREDIT_COSTS.TEMPLATE_INSTALL} credits
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {activeTemplates.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {comparisonFeatures.map((feature) => {
                    const best = getBestFor(feature);
                    return (
                      <div 
                        key={feature.name}
                        className="grid grid-cols-4 gap-4 py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <feature.icon className="h-4 w-4 text-muted-foreground" />
                          {feature.name}
                        </div>
                        {selectedTemplates.map((template, index) => (
                          <div 
                            key={index}
                            className={cn(
                              "flex items-center justify-center text-sm",
                              template && best?.id === template.id && "bg-green-50 dark:bg-green-950/20 rounded-md py-1"
                            )}
                          >
                            {renderValue(feature, template)}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features List Comparison */}
          {activeTemplates.length >= 2 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Included Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-sm font-medium text-muted-foreground">Features</div>
                  {selectedTemplates.map((template, index) => (
                    <div key={index}>
                      {template ? (
                        <ul className="space-y-1">
                          {template.features.map((feature, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <Check className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTemplates.length < 2 && (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select at least 2 templates to compare</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

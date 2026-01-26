import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Sparkles, Download, TrendingUp, Zap, Lock, Crown, ArrowRight, Play, Globe, CheckCircle2, Lightbulb, TestTube, Heart, Star, Scale, Wand2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTemplateFavorites } from "@/hooks/useTemplateFavorites";
import { useTemplateRatings } from "@/hooks/useTemplateRatings";
import { gptTemplates } from "@/data/gptTemplates";
import { GPTTemplate } from "@/types/templates";
import { TemplateFeatureBadges } from "@/components/chat/TemplateFeatureBadges";
import { FeaturedTemplatesSection } from "@/components/gpt/FeaturedTemplatesSection";
import { RecentAndFavoritesSection } from "@/components/gpt/RecentAndFavoritesSection";
import { TemplateCard } from "@/components/gpt/TemplateCard";
import { TemplateRatingStars } from "@/components/gpt/TemplateRatingStars";
import { TemplateRatingDialog } from "@/components/gpt/TemplateRatingDialog";
import { TemplatePreviewDemo } from "@/components/gpt/TemplatePreviewDemo";
import { TemplateComparisonTool } from "@/components/gpt/TemplateComparisonTool";
import { SmartRecommendations } from "@/components/gpt/SmartRecommendations";
import { GPTCreationWizard } from "@/components/gpt/GPTCreationWizard";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const GPTTemplatesMarketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createGPT, canCreateMore, gpts, limits } = useCustomGPTs();
  const { subscription, createCheckout } = useSubscription();
  const { toast } = useToast();
  const { favorites, toggleFavorite, trackUsage, isFavorite, getRecentTemplateIds } = useTemplateFavorites();
  const { rateTemplate, getUserRating, getAggregatedRating } = useTemplateRatings();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTemplate, setSelectedTemplate] = useState<GPTTemplate | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [templateToRate, setTemplateToRate] = useState<GPTTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<GPTTemplate | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const categories = [
    "all",
    ...Array.from(new Set(gptTemplates.map(t => t.category)))
  ];

  const filteredTemplates = gptTemplates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.use_count - a.use_count;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "favorites":
          const aFav = isFavorite(a.id) ? 1 : 0;
          const bFav = isFavorite(b.id) ? 1 : 0;
          return bFav - aFav;
        default:
          return 0;
      }
    });

  const handleInstallTemplate = async (template: GPTTemplate) => {
    if (!user || !canCreateMore) {
      toast({
        title: "Cannot install template",
        description: canCreateMore ? "Please sign in to install templates" : "You've reached your GPT limit. Upgrade to create more.",
        variant: "destructive",
      });
      return;
    }

    setIsInstalling(true);
    
    try {
      const newGPT = {
        name: template.name,
        description: template.description,
        system_prompt: template.system_prompt,
        starter_questions: template.starter_questions,
        preferred_model: template.config.preferred_model || "gpt-4o-mini",
        enable_web_search: template.config.enable_web_search || false,
        theme_color: template.config.theme_color || "#3b82f6",
        placeholder_prompt: template.config.placeholder_prompt || `Chat with ${template.name}...`,
        category: template.category,
        template_id: template.id,
        features: template.features || []
      };

      const result = await createGPT(newGPT);
      
      if (result) {
        // Track usage
        trackUsage(template.id);
        
        toast({
          title: "Template installed!",
          description: `${template.name} is ready to use. Redirecting to chat...`,
        });
        setSelectedTemplate(null);
        
        // Instant chat - redirect directly to the GPT chat
        navigate(`/ai-studio/chat/${result.id}`);
      }
    } catch (error) {
      console.error('Template installation error:', error);
      toast({
        title: "Installation failed",
        description: "Failed to install template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRateTemplate = (template: GPTTemplate) => {
    setTemplateToRate(template);
    setRatingDialogOpen(true);
  };

  const handleSubmitRating = (templateId: string, rating: number, review?: string) => {
    rateTemplate(templateId, rating, review);
    setRatingDialogOpen(false);
    setTemplateToRate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">GPT Templates</h1>
            <p className="text-muted-foreground mt-1">
              Discover and install pre-built GPT templates to get started quickly
            </p>
          </div>
        </div>
        
        {/* Subscription Status */}
        <div className="flex items-center gap-3">
          {/* Create from Scratch */}
          <Button onClick={() => setWizardOpen(true)} variant="outline">
            <Wand2 className="h-4 w-4 mr-2" />
            Create Custom
          </Button>
          
          {/* Compare Templates */}
          <Button onClick={() => setComparisonOpen(true)} variant="outline">
            <Scale className="h-4 w-4 mr-2" />
            Compare
          </Button>
          
          {/* Admin Test Suite Link */}
          {(user?.email?.endsWith('@ultriumai.com') || subscription.subscription_tier === 'enterprise') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/ai-studio/test-suite')}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Suite
            </Button>
          )}
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={subscription.subscription_tier === 'free' ? 'secondary' : 'default'} className="capitalize">
                {subscription.subscription_tier === 'free' ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Free Plan
                  </>
                ) : (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    {subscription.subscription_tier} Plan
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              GPTs: {gpts.length}/{limits.maxGPTs === -1 ? '∞' : limits.maxGPTs}
              {!canCreateMore && (
                <span className="text-destructive font-medium ml-2">Limit reached</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {subscription.subscription_tier === 'free' && !canCreateMore && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Lock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Template Installation Locked</h3>
                  <p className="text-sm text-muted-foreground">
                    You've reached your free plan limit of {limits.maxGPTs} GPT. Upgrade to install templates and create more custom GPTs.
                  </p>
                </div>
              </div>
              <Button onClick={() => createCheckout('premium', 'monthly')} className="shrink-0">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Templates Section */}
      <FeaturedTemplatesSection
        templates={gptTemplates}
        onInstall={handleInstallTemplate}
        onViewDetails={setSelectedTemplate}
        isInstalling={isInstalling}
        canInstall={canCreateMore}
      />

      {/* Recent & Favorites Section */}
      <RecentAndFavoritesSection
        recentTemplateIds={getRecentTemplateIds()}
        favoriteTemplateIds={favorites}
        allTemplates={gptTemplates}
        onInstall={handleInstallTemplate}
        onToggleFavorite={toggleFavorite}
        isInstalling={isInstalling}
        canInstall={canCreateMore}
      />

      {/* Smart Recommendations */}
      <SmartRecommendations
        templates={gptTemplates}
        recentTemplateIds={getRecentTemplateIds()}
        favoriteIds={favorites}
        onInstall={handleInstallTemplate}
        onViewDetails={setSelectedTemplate}
        isInstalling={isInstalling}
        canInstall={canCreateMore}
      />

      <Separator />

      {/* Filters & Search */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.slice(1).map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="favorites">My Favorites</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{gptTemplates.length}</div>
            <div className="text-sm text-muted-foreground">Available Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{categories.length - 1}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{favorites.length}</div>
            <div className="text-sm text-muted-foreground">Your Favorites</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{getRecentTemplateIds().length}</div>
            <div className="text-sm text-muted-foreground">Recently Used</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <TemplateCard
              template={template}
              onDetails={() => setSelectedTemplate(template)}
              onInstall={() => handleInstallTemplate(template)}
              onToggleFavorite={() => toggleFavorite(template.id)}
              onRate={() => handleRateTemplate(template)}
              onPreview={() => setPreviewTemplate(template)}
              isFavorite={isFavorite(template.id)}
              userRating={getUserRating(template.id)?.rating}
              isInstalling={isInstalling}
              canInstall={canCreateMore}
            />
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Template Details Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${selectedTemplate.config.theme_color}15` }}
                  >
                    {selectedTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl">{selectedTemplate.name}</DialogTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleFavorite(selectedTemplate.id)}
                      >
                        <Heart 
                          className={cn(
                            "h-4 w-4",
                            isFavorite(selectedTemplate.id) ? "text-red-500 fill-red-500" : "text-muted-foreground"
                          )} 
                        />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: selectedTemplate.config.theme_color, color: selectedTemplate.config.theme_color }}
                      >
                        {selectedTemplate.category}
                      </Badge>
                      <TemplateRatingStars 
                        rating={selectedTemplate.rating} 
                        totalReviews={selectedTemplate.use_count}
                      />
                    </div>
                  </div>
                </div>
                <DialogDescription className="mt-2">
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Features */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    What You Get
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTemplate.features.map((feature, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Starter Questions */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Example Prompts
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.starter_questions.map((question, index) => (
                      <div 
                        key={index} 
                        className="text-sm bg-muted/50 p-3 rounded-lg border-l-2"
                        style={{ borderColor: selectedTemplate.config.theme_color }}
                      >
                        "{question}"
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rating Section */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Rate this template</p>
                    <p className="text-xs text-muted-foreground">Help others find great templates</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRateTemplate(selectedTemplate)}
                  >
                    <Star className={cn(
                      "h-4 w-4 mr-2",
                      getUserRating(selectedTemplate.id) ? "text-yellow-400 fill-yellow-400" : ""
                    )} />
                    {getUserRating(selectedTemplate.id) ? 'Update Rating' : 'Rate Template'}
                  </Button>
                </div>
                
                {/* Install Section */}
                <div className="space-y-3 pt-4 border-t">
                  {!canCreateMore && (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2 text-warning mb-2">
                        <Lock className="h-4 w-4" />
                        <span className="font-medium text-sm">Premium Feature</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        You've reached your {subscription.subscription_tier} plan limit. 
                        Upgrade to install templates and create unlimited GPTs.
                      </p>
                      <Button 
                        onClick={() => createCheckout('premium', 'monthly')}
                        size="sm"
                        className="w-full"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                  <Button 
                    onClick={() => handleInstallTemplate(selectedTemplate)}
                    disabled={!canCreateMore || isInstalling}
                    className="w-full h-11"
                    variant={!canCreateMore ? "secondary" : "default"}
                    style={canCreateMore ? { backgroundColor: selectedTemplate.config.theme_color } : {}}
                  >
                    {!canCreateMore ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Upgrade to Use
                      </>
                    ) : isInstalling ? (
                      <>
                        <Play className="h-4 w-4 mr-2 animate-pulse" />
                        Starting Chat...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Use Now - Start Chatting
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <TemplateRatingDialog
        template={templateToRate}
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        onSubmit={handleSubmitRating}
        existingRating={templateToRate ? getUserRating(templateToRate.id)?.rating : undefined}
        existingReview={templateToRate ? getUserRating(templateToRate.id)?.review : undefined}
      />

      {/* Preview Demo Dialog */}
      <TemplatePreviewDemo
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onInstall={handleInstallTemplate}
        isInstalling={isInstalling}
        canInstall={canCreateMore}
      />

      {/* Comparison Tool */}
      <TemplateComparisonTool
        templates={gptTemplates}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        onInstall={handleInstallTemplate}
      />

      {/* Creation Wizard */}
      <GPTCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </div>
  );
};

export default GPTTemplatesMarketplace;

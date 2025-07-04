import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Search, Filter, Sparkles, Download, Users, TrendingUp, Zap, Lock, Crown, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { gptTemplates } from "@/data/gptTemplates";
import { GPTTemplate } from "@/types/templates";

const GPTTemplatesMarketplace = () => {
  const { user } = useAuth();
  const { createGPT, canCreateMore, gpts, limits } = useCustomGPTs();
  const { subscription, createCheckout } = useSubscription();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTemplate, setSelectedTemplate] = useState<GPTTemplate | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

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
        placeholder_prompt: template.config.placeholder_prompt || `Chat with ${template.name}...`
      };

      const result = await createGPT(newGPT);
      
      if (result) {
        toast({
          title: "Template installed!",
          description: `${template.name} has been added to your Custom GPTs.`,
        });
        setSelectedTemplate(null);
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
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
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
            <div className="text-2xl font-bold text-primary">
              {gptTemplates.reduce((sum, t) => sum + t.use_count, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Installs</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{template.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {template.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Rating & Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    {renderStars(template.rating)}
                    <span className="text-muted-foreground ml-1">({template.rating})</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {template.use_count.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Features:</p>
                  <div className="text-xs text-muted-foreground">
                    {template.features.slice(0, 2).join(" • ")}
                    {template.features.length > 2 && " • ..."}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-xl">{template.icon}</span>
                          {template.name}
                        </DialogTitle>
                        <DialogDescription>
                          {template.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Starter Questions:</h4>
                          <div className="space-y-1">
                            {template.starter_questions.map((question, index) => (
                              <div key={index} className="text-sm bg-muted p-2 rounded">
                                "{question}"
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Features:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {template.features.map((feature, index) => (
                              <div key={index} className="text-sm flex items-center gap-2">
                                <Zap className="w-3 h-3 text-primary" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {!canCreateMore && (
                            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                              <div className="flex items-center gap-2 text-warning mb-2">
                                <Lock className="h-4 w-4" />
                                <span className="font-medium text-sm">Premium Feature</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                You've reached your {subscription.subscription_tier} plan limit of {limits.maxGPTs} GPT{limits.maxGPTs > 1 ? 's' : ''}. 
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
                            onClick={() => handleInstallTemplate(template)}
                            disabled={!canCreateMore || isInstalling}
                            className="w-full"
                            variant={!canCreateMore ? "secondary" : "default"}
                          >
                            {!canCreateMore ? (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Locked - Upgrade Required
                              </>
                            ) : isInstalling ? (
                              "Installing..."
                            ) : (
                              "Install Template"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleInstallTemplate(template)}
                    disabled={!canCreateMore || isInstalling}
                    variant={!canCreateMore ? "secondary" : "default"}
                  >
                    {!canCreateMore ? (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Install
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default GPTTemplatesMarketplace;
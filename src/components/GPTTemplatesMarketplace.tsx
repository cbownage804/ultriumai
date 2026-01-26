import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Sparkles, Download, TrendingUp, Zap, Lock, Crown, ArrowRight, Play, Globe, CheckCircle2, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { gptTemplates } from "@/data/gptTemplates";
import { GPTTemplate } from "@/types/templates";
import { TemplateFeatureBadges } from "@/components/chat/TemplateFeatureBadges";
import { motion } from "framer-motion";

const GPTTemplatesMarketplace = () => {
  const navigate = useNavigate();
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
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "name":
          return a.name.localeCompare(b.name);
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
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
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
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] mt-1"
                        style={{ borderColor: template.config.theme_color, color: template.config.theme_color }}
                      >
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  {template.config.enable_web_search && (
                    <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                      <Globe className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2 mt-2 text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Features Preview */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Key Capabilities
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{feature}</span>
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
                    <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2 line-clamp-2 italic">
                      "{template.starter_questions[0]}"
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                            style={{ backgroundColor: `${template.config.theme_color}15` }}
                          >
                            {template.icon}
                          </div>
                          <div>
                            <DialogTitle className="text-xl">{template.name}</DialogTitle>
                            <Badge 
                              variant="outline" 
                              className="text-xs mt-1"
                              style={{ borderColor: template.config.theme_color, color: template.config.theme_color }}
                            >
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <DialogDescription className="mt-2">
                          {template.description}
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
                            {template.features.map((feature, index) => (
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
                            {template.starter_questions.map((question, index) => (
                              <div 
                                key={index} 
                                className="text-sm bg-muted/50 p-3 rounded-lg border-l-2"
                                style={{ borderColor: template.config.theme_color }}
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
                            {template.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
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
                            onClick={() => handleInstallTemplate(template)}
                            disabled={!canCreateMore || isInstalling}
                            className="w-full h-11"
                            variant={!canCreateMore ? "secondary" : "default"}
                            style={canCreateMore ? { backgroundColor: template.config.theme_color } : {}}
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
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => handleInstallTemplate(template)}
                    disabled={!canCreateMore || isInstalling}
                    variant={!canCreateMore ? "secondary" : "default"}
                    style={canCreateMore && !isInstalling ? { backgroundColor: template.config.theme_color } : {}}
                  >
                    {!canCreateMore ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span className="hidden sm:inline">Locked</span>
                      </>
                    ) : isInstalling ? (
                      <>
                        <Play className="w-3 h-3 animate-pulse" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Use Now</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default GPTTemplatesMarketplace;
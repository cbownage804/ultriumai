import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useSubscription } from "@/hooks/useSubscription";
import AdvancedGPTEditor from "@/components/AdvancedGPTEditor";
import { Plus, Bot, Edit, Trash2, MessageSquare, Crown, Lock, Palette, Globe, Code2 } from "lucide-react";

const CustomGPTManager = () => {
  const { gpts, isLoading, createGPT, deleteGPT, canCreateMore, limits, loadGPTs } = useCustomGPTs();
  const { subscription } = useSubscription();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGPT, setEditingGPT] = useState<any>(null);
  const [newGPT, setNewGPT] = useState({
    name: "",
    description: "",
    system_prompt: ""
  });

  const handleCreateGPT = async () => {
    if (!newGPT.name || !newGPT.system_prompt) return;

    const result = await createGPT(newGPT);
    if (result) {
      setNewGPT({ name: "", description: "", system_prompt: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const getUpgradeMessage = () => {
    if (subscription.subscription_tier === "free") {
      return "Upgrade to Premium for 5 GPTs, custom branding, documents, embedding & API access";
    }
    if (subscription.subscription_tier === "premium") {
      return "Upgrade to Enterprise for unlimited GPTs with 5,000 character prompts";
    }
    return "";
  };

  if (editingGPT) {
    return (
      <AdvancedGPTEditor
        gpt={editingGPT}
        onUpdate={(updatedGPT) => {
          loadGPTs(); // Refresh the list
          setEditingGPT(null);
        }}
        onClose={() => setEditingGPT(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your custom GPTs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Custom GPTs</h2>
          <p className="text-muted-foreground">
            Create and manage your personalized AI assistants
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="hero" 
              disabled={!canCreateMore}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create GPT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom GPT</DialogTitle>
              <DialogDescription>
                Build a personalized AI assistant with custom instructions and personality.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gpt-name">GPT Name *</Label>
                    <Input
                      id="gpt-name"
                      placeholder="e.g., Writing Assistant, Code Helper"
                      value={newGPT.name}
                      onChange={(e) => setNewGPT(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gpt-description">Description</Label>
                    <Input
                      id="gpt-description"
                      placeholder="Brief description of what this GPT does"
                      value={newGPT.description}
                      onChange={(e) => setNewGPT(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Instructions</h3>
                <div className="space-y-2">
                  <Label htmlFor="gpt-prompt">System Prompt *</Label>
                  <Textarea
                    id="gpt-prompt"
                    placeholder="You are a helpful assistant that..."
                    value={newGPT.system_prompt}
                    onChange={(e) => setNewGPT(prev => ({ ...prev, system_prompt: e.target.value }))}
                    className="min-h-32"
                    maxLength={limits.maxPromptLength}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Give your GPT clear instructions about its role, behavior, and capabilities</span>
                    <div className="flex items-center gap-2">
                      <span>{newGPT.system_prompt.length}/{limits.maxPromptLength} characters</span>
                      <Badge variant="outline" className="text-xs">
                        {subscription.subscription_tier} limit
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Setup Tips */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">💡 Quick Setup Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be specific about your GPT's role and expertise area</li>
                  <li>• Include any special formatting or response style preferences</li>
                  <li>• Mention if it should ask clarifying questions</li>
                  <li>• You can always edit and enhance your GPT after creation</li>
                </ul>
              </div>

              {/* Next Steps Preview */}
              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                <h4 className="font-medium text-primary mb-2">🚀 After Creation</h4>
                <p className="text-sm text-muted-foreground">
                  Once created, you'll be able to customize appearance, add documents, configure integrations, and deploy your GPT.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateGPT}
                  disabled={!newGPT.name || !newGPT.system_prompt}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create GPT
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Stats */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">
                  {gpts.length} / {limits.maxGPTs === -1 ? "∞" : limits.maxGPTs} GPTs
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription.subscription_tier} plan
                </p>
              </div>
            </div>
            
            {!canCreateMore && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Limit reached
              </Badge>
            )}
          </div>
          
          {getUpgradeMessage() && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 {getUpgradeMessage()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gpts.map((gpt) => (
          <Card key={gpt.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {gpt.logo_url ? (
                    <img src={gpt.logo_url} alt={gpt.name} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                    >
                      {gpt.name.charAt(0)}
                    </div>
                  )}
                  <CardTitle className="text-lg">{gpt.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setEditingGPT(gpt)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteGPT(gpt.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {gpt.description && (
                <CardDescription className="line-clamp-2">
                  {gpt.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span>{gpt.chat_count} conversations</span>
                </div>

                {/* Feature badges */}
                <div className="flex gap-1 flex-wrap">
                  {gpt.embed_enabled && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      Embedded
                    </Badge>
                  )}
                  {gpt.api_enabled && (
                    <Badge variant="outline" className="text-xs">
                      <Code2 className="w-3 h-3 mr-1" />
                      API
                    </Badge>
                  )}
                  {gpt.theme_color !== '#3b82f6' && (
                    <Badge variant="outline" className="text-xs">
                      <Palette className="w-3 h-3 mr-1" />
                      Themed
                    </Badge>
                  )}
                </div>
                
                <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                  <p className="line-clamp-3">{gpt.system_prompt}</p>
                </div>
                
                <Button className="w-full" size="sm">
                  Chat with {gpt.name}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {gpts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Custom GPTs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first custom GPT to get started with personalized AI assistants.
            </p>
            {canCreateMore ? (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First GPT
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upgrade your plan to create custom GPTs
                </p>
                <Button variant="outline">
                  <Crown className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomGPTManager;
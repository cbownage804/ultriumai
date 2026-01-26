import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Plus, Trash2, ExternalLink, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUserAIProviders } from "@/hooks/useUserAIProviders";
import { AI_PROVIDERS, AIProvider } from "@/types/aiProviders";

export const AIProviderKeyManager = () => {
  const { providerKeys, loading, addProviderKey, removeProviderKey, hasProviderKey } = useUserAIProviders();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [providerToRemove, setProviderToRemove] = useState<AIProvider | null>(null);

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKeyInput.trim()) return;
    
    setIsAdding(true);
    const success = await addProviderKey(selectedProvider, apiKeyInput.trim());
    setIsAdding(false);
    
    if (success) {
      setSelectedProvider(null);
      setApiKeyInput("");
      setShowKey(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!providerToRemove) return;
    await removeProviderKey(providerToRemove);
    setProviderToRemove(null);
  };

  const getProviderKey = (provider: AIProvider) => {
    return providerKeys.find(k => k.provider === provider);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AI Provider API Keys
        </CardTitle>
        <CardDescription>
          Add your own API keys to unlock additional AI models. Your keys are stored securely and never shared.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {AI_PROVIDERS.map((provider) => {
          const existingKey = getProviderKey(provider.id);
          const isConfigured = hasProviderKey(provider.id);

          return (
            <div 
              key={provider.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{provider.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {isConfigured && (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                  {existingKey && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {existingKey.key_prefix}...{existingKey.key_suffix}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(provider.docsUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                {isConfigured ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setProviderToRemove(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Key
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> OpenAI models are available by default. Add keys for other providers to access their models.
          </p>
        </div>
      </CardContent>

      {/* Add Key Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={(open) => !open && setSelectedProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider && AI_PROVIDERS.find(p => p.id === selectedProvider)?.icon}
              Add {selectedProvider && AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key
            </DialogTitle>
            <DialogDescription>
              Enter your API key to unlock {selectedProvider && AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} models.
              Your key is stored locally and securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${selectedProvider} API key`}
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Get your API key from:</p>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => window.open(
                  AI_PROVIDERS.find(p => p.id === selectedProvider)?.docsUrl,
                  '_blank'
                )}
              >
                {AI_PROVIDERS.find(p => p.id === selectedProvider)?.docsUrl}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProvider(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddKey} disabled={!apiKeyInput.trim() || isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add API Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Key Confirmation */}
      <AlertDialog open={!!providerToRemove} onOpenChange={(open) => !open && setProviderToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your {providerToRemove && AI_PROVIDERS.find(p => p.id === providerToRemove)?.name} API key.
              You won't be able to use their models until you add a new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveKey} className="bg-destructive text-destructive-foreground">
              Remove Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { CreateApiKeyRequest } from "@/types/apiKeys";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Eye, EyeOff } from "lucide-react";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateApiKeyDialog = ({ open, onOpenChange }: CreateApiKeyDialogProps) => {
  const { createApiKey, loading } = useApiKeys();
  const { gpts } = useCustomGPTs();
  
  const [formData, setFormData] = useState<CreateApiKeyRequest>({
    name: "",
    gpt_id: "",
    permissions: {
      chat: true,
      analytics: false
    },
    rate_limit_rpm: 60,
    rate_limit_rpd: 1000,
    expires_at: ""
  });

  const [generatedKey, setGeneratedKey] = useState<string>("");
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      ...formData,
      gpt_id: formData.gpt_id || undefined,
      expires_at: formData.expires_at || undefined
    };

    const result = await createApiKey(requestData);
    
    if (result.success && result.key) {
      setGeneratedKey(result.key);
      // Reset form
      setFormData({
        name: "",
        gpt_id: "",
        permissions: { chat: true, analytics: false },
        rate_limit_rpm: 60,
        rate_limit_rpd: 1000,
        expires_at: ""
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
  };

  const handleClose = () => {
    setGeneratedKey("");
    setShowKey(false);
    onOpenChange(false);
  };

  if (generatedKey) {
    return (
      <AlertDialog open={true} onOpenChange={handleClose}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              API Key Generated Successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-amber-600 font-medium">
                ⚠️ This is the only time you'll see this key. Please copy it now and store it securely.
              </p>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label>Your API Key</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={showKey ? generatedKey : '••••••••••••••••••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Next Steps:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Copy and store this API key in a secure location</li>
                  <li>Use it in your API requests with the Authorization header</li>
                  <li>Monitor usage in the API Management dashboard</li>
                  <li>View documentation for implementation examples</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={handleClose}>
              I've Copied the Key
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key to access your GPTs programmatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Production API Key"
                required
              />
            </div>

            <div>
              <Label htmlFor="gpt">GPT (Optional)</Label>
              <Select 
                value={formData.gpt_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gpt_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a specific GPT or leave blank for all" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All GPTs</SelectItem>
                  {gpts.map((gpt) => (
                    <SelectItem key={gpt.id} value={gpt.id}>
                      {gpt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rpm">Rate Limit (RPM)</Label>
                <Input
                  id="rpm"
                  type="number"
                  value={formData.rate_limit_rpm}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate_limit_rpm: parseInt(e.target.value) }))}
                  min="1"
                  max="10000"
                />
              </div>
              <div>
                <Label htmlFor="rpd">Rate Limit (RPD)</Label>
                <Input
                  id="rpd"
                  type="number"
                  value={formData.rate_limit_rpd}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate_limit_rpd: parseInt(e.target.value) }))}
                  min="1"
                  max="100000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expires">Expiration Date (Optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="chat-perm" className="text-sm">Chat Access</Label>
                  <Switch
                    id="chat-perm"
                    checked={formData.permissions.chat}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        permissions: { ...prev.permissions, chat: checked }
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics-perm" className="text-sm">Analytics Access</Label>
                  <Switch
                    id="analytics-perm"
                    checked={formData.permissions.analytics}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        permissions: { ...prev.permissions, analytics: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create API Key"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
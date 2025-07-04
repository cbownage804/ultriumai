import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreVertical, Copy, RotateCcw, Trash2, Eye, EyeOff } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { formatDistanceToNow } from "date-fns";

export const ApiKeyList = () => {
  const { apiKeys, loading, deleteApiKey, regenerateApiKey, updateApiKey } = useApiKeys();
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [regenerateDialog, setRegenerateDialog] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string>("");
  const [showKey, setShowKey] = useState(false);

  const handleDelete = async (id: string) => {
    await deleteApiKey(id);
    setDeleteDialog(null);
  };

  const handleRegenerate = async (id: string) => {
    const result = await regenerateApiKey(id);
    if (result.success && result.key) {
      setGeneratedKey(result.key);
      setShowKey(false);
    }
    setRegenerateDialog(null);
  };

  const toggleKeyStatus = async (id: string, currentStatus: boolean) => {
    await updateApiKey(id, { is_active: !currentStatus });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading && apiKeys.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading API keys...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-lg font-medium">No API Keys</p>
            <p className="text-sm text-muted-foreground">Create your first API key to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((apiKey) => (
        <Card key={apiKey.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                <CardDescription>
                  {apiKey.key_prefix}••••••••••••••••
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                  {apiKey.is_active ? "Active" : "Inactive"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}>
                      {apiKey.is_active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRegenerateDialog(apiKey.id)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialog(apiKey.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Usage</p>
                <p className="text-sm text-muted-foreground">{apiKey.usage_count.toLocaleString()} requests</p>
              </div>
              <div>
                <p className="text-sm font-medium">Rate Limits</p>
                <p className="text-sm text-muted-foreground">
                  {apiKey.rate_limit_rpm}/min, {apiKey.rate_limit_rpd}/day
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Used</p>
                <p className="text-sm text-muted-foreground">
                  {apiKey.last_used_at 
                    ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true })
                    : "Never"
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Permissions</p>
                <div className="flex gap-1">
                  {apiKey.permissions.chat && <Badge variant="outline" className="text-xs">Chat</Badge>}
                  {apiKey.permissions.analytics && <Badge variant="outline" className="text-xs">Analytics</Badge>}
                </div>
              </div>
            </div>
            
            {apiKey.expires_at && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Expires:</strong> {new Date(apiKey.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke access for any applications using this key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={!!regenerateDialog} onOpenChange={() => setRegenerateDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new API key and invalidate the current one. Any applications using the current key will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => regenerateDialog && handleRegenerate(regenerateDialog)}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Show Generated Key Dialog */}
      {generatedKey && (
        <AlertDialog open={true} onOpenChange={() => setGeneratedKey("")}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>New API Key Generated</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p className="text-amber-600 font-medium">
                  ⚠️ This is the only time you'll see this key. Please copy it now.
                </p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your New API Key</span>
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
                        onClick={() => copyToClipboard(generatedKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <code className="block text-sm font-mono bg-background p-2 rounded border">
                    {showKey ? generatedKey : '••••••••••••••••••••••••••••••••'}
                  </code>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setGeneratedKey("")}>
                I've Copied the Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
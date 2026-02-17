import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Code, Shield, Gauge } from "lucide-react";
import { useApiEndpoints } from "@/hooks/useApiEndpoints";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Props {
  endpointId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EndpointDetailSheet({ endpointId, open, onOpenChange }: Props) {
  const { endpoints, updateEndpoint } = useApiEndpoints();
  const endpoint = endpoints.find((e) => e.id === endpointId);
  const [hiddenFields, setHiddenFields] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const baseUrl = `https://nsyobmjpdpvesjwdphlh.functions.supabase.co/api-gateway`;

  useEffect(() => {
    if (endpoint) {
      setHiddenFields(endpoint.hidden_fields?.join(", ") || "");
      setWebhookUrl(endpoint.webhook_url || "");
    }
  }, [endpoint]);

  if (!endpoint) return null;

  const saveSettings = () => {
    updateEndpoint.mutate({
      id: endpoint.id,
      hidden_fields: hiddenFields ? hiddenFields.split(",").map((f) => f.trim()).filter(Boolean) : null,
      webhook_url: webhookUrl.trim() || null,
    });
  };

  const curlExample = `curl -X GET "${baseUrl}${endpoint.base_path}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const jsExample = `const res = await fetch("${baseUrl}${endpoint.base_path}", {
  headers: { "Authorization": "Bearer YOUR_API_KEY" }
});
const data = await res.json();`;

  const pyExample = `import requests

res = requests.get(
    "${baseUrl}${endpoint.base_path}",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
print(res.json())`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {endpoint.name}
            <Badge variant={endpoint.is_active ? "default" : "secondary"}>
              {endpoint.is_active ? "Active" : "Inactive"}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {endpoint.description || `${endpoint.base_path} → ${endpoint.source_table}`}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Authentication</span>
                <Badge variant={endpoint.requires_auth ? "default" : "outline"}>
                  {endpoint.requires_auth ? "Required" : "Public"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Rate Limit</span>
                <span className="text-sm text-muted-foreground">
                  {endpoint.rate_limit_rpm} req/min
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Methods</span>
                <div className="flex gap-1">
                  {endpoint.allowed_methods.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Full URL</Label>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                  {baseUrl}{endpoint.base_path}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}${endpoint.base_path}`);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Hidden Fields</Label>
              <Input
                placeholder="field1, field2, ..."
                value={hiddenFields}
                onChange={(e) => setHiddenFields(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Columns to exclude from responses (comma-separated)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Webhook URL (on mutations)</Label>
              <Input
                placeholder="https://..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                POST notification sent on create/update/delete
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this endpoint</p>
              </div>
              <Switch
                checked={endpoint.is_active}
                onCheckedChange={(checked) =>
                  updateEndpoint.mutate({ id: endpoint.id, is_active: checked })
                }
              />
            </div>

            <Button onClick={saveSettings} disabled={updateEndpoint.isPending}>
              Save Settings
            </Button>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">cURL</Label>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono">{curlExample}</pre>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">JavaScript</Label>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono">{jsExample}</pre>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Python</Label>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono">{pyExample}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

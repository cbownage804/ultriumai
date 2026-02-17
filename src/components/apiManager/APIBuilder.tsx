import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Globe, Trash2, Settings2, Copy, ExternalLink } from "lucide-react";
import { useApiEndpoints } from "@/hooks/useApiEndpoints";
import { CreateEndpointDialog } from "./CreateEndpointDialog";
import { EndpointDetailSheet } from "./EndpointDetailSheet";
import { toast } from "sonner";

const methodColors: Record<string, string> = {
  GET: "bg-green-500/10 text-green-600 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function APIBuilder() {
  const { endpoints, isLoading, updateEndpoint, deleteEndpoint } = useApiEndpoints();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const baseUrl = `https://nsyobmjpdpvesjwdphlh.functions.supabase.co/api-gateway`;

  const copyUrl = (path: string) => {
    navigator.clipboard.writeText(`${baseUrl}${path}`);
    toast.success("URL copied to clipboard");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading endpoints...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Endpoints</h3>
          <p className="text-sm text-muted-foreground">
            Create REST APIs from your data — no code required
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Endpoint
        </Button>
      </div>

      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <h4 className="text-lg font-medium">No endpoints yet</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first API endpoint to expose your data as a REST API.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Endpoint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <Card key={ep.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Switch
                      checked={ep.is_active}
                      onCheckedChange={(checked) =>
                        updateEndpoint.mutate({ id: ep.id, is_active: checked })
                      }
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{ep.name}</span>
                        <Badge variant={ep.requires_auth ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {ep.requires_auth ? "Auth" : "Public"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {ep.base_path}
                        </code>
                        <span className="text-xs text-muted-foreground">→ {ep.source_table}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {ep.allowed_methods.map((m) => (
                        <Badge key={m} variant="outline" className={`text-[10px] px-1.5 py-0 ${methodColors[m] || ""}`}>
                          {m}
                        </Badge>
                      ))}
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(ep.base_path)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedEndpoint(ep.id)}>
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteEndpoint.mutate(ep.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Base URL reference */}
      {endpoints.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Base URL:</span>
              <code className="font-mono text-xs bg-background px-2 py-0.5 rounded border">{baseUrl}</code>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => { navigator.clipboard.writeText(baseUrl); toast.success("Copied"); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateEndpointDialog open={showCreate} onOpenChange={setShowCreate} />
      {selectedEndpoint && (
        <EndpointDetailSheet
          endpointId={selectedEndpoint}
          open={!!selectedEndpoint}
          onOpenChange={(open) => !open && setSelectedEndpoint(null)}
        />
      )}
    </div>
  );
}

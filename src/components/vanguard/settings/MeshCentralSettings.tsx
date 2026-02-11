import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Server } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MeshCentralConfig {
  id: string;
  server_url: string;
  admin_username: string;
  is_active: boolean;
  verification_status: string;
  last_verified_at: string | null;
  mesh_group_prefix: string;
  created_at: string;
}

export function MeshCentralSettings() {
  const [config, setConfig] = useState<MeshCentralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    server_url: "",
    admin_username: "",
    admin_password: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://nsyobmjpdpvesjwdphlh.supabase.co"}/functions/v1/vanguard-meshcentral-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "get_config" }),
        }
      );

      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
        setForm({
          server_url: data.config.server_url || "",
          admin_username: data.config.admin_username || "",
          admin_password: "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch MeshCentral config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.server_url || !form.admin_username) {
      toast.error("Server URL and admin username are required");
      return;
    }
    if (!config && !form.admin_password) {
      toast.error("Admin password is required for initial setup");
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://nsyobmjpdpvesjwdphlh.supabase.co"}/functions/v1/vanguard-meshcentral-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "save_config",
            server_url: form.server_url,
            admin_username: form.admin_username,
            admin_password: form.admin_password || undefined,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save config");
        return;
      }

      toast.success("MeshCentral configuration saved!");
      setForm((f) => ({ ...f, admin_password: "" }));
      await fetchConfig();
    } catch (err) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          MeshCentral Server
          {config?.verification_status === "verified" && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {config && config.verification_status !== "verified" && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              {config.verification_status}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure your MeshCentral server for zero-touch browser-based remote desktop access. Each MSP gets their own isolated configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mesh-url" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Server URL
          </Label>
          <Input
            id="mesh-url"
            placeholder="https://mesh.yourdomain.com or https://IP:port"
            value={form.server_url}
            onChange={(e) => setForm({ ...form, server_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            The full URL to your MeshCentral server including port if needed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mesh-user">Admin Username</Label>
          <Input
            id="mesh-user"
            placeholder="admin"
            value={form.admin_username}
            onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mesh-pass">
            Admin Password
            {config && <span className="text-xs text-muted-foreground ml-2">(leave blank to keep current)</span>}
          </Label>
          <div className="relative">
            <Input
              id="mesh-pass"
              type={showPassword ? "text" : "password"}
              placeholder={config ? "••••••••" : "Enter admin password"}
              value={form.admin_password}
              onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {config?.last_verified_at && (
          <p className="text-xs text-muted-foreground">
            Last verified: {new Date(config.last_verified_at).toLocaleString()}
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying & Saving...
            </>
          ) : config ? (
            "Update Configuration"
          ) : (
            "Connect MeshCentral Server"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

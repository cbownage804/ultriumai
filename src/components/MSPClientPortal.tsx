import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Building2, Users, Globe, Shield, Settings, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MSPClientPortal = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newPortal, setNewPortal] = useState({
    name: "",
    subdomain: "",
    client_id: "",
    branding_color: "#3b82f6",
    custom_logo_url: "",
    features: {
      ticket_submission: true,
      knowledge_base: true,
      billing_portal: false,
      asset_visibility: false
    }
  });

  const [portals] = useState([
    {
      id: "1",
      name: "Acme Corp Portal",
      subdomain: "acme",
      client_name: "Acme Corporation",
      is_active: true,
      last_accessed: "2024-01-15T10:30:00Z",
      total_users: 12,
      features: ["ticket_submission", "knowledge_base", "billing_portal"]
    },
    {
      id: "2", 
      name: "TechStart Portal",
      subdomain: "techstart",
      client_name: "TechStart Inc",
      is_active: true,
      last_accessed: "2024-01-14T16:45:00Z",
      total_users: 8,
      features: ["ticket_submission", "asset_visibility"]
    }
  ]);

  const [clients] = useState([
    { id: "1", name: "Acme Corporation" },
    { id: "2", name: "TechStart Inc" },
    { id: "3", name: "Global Solutions" }
  ]);

  const handleCreatePortal = async () => {
    if (!newPortal.name || !newPortal.subdomain || !newPortal.client_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Client portal created successfully"
      });
      setNewPortal({
        name: "",
        subdomain: "",
        client_id: "",
        branding_color: "#3b82f6",
        custom_logo_url: "",
        features: {
          ticket_submission: true,
          knowledge_base: true,
          billing_portal: false,
          asset_visibility: false
        }
      });
      setIsLoading(false);
    }, 1500);
  };

  const getFeatureBadge = (feature: string) => {
    const featureMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      ticket_submission: { label: "Tickets", variant: "default" },
      knowledge_base: { label: "Knowledge Base", variant: "secondary" },
      billing_portal: { label: "Billing", variant: "outline" },
      asset_visibility: { label: "Assets", variant: "destructive" }
    };

    const feature_info = featureMap[feature];
    return feature_info ? (
      <Badge variant={feature_info.variant} className="text-xs">
        {feature_info.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Portals</h2>
          <p className="text-muted-foreground">
            Manage self-service portals for your clients
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Portal
        </Button>
      </div>

      <Tabs defaultValue="portals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="portals">
            <Globe className="h-4 w-4 mr-2" />
            Active Portals
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Create Portal
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Portal Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portals" className="space-y-4">
          {portals.map((portal) => (
            <Card key={portal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {portal.name}
                    </CardTitle>
                    <CardDescription>{portal.client_name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={portal.is_active ? "default" : "secondary"}>
                      {portal.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Portal URL</p>
                    <p className="text-sm text-muted-foreground">
                      {portal.subdomain}.yourcompany.com
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {portal.total_users}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Accessed</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(portal.last_accessed).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {portal.features.map((feature) => getFeatureBadge(feature))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Client Portal</CardTitle>
              <CardDescription>
                Set up a self-service portal for your client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-name">Portal Name</Label>
                  <Input
                    id="portal-name"
                    placeholder="e.g., Acme Corp Portal"
                    value={newPortal.name}
                    onChange={(e) => setNewPortal(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    placeholder="e.g., acme"
                    value={newPortal.subdomain}
                    onChange={(e) => setNewPortal(prev => ({ ...prev, subdomain: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={newPortal.client_id} onValueChange={(value) => setNewPortal(prev => ({ ...prev, client_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branding-color">Branding Color</Label>
                  <Input
                    id="branding-color"
                    type="color"
                    value={newPortal.branding_color}
                    onChange={(e) => setNewPortal(prev => ({ ...prev, branding_color: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Custom Logo URL</Label>
                  <Input
                    id="logo-url"
                    placeholder="https://example.com/logo.png"
                    value={newPortal.custom_logo_url}
                    onChange={(e) => setNewPortal(prev => ({ ...prev, custom_logo_url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Portal Features</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ticket-submission">Ticket Submission</Label>
                    <Switch
                      id="ticket-submission"
                      checked={newPortal.features.ticket_submission}
                      onCheckedChange={(checked) => 
                        setNewPortal(prev => ({ 
                          ...prev, 
                          features: { ...prev.features, ticket_submission: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="knowledge-base">Knowledge Base</Label>
                    <Switch
                      id="knowledge-base"
                      checked={newPortal.features.knowledge_base}
                      onCheckedChange={(checked) => 
                        setNewPortal(prev => ({ 
                          ...prev, 
                          features: { ...prev.features, knowledge_base: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="billing-portal">Billing Portal</Label>
                    <Switch
                      id="billing-portal"
                      checked={newPortal.features.billing_portal}
                      onCheckedChange={(checked) => 
                        setNewPortal(prev => ({ 
                          ...prev, 
                          features: { ...prev.features, billing_portal: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="asset-visibility">Asset Visibility</Label>
                    <Switch
                      id="asset-visibility"
                      checked={newPortal.features.asset_visibility}
                      onCheckedChange={(checked) => 
                        setNewPortal(prev => ({ 
                          ...prev, 
                          features: { ...prev.features, asset_visibility: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleCreatePortal} disabled={isLoading} className="w-full">
                {isLoading ? "Creating Portal..." : "Create Portal"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portal Security Settings</CardTitle>
              <CardDescription>
                Configure security and access controls for client portals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for portal access
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>IP Restrictions</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict access to specific IP addresses
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-logout after inactivity
                  </p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
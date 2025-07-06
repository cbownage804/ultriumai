import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Bell,
  Mail,
  Webhook,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Target,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, any>;
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  notification_channels: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SafeSIEMAlertRules = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity_threshold: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    is_active: true,
    conditions: {
      source_apps: [] as string[],
      event_types: [] as string[],
      keywords: [] as string[]
    },
    notification_channels: {
      email: '',
      webhook: ''
    }
  });

  useEffect(() => {
    if (user) {
      loadAlertRules();
    }
  }, [user]);

  const loadAlertRules = async () => {
    try {
      if (!user?.id) return;
      
      const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading alert rules:', error);
        toast({
          title: "Error",
          description: "Failed to load alert rules",
          variant: "destructive",
        });
        return;
      }

      if (rules) {
        setAlertRules(rules as AlertRule[]);
      }
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          conditions: formData.conditions,
          severity_threshold: formData.severity_threshold,
          notification_channels: formData.notification_channels,
          is_active: formData.is_active
        });

      if (error) {
        console.error('Error creating alert rule:', error);
        toast({
          title: "Error",
          description: "Failed to create alert rule",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alert Rule Created",
        description: "Your alert rule has been created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadAlertRules();
    } catch (error) {
      console.error('Error creating alert rule:', error);
    }
  };

  const handleUpdateRule = async () => {
    try {
      if (!editingRule || !user?.id) return;
      
      const { error } = await supabase
        .from('alert_rules')
        .update({
          name: formData.name,
          description: formData.description,
          conditions: formData.conditions,
          severity_threshold: formData.severity_threshold,
          notification_channels: formData.notification_channels,
          is_active: formData.is_active
        })
        .eq('id', editingRule.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating alert rule:', error);
        toast({
          title: "Error",
          description: "Failed to update alert rule",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alert Rule Updated",
        description: "Your alert rule has been updated successfully",
      });

      setEditingRule(null);
      resetForm();
      loadAlertRules();
    } catch (error) {
      console.error('Error updating alert rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting alert rule:', error);
        toast({
          title: "Error",
          description: "Failed to delete alert rule",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alert Rule Deleted",
        description: "The alert rule has been deleted successfully",
      });

      loadAlertRules();
    } catch (error) {
      console.error('Error deleting alert rule:', error);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('alert_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling alert rule:', error);
        toast({
          title: "Error",
          description: "Failed to update alert rule status",
          variant: "destructive",
        });
        return;
      }

      setAlertRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: isActive } : rule
      ));

      toast({
        title: "Alert Rule Updated",
        description: `Alert rule ${isActive ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling alert rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      severity_threshold: 'medium',
      is_active: true,
      conditions: {
        source_apps: [],
        event_types: [],
        keywords: []
      },
      notification_channels: {
        email: '',
        webhook: ''
      }
    });
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      severity_threshold: rule.severity_threshold,
      is_active: rule.is_active,
      conditions: {
        source_apps: (rule.conditions as any)?.source_apps || [],
        event_types: (rule.conditions as any)?.event_types || [],
        keywords: (rule.conditions as any)?.keywords || []
      },
      notification_channels: {
        email: (rule.notification_channels as any)?.email || '',
        webhook: (rule.notification_channels as any)?.webhook || ''
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const addToArray = (field: keyof typeof formData.conditions, value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [field]: [...prev.conditions[field], value.trim()]
      }
    }));
  };

  const removeFromArray = (field: keyof typeof formData.conditions, index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [field]: prev.conditions[field].filter((_, i) => i !== index)
      }
    }));
  };

  const filteredRules = alertRules.filter(rule =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/safesiem')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              Alert Rules
            </h1>
            <p className="text-muted-foreground">
              Configure custom alert rules and notification channels
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingRule} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingRule(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure conditions and notification channels for your security alerts
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Severity Threats"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe when this alert should trigger..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Minimum Severity Level</Label>
                  <Select value={formData.severity_threshold} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, severity_threshold: value as any }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">Enable this alert rule</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Source Applications</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add source app (e.g., safedoc)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('source_apps', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.conditions.source_apps.map((app, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('source_apps', index)}>
                          {app} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Event Types</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add event type (e.g., malware_detected)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('event_types', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.conditions.event_types.map((type, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('event_types', index)}>
                          {type} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Keywords</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add keyword to match in event title/description"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('keywords', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.conditions.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('keywords', index)}>
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notification
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.notification_channels.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification_channels: {
                          ...prev.notification_channels,
                          email: e.target.value
                        }
                      }))}
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhook" className="flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      Webhook URL
                    </Label>
                    <Input
                      id="webhook"
                      type="url"
                      value={formData.notification_channels.webhook}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification_channels: {
                          ...prev.notification_channels,
                          webhook: e.target.value
                        }
                      }))}
                      placeholder="https://your-webhook-url.com/alerts"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingRule(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingRule ? handleUpdateRule : handleCreateRule}>
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search alert rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Alert Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Alert Rules Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No rules match your search criteria.' : 'Create your first alert rule to get started.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert Rule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(rule.severity_threshold)}>
                      {rule.severity_threshold.toUpperCase()}
                    </Badge>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Conditions:</strong>
                    <div className="mt-1 space-y-1">
                      {rule.conditions?.source_apps?.length > 0 && (
                        <div>Apps: {rule.conditions.source_apps.join(', ')}</div>
                      )}
                      {rule.conditions?.event_types?.length > 0 && (
                        <div>Types: {rule.conditions.event_types.join(', ')}</div>
                      )}
                      {rule.conditions?.keywords?.length > 0 && (
                        <div>Keywords: {rule.conditions.keywords.join(', ')}</div>
                      )}
                      {(!rule.conditions?.source_apps?.length && !rule.conditions?.event_types?.length && !rule.conditions?.keywords?.length) && (
                        <div className="text-muted-foreground">All events</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Notifications:</strong>
                    <div className="mt-1 space-y-1">
                      {rule.notification_channels?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {rule.notification_channels.email}
                        </div>
                      )}
                      {rule.notification_channels?.webhook && (
                        <div className="flex items-center gap-1">
                          <Webhook className="h-3 w-3" /> Webhook configured
                        </div>
                      )}
                      {(!rule.notification_channels?.email && !rule.notification_channels?.webhook) && (
                        <div className="text-muted-foreground">No notifications</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Created:</strong>
                    <div className="mt-1">
                      {new Date(rule.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SafeSIEMAlertRules;
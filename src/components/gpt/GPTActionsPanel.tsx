import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  Plus, 
  Webhook, 
  Code, 
  Trash2,
  Edit,
  Play,
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface GPTActionsPanelProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'api' | 'function';
  endpoint?: string;
  isEnabled: boolean;
  lastRun?: string;
  successRate?: number;
}

export function GPTActionsPanel({ gptId, gptName, themeColor }: GPTActionsPanelProps) {
  const { toast } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'webhook' as Action['type'],
    endpoint: '',
    isEnabled: true
  });

  // Mock data
  useEffect(() => {
    setActions([
      {
        id: '1',
        name: 'Create Ticket',
        description: 'Creates a support ticket in the helpdesk system',
        type: 'webhook',
        endpoint: 'https://api.helpdesk.com/tickets',
        isEnabled: true,
        lastRun: new Date().toISOString(),
        successRate: 98
      },
      {
        id: '2',
        name: 'Send Email',
        description: 'Sends an email notification',
        type: 'api',
        endpoint: 'https://api.email.com/send',
        isEnabled: true,
        lastRun: new Date().toISOString(),
        successRate: 100
      }
    ]);
  }, [gptId]);

  const handleSaveAction = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Action name is required",
        variant: "destructive"
      });
      return;
    }

    if (editingAction) {
      setActions(prev => prev.map(a => 
        a.id === editingAction.id ? { ...a, ...formData } : a
      ));
      toast({
        title: "Action updated",
        description: `${formData.name} has been updated`
      });
    } else {
      const newAction: Action = {
        id: `action-${Date.now()}`,
        ...formData
      };
      setActions(prev => [...prev, newAction]);
      toast({
        title: "Action created",
        description: `${formData.name} has been added`
      });
    }

    setIsDialogOpen(false);
    setEditingAction(null);
    setFormData({
      name: '',
      description: '',
      type: 'webhook',
      endpoint: '',
      isEnabled: true
    });
  };

  const handleEdit = (action: Action) => {
    setEditingAction(action);
    setFormData({
      name: action.name,
      description: action.description,
      type: action.type,
      endpoint: action.endpoint || '',
      isEnabled: action.isEnabled
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Action deleted",
      description: "The action has been removed"
    });
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setActions(prev => prev.map(a => 
      a.id === id ? { ...a, isEnabled: enabled } : a
    ));
    toast({
      title: enabled ? "Action enabled" : "Action disabled",
      description: `The action has been ${enabled ? 'enabled' : 'disabled'}`
    });
  };

  const getTypeIcon = (type: Action['type']) => {
    switch (type) {
      case 'webhook':
        return <Webhook className="h-5 w-5 text-blue-500" />;
      case 'api':
        return <ExternalLink className="h-5 w-5 text-green-500" />;
      case 'function':
        return <Code className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                GPT Actions
              </CardTitle>
              <CardDescription>
                Configure actions your GPT can perform
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingAction(null);
                  setFormData({
                    name: '',
                    description: '',
                    type: 'webhook',
                    endpoint: '',
                    isEnabled: true
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingAction ? 'Edit Action' : 'Create New Action'}</DialogTitle>
                  <DialogDescription>
                    Define an action your GPT can execute
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Action Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Create Ticket"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What does this action do?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['webhook', 'api', 'function'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFormData(prev => ({ ...prev, type }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.type === type
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-sm capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      value={formData.endpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                      placeholder="https://api.example.com/action"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled">Enable Action</Label>
                    <Switch
                      id="enabled"
                      checked={formData.isEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAction}>
                    {editingAction ? 'Save Changes' : 'Create Action'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configured Actions</CardTitle>
          <CardDescription>
            {actions.length} action{actions.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No actions configured yet</p>
              <p className="text-sm">Add actions to extend your GPT's capabilities</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {actions.map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(action.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{action.name}</p>
                          {action.isEnabled ? (
                            <Badge variant="outline" className="text-green-500 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                        {action.successRate !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Success rate: {action.successRate}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={action.isEnabled}
                        onCheckedChange={(checked) => handleToggle(action.id, checked)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(action)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(action.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

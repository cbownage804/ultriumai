import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Settings, Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailSetting {
  id: string;
  business_name: string;
  ingestion_email: string;
  default_priority: string;
  default_category: string;
  email_signature?: string;
  is_active: boolean;
}

export const EmailSettingsManager = () => {
  const [emailSettings, setEmailSettings] = useState<EmailSetting[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    ingestion_email: '',
    default_priority: 'medium',
    default_category: 'general',
    email_signature: '',
    is_active: true
  });

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      // First get the MSP ID for the current user
      const { data: mspData, error: mspError } = await supabase
        .from('msps')
        .select('id')
        .single();

      if (mspError) throw mspError;

      const { data, error } = await supabase
        .from('msp_email_settings')
        .select('*')
        .eq('msp_id', mspData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEmailSettings(data || []);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast.error('Failed to load email settings');
    }
  };

  const generateEmailAddress = () => {
    const businessSlug = formData.business_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${businessSlug}-${randomSuffix}@safedesk.io`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get MSP ID
      const { data: mspData, error: mspError } = await supabase
        .from('msps')
        .select('id')
        .single();

      if (mspError) throw mspError;

      const { error } = await supabase
        .from('msp_email_settings')
        .insert({
          ...formData,
          msp_id: mspData.id,
          ingestion_email: formData.ingestion_email || generateEmailAddress()
        });

      if (error) throw error;

      toast.success('Email ingestion setup successfully');
      setShowAddForm(false);
      setFormData({
        business_name: '',
        ingestion_email: '',
        default_priority: 'medium',
        default_category: 'general',
        email_signature: '',
        is_active: true
      });
      fetchEmailSettings();
    } catch (error) {
      console.error('Error creating email setting:', error);
      toast.error('Failed to setup email ingestion');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('msp_email_settings')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success('Email setting updated');
      fetchEmailSettings();
    } catch (error) {
      console.error('Error updating email setting:', error);
      toast.error('Failed to update email setting');
    }
  };

  const deleteSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('msp_email_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Email setting deleted');
      fetchEmailSettings();
    } catch (error) {
      console.error('Error deleting email setting:', error);
      toast.error('Failed to delete email setting');
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email address copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email-to-Ticket Setup</h3>
          <p className="text-sm text-muted-foreground">
            Configure email addresses that automatically create tickets when emails are received
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Email Ingestion
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Email Ingestion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business/Client Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="e.g., ACME Corp"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ingestion_email">Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ingestion_email"
                      value={formData.ingestion_email}
                      onChange={(e) => setFormData({ ...formData, ingestion_email: e.target.value })}
                      placeholder="Leave blank to auto-generate"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setFormData({ ...formData, ingestion_email: generateEmailAddress() })}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Priority</Label>
                  <Select value={formData.default_priority} onValueChange={(value) => setFormData({ ...formData, default_priority: value })}>
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
                <div className="space-y-2">
                  <Label>Default Category</Label>
                  <Select value={formData.default_category} onValueChange={(value) => setFormData({ ...formData, default_category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_signature">Auto-Reply Signature (Optional)</Label>
                <Textarea
                  id="email_signature"
                  value={formData.email_signature}
                  onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
                  placeholder="Add a signature for auto-reply emails..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Email Ingestion
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {emailSettings.map((setting) => (
          <Card key={setting.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <h4 className="font-medium">{setting.business_name}</h4>
                    <Badge variant={setting.is_active ? "default" : "secondary"}>
                      {setting.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{setting.ingestion_email}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyEmail(setting.ingestion_email)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Priority: {setting.default_priority}</span>
                    <span>Category: {setting.default_category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={() => toggleActive(setting.id, setting.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSetting(setting.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {emailSettings.length === 0 && !showAddForm && (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Email Ingestion Setup</h3>
              <p className="text-muted-foreground mb-4">
                Setup email addresses that automatically create tickets from incoming emails
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Setup Email Ingestion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
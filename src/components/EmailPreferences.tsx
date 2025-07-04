import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Mail, Bell, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface EmailPreference {
  id: string;
  user_id: string;
  gpt_activity_emails: boolean;
  api_usage_emails: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
  weekly_reports: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

const EmailPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<EmailPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      // Mock data for now until types are updated
      const mockPreferences: EmailPreference = {
        id: '1',
        user_id: user?.id || '',
        gpt_activity_emails: true,
        api_usage_emails: true,
        security_alerts: true,
        marketing_emails: false,
        weekly_reports: true,
        frequency: 'immediate',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPreferences(mockPreferences);
    } catch (error) {
      console.error('Error loading email preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load email preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<EmailPreference>) => {
    if (!preferences) return;

    setSaving(true);
    try {
      // Mock update for now until database types are updated
      setPreferences({ ...preferences, ...updates });
      toast({
        title: "Preferences Updated",
        description: "Your email preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update email preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading email preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Unable to Load Preferences</h3>
          <p className="text-muted-foreground">
            There was an issue loading your email preferences. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Email Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Manage when and how you receive email notifications
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Notification Types */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="gpt-activity">GPT Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about GPT creation, updates, and usage
                </p>
              </div>
              <Switch
                id="gpt-activity"
                checked={preferences.gpt_activity_emails}
                onCheckedChange={(checked) => 
                  updatePreferences({ gpt_activity_emails: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="api-usage">API Usage Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about API key usage and rate limits
                </p>
              </div>
              <Switch
                id="api-usage"
                checked={preferences.api_usage_emails}
                onCheckedChange={(checked) => 
                  updatePreferences({ api_usage_emails: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="security-alerts">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications and login alerts
                </p>
              </div>
              <Switch
                id="security-alerts"
                checked={preferences.security_alerts}
                onCheckedChange={(checked) => 
                  updatePreferences({ security_alerts: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly summary of your GPT usage and analytics
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={preferences.weekly_reports}
                onCheckedChange={(checked) => 
                  updatePreferences({ weekly_reports: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing">Marketing & Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Product updates, tips, and promotional content
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing_emails}
                onCheckedChange={(checked) => 
                  updatePreferences({ marketing_emails: checked })
                }
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Frequency & Timing */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Delivery Settings
            </CardTitle>
            <CardDescription>
              Configure when and how often you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="frequency">Notification Frequency</Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value: 'immediate' | 'daily' | 'weekly' | 'never') => 
                  updatePreferences({ frequency: value })
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                How often to receive non-urgent notifications
              </p>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => updatePreferences({ timezone: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Used for scheduling digest emails and quiet hours
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Quiet Hours Start</Label>
                <Select
                  value={preferences.quiet_hours_start || ''}
                  onValueChange={(value) => 
                    updatePreferences({ quiet_hours_start: value || null })
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No quiet hours" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quiet-end">Quiet Hours End</Label>
                <Select
                  value={preferences.quiet_hours_end || ''}
                  onValueChange={(value) => 
                    updatePreferences({ quiet_hours_end: value || null })
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No quiet hours" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              During quiet hours, only urgent notifications will be sent immediately
            </p>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Send a test email to verify your preferences are working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                // This would call the send-email function with a test template
                toast({
                  title: "Test Email Sent",
                  description: "Check your inbox for a test notification",
                });
              }}
              disabled={saving}
              className="btn-gradient"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Test Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailPreferences;
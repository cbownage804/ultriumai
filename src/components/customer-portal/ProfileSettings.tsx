/**
 * Profile Settings Component
 * Allow portal users to update their contact info and preferences
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Phone, Bell, Save, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface ProfileSettingsProps {
  onClose?: () => void;
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { session, updateSession, getSessionToken } = usePortalSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [formData, setFormData] = useState({
    fullName: session?.user.fullName || '',
    email: session?.user.email || '',
    phone: '',
    emailNotifications: true,
    ticketUpdates: true,
    maintenanceAlerts: true,
  });

  const handleSave = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('portal-auth', {
        body: {
          action: 'update-profile',
          portalUserId: session.user.id,
          fullName: formData.fullName,
          phone: formData.phone,
          preferences: {
            emailNotifications: formData.emailNotifications,
            ticketUpdates: formData.ticketUpdates,
            maintenanceAlerts: formData.maintenanceAlerts,
          },
        },
        headers: {
          'x-portal-session': getSessionToken() || '',
        },
      });

      if (error) throw error;

      // Update local session
      updateSession({
        user: {
          ...session.user,
          fullName: formData.fullName,
        },
      });

      setIsSaved(true);
      toast.success('Profile updated successfully');
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="h-6 w-6 text-cyan-400" />
          Profile Settings
        </h2>
        <p className="text-white/60 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Personal Information</CardTitle>
            <CardDescription className="text-white/60">
              Update your contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-white/40">Contact your administrator to change email</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/80">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-400" />
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-white/60">
              Choose what notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-white/50 text-sm">Receive notifications via email</p>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Ticket Updates</p>
                <p className="text-white/50 text-sm">Get notified when your tickets are updated</p>
              </div>
              <Switch
                checked={formData.ticketUpdates}
                onCheckedChange={(checked) => setFormData({ ...formData, ticketUpdates: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Maintenance Alerts</p>
                <p className="text-white/50 text-sm">Receive scheduled maintenance notifications</p>
              </div>
              <Switch
                checked={formData.maintenanceAlerts}
                onCheckedChange={(checked) => setFormData({ ...formData, maintenanceAlerts: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isSaved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

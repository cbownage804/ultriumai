import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Signature, 
  Bell, 
  Monitor,
  Calendar,
  Clock,
  Save,
  Upload,
  Eye,
  Palette,
  MessageSquare,
  Shield,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface TechnicianProfile {
  // Personal Info
  displayName: string;
  title: string;
  email: string;
  phone: string;
  extension: string;
  department: string;
  avatarUrl: string;
  
  // Email Signatures
  signatures: EmailSignature[];
  defaultSignatureId: string;
  
  // Notification Preferences
  notifications: NotificationSettings;
  
  // Display Preferences
  display: DisplaySettings;
  
  // Out of Office
  outOfOffice: OutOfOfficeSettings;
  
  // Quick Actions
  quickActions: QuickAction[];
}

interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isHtml: boolean;
  includeAvatar: boolean;
  includeSocial: boolean;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

interface NotificationSettings {
  emailNewTicket: boolean;
  emailTicketAssigned: boolean;
  emailTicketUpdated: boolean;
  emailSLAWarning: boolean;
  emailMentions: boolean;
  pushEnabled: boolean;
  pushNewTicket: boolean;
  pushUrgent: boolean;
  desktopNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

interface DisplaySettings {
  theme: 'system' | 'light' | 'dark';
  ticketListView: 'compact' | 'comfortable' | 'detailed';
  defaultTicketSort: 'priority' | 'created' | 'updated' | 'sla';
  showAvatars: boolean;
  showPreview: boolean;
  autoRefreshInterval: number;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface OutOfOfficeSettings {
  enabled: boolean;
  startDate: string;
  endDate: string;
  message: string;
  reassignTo: string;
  autoReply: boolean;
}

interface QuickAction {
  id: string;
  name: string;
  action: string;
  hotkey?: string;
}

export function TechnicianProfileSettings() {
  const [profile, setProfile] = useState<TechnicianProfile>({
    displayName: "John Smith",
    title: "Senior Support Engineer",
    email: "john.smith@company.com",
    phone: "+1 (555) 123-4567",
    extension: "1234",
    department: "Technical Support",
    avatarUrl: "",
    signatures: [
      {
        id: "1",
        name: "Standard Signature",
        content: `Best regards,

John Smith
Senior Support Engineer
Technical Support Department

Phone: +1 (555) 123-4567 ext. 1234
Email: john.smith@company.com

"Your success is our priority"`,
        isHtml: false,
        includeAvatar: true,
        includeSocial: true,
        socialLinks: {
          linkedin: "https://linkedin.com/in/johnsmith",
          website: "https://company.com"
        }
      },
      {
        id: "2",
        name: "Brief Signature",
        content: `Thanks,
John Smith | Support Engineer | +1 (555) 123-4567`,
        isHtml: false,
        includeAvatar: false,
        includeSocial: false,
        socialLinks: {}
      }
    ],
    defaultSignatureId: "1",
    notifications: {
      emailNewTicket: true,
      emailTicketAssigned: true,
      emailTicketUpdated: false,
      emailSLAWarning: true,
      emailMentions: true,
      pushEnabled: true,
      pushNewTicket: false,
      pushUrgent: true,
      desktopNotifications: true,
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      digestFrequency: 'realtime'
    },
    display: {
      theme: 'system',
      ticketListView: 'comfortable',
      defaultTicketSort: 'priority',
      showAvatars: true,
      showPreview: true,
      autoRefreshInterval: 30,
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    outOfOffice: {
      enabled: false,
      startDate: "",
      endDate: "",
      message: "I am currently out of the office and will return on [date]. For urgent matters, please contact the support team.",
      reassignTo: "",
      autoReply: true
    },
    quickActions: [
      { id: "1", name: "Mark as Resolved", action: "resolve", hotkey: "Ctrl+Shift+R" },
      { id: "2", name: "Escalate to Tier 2", action: "escalate", hotkey: "Ctrl+Shift+E" },
      { id: "3", name: "Add Time Entry", action: "time", hotkey: "Ctrl+Shift+T" }
    ]
  });

  const [selectedSignature, setSelectedSignature] = useState<string>(profile.signatures[0]?.id || "");
  const [signaturePreview, setSignaturePreview] = useState(false);

  const handleSaveProfile = () => {
    toast.success("Profile settings saved successfully");
  };

  const handleAddSignature = () => {
    const newSignature: EmailSignature = {
      id: Date.now().toString(),
      name: "New Signature",
      content: "",
      isHtml: false,
      includeAvatar: false,
      includeSocial: false,
      socialLinks: {}
    };
    setProfile(prev => ({
      ...prev,
      signatures: [...prev.signatures, newSignature]
    }));
    setSelectedSignature(newSignature.id);
    toast.success("New signature created");
  };

  const handleUpdateSignature = (id: string, updates: Partial<EmailSignature>) => {
    setProfile(prev => ({
      ...prev,
      signatures: prev.signatures.map(sig =>
        sig.id === id ? { ...sig, ...updates } : sig
      )
    }));
  };

  const handleDeleteSignature = (id: string) => {
    if (profile.signatures.length <= 1) {
      toast.error("You must have at least one signature");
      return;
    }
    setProfile(prev => ({
      ...prev,
      signatures: prev.signatures.filter(sig => sig.id !== id),
      defaultSignatureId: prev.defaultSignatureId === id 
        ? prev.signatures.find(s => s.id !== id)?.id || ""
        : prev.defaultSignatureId
    }));
    setSelectedSignature(profile.signatures.find(s => s.id !== id)?.id || "");
    toast.success("Signature deleted");
  };

  const currentSignature = profile.signatures.find(s => s.id === selectedSignature);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
          <p className="text-white/60">Configure your personal settings, signatures, and preferences</p>
        </div>
        <Button onClick={handleSaveProfile} className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-black/40 border border-cyan-500/30">
          <TabsTrigger value="personal" className="data-[state=active]:bg-cyan-500/20">
            <User className="h-4 w-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="signatures" className="data-[state=active]:bg-cyan-500/20">
            <Signature className="h-4 w-4 mr-2" />
            Email Signatures
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500/20">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="data-[state=active]:bg-cyan-500/20">
            <Monitor className="h-4 w-4 mr-2" />
            Display
          </TabsTrigger>
          <TabsTrigger value="ooo" className="data-[state=active]:bg-cyan-500/20">
            <Calendar className="h-4 w-4 mr-2" />
            Out of Office
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="data-[state=active]:bg-cyan-500/20">
            <Zap className="h-4 w-4 mr-2" />
            Quick Actions
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your profile details visible to customers and team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-cyan-500/30">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-2xl">
                    {profile.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-white/40">Recommended: 200x200px, JPG or PNG</p>
                </div>
              </div>

              <Separator className="bg-cyan-500/20" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Display Name</Label>
                  <Input
                    value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Job Title</Label>
                  <Input
                    value={profile.title}
                    onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Email Address</Label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Department</Label>
                  <Input
                    value={profile.department}
                    onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Phone Number</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Extension</Label>
                  <Input
                    value={profile.extension}
                    onChange={(e) => setProfile(prev => ({ ...prev, extension: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Signatures Tab */}
        <TabsContent value="signatures">
          <div className="grid grid-cols-3 gap-4">
            {/* Signature List */}
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Signature className="h-4 w-4 text-cyan-400" />
                    Your Signatures
                  </span>
                  <Button size="sm" onClick={handleAddSignature} className="bg-cyan-600 hover:bg-cyan-700">
                    Add New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    onClick={() => setSelectedSignature(sig.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSignature === sig.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{sig.name}</span>
                      {profile.defaultSignatureId === sig.id && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1 truncate">
                      {sig.content.split('\n')[0]}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Signature Editor */}
            <Card className="col-span-2 bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center justify-between">
                  <span>Edit Signature</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSignaturePreview(!signaturePreview)}
                      className="border-cyan-500/30 hover:bg-cyan-500/10"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {signaturePreview ? 'Edit' : 'Preview'}
                    </Button>
                    {currentSignature && profile.defaultSignatureId !== currentSignature.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setProfile(prev => ({ ...prev, defaultSignatureId: currentSignature.id }))}
                        className="border-cyan-500/30 hover:bg-cyan-500/10"
                      >
                        Set as Default
                      </Button>
                    )}
                    {currentSignature && profile.signatures.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSignature(currentSignature.id)}
                        className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSignature && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-white/80">Signature Name</Label>
                      <Input
                        value={currentSignature.name}
                        onChange={(e) => handleUpdateSignature(currentSignature.id, { name: e.target.value })}
                        className="bg-black/40 border-cyan-500/30 text-white"
                      />
                    </div>

                    {signaturePreview ? (
                      <div className="p-4 bg-white rounded-lg">
                        <pre className="text-sm text-gray-800 font-sans whitespace-pre-wrap">
                          {currentSignature.content}
                        </pre>
                        {currentSignature.includeAvatar && (
                          <div className="mt-3 flex items-center gap-2">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-cyan-500 text-white">
                                {profile.displayName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        {currentSignature.includeSocial && (
                          <div className="mt-2 flex gap-2">
                            {currentSignature.socialLinks.linkedin && (
                              <Badge variant="outline" className="text-xs">LinkedIn</Badge>
                            )}
                            {currentSignature.socialLinks.twitter && (
                              <Badge variant="outline" className="text-xs">Twitter</Badge>
                            )}
                            {currentSignature.socialLinks.website && (
                              <Badge variant="outline" className="text-xs">Website</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="text-white/80">Signature Content</Label>
                          <Textarea
                            value={currentSignature.content}
                            onChange={(e) => handleUpdateSignature(currentSignature.id, { content: e.target.value })}
                            className="bg-black/40 border-cyan-500/30 text-white min-h-[200px] font-mono text-sm"
                            placeholder="Enter your email signature..."
                          />
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={currentSignature.includeAvatar}
                              onCheckedChange={(checked) => handleUpdateSignature(currentSignature.id, { includeAvatar: checked })}
                            />
                            <Label className="text-white/60 text-sm">Include Avatar</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={currentSignature.includeSocial}
                              onCheckedChange={(checked) => handleUpdateSignature(currentSignature.id, { includeSocial: checked })}
                            />
                            <Label className="text-white/60 text-sm">Include Social Links</Label>
                          </div>
                        </div>

                        {currentSignature.includeSocial && (
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="space-y-2">
                              <Label className="text-white/60 text-sm">LinkedIn URL</Label>
                              <Input
                                value={currentSignature.socialLinks.linkedin || ""}
                                onChange={(e) => handleUpdateSignature(currentSignature.id, {
                                  socialLinks: { ...currentSignature.socialLinks, linkedin: e.target.value }
                                })}
                                className="bg-black/40 border-cyan-500/30 text-white text-sm"
                                placeholder="https://linkedin.com/in/..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white/60 text-sm">Twitter URL</Label>
                              <Input
                                value={currentSignature.socialLinks.twitter || ""}
                                onChange={(e) => handleUpdateSignature(currentSignature.id, {
                                  socialLinks: { ...currentSignature.socialLinks, twitter: e.target.value }
                                })}
                                className="bg-black/40 border-cyan-500/30 text-white text-sm"
                                placeholder="https://twitter.com/..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white/60 text-sm">Website URL</Label>
                              <Input
                                value={currentSignature.socialLinks.website || ""}
                                onChange={(e) => handleUpdateSignature(currentSignature.id, {
                                  socialLinks: { ...currentSignature.socialLinks, website: e.target.value }
                                })}
                                className="bg-black/40 border-cyan-500/30 text-white text-sm"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'emailNewTicket', label: 'New ticket assigned to me' },
                  { key: 'emailTicketAssigned', label: 'Ticket reassigned to me' },
                  { key: 'emailTicketUpdated', label: 'Updates on my tickets' },
                  { key: 'emailSLAWarning', label: 'SLA breach warnings' },
                  { key: 'emailMentions', label: 'When someone mentions me' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-white/80">{label}</Label>
                    <Switch
                      checked={profile.notifications[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(checked) => setProfile(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: checked }
                      }))}
                    />
                  </div>
                ))}

                <Separator className="bg-cyan-500/20" />

                <div className="space-y-2">
                  <Label className="text-white/80">Email Digest Frequency</Label>
                  <Select
                    value={profile.notifications.digestFrequency}
                    onValueChange={(value: any) => setProfile(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, digestFrequency: value }
                    }))}
                  >
                    <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-cyan-500/30">
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly digest</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-cyan-400" />
                  Push & Desktop Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Enable push notifications</Label>
                  <Switch
                    checked={profile.notifications.pushEnabled}
                    onCheckedChange={(checked) => setProfile(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, pushEnabled: checked }
                    }))}
                  />
                </div>

                {profile.notifications.pushEnabled && (
                  <>
                    <div className="flex items-center justify-between pl-4">
                      <Label className="text-white/60">New tickets</Label>
                      <Switch
                        checked={profile.notifications.pushNewTicket}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, pushNewTicket: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <Label className="text-white/60">Urgent/Critical only</Label>
                      <Switch
                        checked={profile.notifications.pushUrgent}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, pushUrgent: checked }
                        }))}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Desktop notifications</Label>
                  <Switch
                    checked={profile.notifications.desktopNotifications}
                    onCheckedChange={(checked) => setProfile(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, desktopNotifications: checked }
                    }))}
                  />
                </div>

                <Separator className="bg-cyan-500/20" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80">Quiet Hours</Label>
                    <Switch
                      checked={profile.notifications.quietHoursEnabled}
                      onCheckedChange={(checked) => setProfile(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, quietHoursEnabled: checked }
                      }))}
                    />
                  </div>
                  {profile.notifications.quietHoursEnabled && (
                    <div className="flex items-center gap-2 pl-4">
                      <Input
                        type="time"
                        value={profile.notifications.quietHoursStart}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, quietHoursStart: e.target.value }
                        }))}
                        className="bg-black/40 border-cyan-500/30 text-white w-28"
                      />
                      <span className="text-white/40">to</span>
                      <Input
                        type="time"
                        value={profile.notifications.quietHoursEnd}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, quietHoursEnd: e.target.value }
                        }))}
                        className="bg-black/40 border-cyan-500/30 text-white w-28"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-cyan-400" />
                Display Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Theme</Label>
                    <Select
                      value={profile.display.theme}
                      onValueChange={(value: any) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, theme: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="system">System Default</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Ticket List View</Label>
                    <Select
                      value={profile.display.ticketListView}
                      onValueChange={(value: any) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, ticketListView: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Default Sort</Label>
                    <Select
                      value={profile.display.defaultTicketSort}
                      onValueChange={(value: any) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, defaultTicketSort: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="created">Created Date</SelectItem>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="sla">SLA Due</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Auto-refresh Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={profile.display.autoRefreshInterval}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, autoRefreshInterval: parseInt(e.target.value) || 30 }
                      }))}
                      className="bg-black/40 border-cyan-500/30 text-white"
                      min={10}
                      max={300}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Timezone</Label>
                    <Select
                      value={profile.display.timezone}
                      onValueChange={(value) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, timezone: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Date Format</Label>
                    <Select
                      value={profile.display.dateFormat}
                      onValueChange={(value) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, dateFormat: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Time Format</Label>
                    <Select
                      value={profile.display.timeFormat}
                      onValueChange={(value: any) => setProfile(prev => ({
                        ...prev,
                        display: { ...prev.display, timeFormat: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                        <SelectItem value="24h">24-hour (13:30)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80">Show avatars in lists</Label>
                      <Switch
                        checked={profile.display.showAvatars}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          display: { ...prev.display, showAvatars: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80">Show ticket preview on hover</Label>
                      <Switch
                        checked={profile.display.showPreview}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          display: { ...prev.display, showPreview: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Out of Office Tab */}
        <TabsContent value="ooo">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                Out of Office Settings
              </CardTitle>
              <CardDescription>Configure automatic responses when you're away</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                <div>
                  <h4 className="text-white font-medium">Enable Out of Office</h4>
                  <p className="text-sm text-white/60">Automatically reassign tickets and send auto-replies</p>
                </div>
                <Switch
                  checked={profile.outOfOffice.enabled}
                  onCheckedChange={(checked) => setProfile(prev => ({
                    ...prev,
                    outOfOffice: { ...prev.outOfOffice, enabled: checked }
                  }))}
                />
              </div>

              {profile.outOfOffice.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Start Date</Label>
                      <Input
                        type="date"
                        value={profile.outOfOffice.startDate}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          outOfOffice: { ...prev.outOfOffice, startDate: e.target.value }
                        }))}
                        className="bg-black/40 border-cyan-500/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">End Date</Label>
                      <Input
                        type="date"
                        value={profile.outOfOffice.endDate}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          outOfOffice: { ...prev.outOfOffice, endDate: e.target.value }
                        }))}
                        className="bg-black/40 border-cyan-500/30 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Reassign Tickets To</Label>
                    <Select
                      value={profile.outOfOffice.reassignTo}
                      onValueChange={(value) => setProfile(prev => ({
                        ...prev,
                        outOfOffice: { ...prev.outOfOffice, reassignTo: value }
                      }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                        <SelectValue placeholder="Select a team member..." />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-500/30">
                        <SelectItem value="team">Team Queue</SelectItem>
                        <SelectItem value="jane.doe">Jane Doe</SelectItem>
                        <SelectItem value="bob.wilson">Bob Wilson</SelectItem>
                        <SelectItem value="sarah.chen">Sarah Chen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profile.outOfOffice.autoReply}
                      onCheckedChange={(checked) => setProfile(prev => ({
                        ...prev,
                        outOfOffice: { ...prev.outOfOffice, autoReply: checked }
                      }))}
                    />
                    <Label className="text-white/80">Send auto-reply to new tickets</Label>
                  </div>

                  {profile.outOfOffice.autoReply && (
                    <div className="space-y-2">
                      <Label className="text-white/80">Auto-Reply Message</Label>
                      <Textarea
                        value={profile.outOfOffice.message}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          outOfOffice: { ...prev.outOfOffice, message: e.target.value }
                        }))}
                        className="bg-black/40 border-cyan-500/30 text-white min-h-[120px]"
                        placeholder="Enter your out of office message..."
                      />
                      <p className="text-xs text-white/40">
                        Use [date] to insert your return date automatically
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="shortcuts">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-400" />
                Quick Actions & Keyboard Shortcuts
              </CardTitle>
              <CardDescription>Customize your productivity shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {profile.quickActions.map((action, index) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-cyan-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{action.name}</p>
                        <p className="text-xs text-white/40">Action: {action.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400 font-mono">
                        {action.hotkey}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/40 hover:text-white hover:bg-cyan-500/10"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full border-dashed border-cyan-500/30 hover:bg-cyan-500/10">
                + Add Quick Action
              </Button>

              <div className="pt-4 space-y-2">
                <h4 className="text-white font-medium">Global Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { keys: 'Ctrl + /', desc: 'Open command palette' },
                    { keys: 'Ctrl + K', desc: 'Quick search' },
                    { keys: 'Ctrl + N', desc: 'New ticket' },
                    { keys: 'Ctrl + Enter', desc: 'Submit reply' },
                    { keys: 'Escape', desc: 'Close modal/panel' },
                    { keys: 'J / K', desc: 'Navigate tickets' },
                  ].map(({ keys, desc }) => (
                    <div key={keys} className="flex items-center justify-between p-2 rounded bg-black/20">
                      <span className="text-white/60">{desc}</span>
                      <Badge variant="outline" className="font-mono text-xs">{keys}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

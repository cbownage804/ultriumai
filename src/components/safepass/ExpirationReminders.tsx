import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVault } from '@/hooks/useSafePass';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Bell,
  BellOff,
  Calendar,
  RefreshCw,
  Settings,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format, addDays, addMonths, isBefore, isAfter } from 'date-fns';

interface ExpiringEntry {
  id: string;
  title: string;
  website?: string;
  daysUntilExpiry: number;
  expiresAt: Date;
  lastChanged: Date;
}

interface Reminder {
  id: string;
  entry_id: string;
  reminder_type: string;
  due_date: string;
  is_dismissed: boolean;
}

export const ExpirationReminders = () => {
  const { user } = useAuth();
  const { entries, updateEntry } = useVault();
  
  const [isLoading, setIsLoading] = useState(false);
  const [expiringEntries, setExpiringEntries] = useState<ExpiringEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings
  const [defaultExpiryDays, setDefaultExpiryDays] = useState(90);
  const [reminderDays, setReminderDays] = useState(14);
  const [autoReminders, setAutoReminders] = useState(true);

  const analyzeExpirations = useCallback(() => {
    const now = new Date();
    const expiring: ExpiringEntry[] = [];

    entries.forEach(entry => {
      // Use created_at as the basis for expiration calculation
      const entryData = entry as any;
      const expiresAt = entryData.password_expires_at 
        ? new Date(entryData.password_expires_at)
        : addDays(new Date(entry.created_at), defaultExpiryDays);
      
      const lastChanged = entryData.last_password_change 
        ? new Date(entryData.last_password_change)
        : new Date(entry.created_at);

      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Include if expiring within reminder window or already expired
      if (daysUntilExpiry <= reminderDays) {
        expiring.push({
          id: entry.id,
          title: entry.title,
          website: entry.url,
          daysUntilExpiry,
          expiresAt,
          lastChanged
        });
      }
    });

    // Sort by urgency
    expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    setExpiringEntries(expiring);
  }, [entries, defaultExpiryDays, reminderDays]);

  const loadReminders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_expiration_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('due_date');

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Failed to load reminders');
    }
  }, [user]);

  useEffect(() => {
    analyzeExpirations();
    loadReminders();
  }, [analyzeExpirations, loadReminders]);

  const setPasswordExpiration = async (entryId: string, days: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const expiresAt = addDays(new Date(), days);
      
      const { error } = await supabase
        .from('safepass_entries')
        .update({ 
          password_expires_at: expiresAt.toISOString(),
          last_password_change: new Date().toISOString()
        })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Create reminder
      if (autoReminders) {
        const reminderDate = addDays(expiresAt, -reminderDays);
        await supabase
          .from('safepass_expiration_reminders')
          .upsert({
            user_id: user.id,
            entry_id: entryId,
            reminder_type: 'expiration',
            due_date: reminderDate.toISOString()
          }, { onConflict: 'entry_id' });
      }

      toast.success('Expiration date set');
      analyzeExpirations();
    } catch (error) {
      console.error('Failed to set expiration');
      toast.error('Failed to set expiration');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('safepass_expiration_reminders')
        .update({ 
          is_dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;
      loadReminders();
      toast.success('Reminder dismissed');
    } catch (error) {
      toast.error('Failed to dismiss reminder');
    }
  };

  const markAsRotated = async (entryId: string) => {
    if (!user) return;

    try {
      const newExpiry = addDays(new Date(), defaultExpiryDays);
      
      const { error } = await supabase
        .from('safepass_entries')
        .update({ 
          password_expires_at: newExpiry.toISOString(),
          last_password_change: new Date().toISOString()
        })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Password marked as rotated');
      analyzeExpirations();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (days <= 14) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
  };

  const expiredCount = expiringEntries.filter(e => e.daysUntilExpiry < 0).length;
  const soonCount = expiringEntries.filter(e => e.daysUntilExpiry >= 0 && e.daysUntilExpiry <= 7).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Expiring Passwords</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage password rotation reminders
          </p>
        </div>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto touch-target">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Expiration Settings</DialogTitle>
              <DialogDescription>
                Configure password rotation policies
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Default Password Expiry</Label>
                <Select 
                  value={defaultExpiryDays.toString()} 
                  onValueChange={(v) => setDefaultExpiryDays(parseInt(v))}
                >
                  <SelectTrigger className="touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Passwords older than this will be flagged for rotation
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reminder Days Before</Label>
                <Select 
                  value={reminderDays.toString()} 
                  onValueChange={(v) => setReminderDays(parseInt(v))}
                >
                  <SelectTrigger className="touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-create Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically create reminders for expiring passwords
                  </p>
                </div>
                <Switch 
                  checked={autoReminders} 
                  onCheckedChange={setAutoReminders}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${
                expiredCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {expiredCount > 0 ? (
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">{expiredCount}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${
                soonCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">{soonCount}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">{reminders.length}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Reminders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Passwords List */}
      {expiringEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Passwords Needing Attention ({expiringEntries.length})
            </CardTitle>
            <CardDescription>
              These passwords are expired or expiring soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {expiringEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{entry.title}</h4>
                        {entry.website && (
                          <p className="text-sm text-muted-foreground">{entry.website}</p>
                        )}
                      </div>
                      <Badge className={getUrgencyColor(entry.daysUntilExpiry)}>
                        {entry.daysUntilExpiry < 0 
                          ? `Expired ${Math.abs(entry.daysUntilExpiry)} days ago`
                          : entry.daysUntilExpiry === 0
                          ? 'Expires today'
                          : `${entry.daysUntilExpiry} days left`
                        }
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>Last changed: {format(entry.lastChanged, 'MMM d, yyyy')}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => markAsRotated(entry.id)}
                        className="bg-primary hover:bg-primary text-black"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Mark as Rotated
                      </Button>
                      <Select onValueChange={(v) => setPasswordExpiration(entry.id, parseInt(v))}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Set expiry..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Good!</h3>
          <p className="text-muted-foreground">
            No passwords expiring within the next {reminderDays} days
          </p>
        </Card>
      )}
    </div>
  );
};

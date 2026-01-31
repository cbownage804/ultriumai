import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { 
  Clock, Calendar as CalendarIcon, MessageSquare, Plus, Trash2, 
  Sun, Moon, Coffee, AlertTriangle, CheckCircle, Save, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

interface Holiday {
  id: string;
  name: string;
  date: Date;
  autoReply: string;
}

interface AutoReplyConfig {
  afterHoursEnabled: boolean;
  afterHoursMessage: string;
  holidayEnabled: boolean;
  holidayMessage: string;
  acknowledgement: boolean;
  estimatedResponse: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

// Default business hours
const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '10:00', end: '14:00' },
  sunday: { enabled: false, start: '10:00', end: '14:00' }
};

export function BusinessHoursCalendar() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(DEFAULT_SCHEDULE);
  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: '1', name: 'New Year\'s Day', date: new Date(2026, 0, 1), autoReply: 'Happy New Year! Our office is closed today. We\'ll respond on the next business day.' },
    { id: '2', name: 'Christmas Day', date: new Date(2025, 11, 25), autoReply: 'Merry Christmas! Our team is enjoying the holiday. We\'ll be back soon!' },
  ]);
  const [autoReply, setAutoReply] = useState<AutoReplyConfig>({
    afterHoursEnabled: true,
    afterHoursMessage: 'Thank you for contacting us! Our support team is currently offline. We operate {{hours}} and will respond to your message during our next business day. For emergencies, please call our 24/7 hotline.',
    holidayEnabled: true,
    holidayMessage: 'We are currently closed for {{holiday}}. We will respond to your inquiry when we return. Thank you for your patience!',
    acknowledgement: true,
    estimatedResponse: '4 hours'
  });
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: undefined as Date | undefined, autoReply: '' });
  const [showPreview, setShowPreview] = useState(false);

  const updateDaySchedule = (day: string, updates: Partial<DaySchedule>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
  };

  const addHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    const holiday: Holiday = {
      id: crypto.randomUUID(),
      name: newHoliday.name,
      date: newHoliday.date,
      autoReply: newHoliday.autoReply || autoReply.holidayMessage.replace('{{holiday}}', newHoliday.name)
    };
    setHolidays([...holidays, holiday]);
    setNewHoliday({ name: '', date: undefined, autoReply: '' });
    setIsAddHolidayOpen(false);
    toast.success('Holiday added');
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
    toast.success('Holiday removed');
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const dayName = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const daySchedule = schedule[dayName];
    
    // Check if today is a holiday
    const todayHoliday = holidays.find(h => 
      isToday(h.date) || format(h.date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
    );
    if (todayHoliday) {
      return { status: 'holiday', message: todayHoliday.name, color: 'bg-purple-500' };
    }
    
    if (!daySchedule.enabled) {
      return { status: 'closed', message: 'Closed today', color: 'bg-red-500' };
    }
    
    const currentTime = format(now, 'HH:mm');
    if (currentTime >= daySchedule.start && currentTime <= daySchedule.end) {
      // Check if currently on break
      if (daySchedule.breakStart && daySchedule.breakEnd) {
        if (currentTime >= daySchedule.breakStart && currentTime <= daySchedule.breakEnd) {
          return { status: 'break', message: 'On break', color: 'bg-yellow-500' };
        }
      }
      return { status: 'open', message: 'Open now', color: 'bg-green-500' };
    }
    
    return { status: 'closed', message: 'After hours', color: 'bg-orange-500' };
  };

  const getBusinessHoursSummary = () => {
    const activeDays = DAYS.filter(day => schedule[day].enabled);
    if (activeDays.length === 0) return 'No active hours';
    
    const firstDay = DAY_LABELS[activeDays[0]].slice(0, 3);
    const lastDay = DAY_LABELS[activeDays[activeDays.length - 1]].slice(0, 3);
    const times = schedule[activeDays[0]];
    
    return `${firstDay}-${lastDay}, ${times.start} - ${times.end}`;
  };

  const currentStatus = getCurrentStatus();

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Business Hours & Holidays</h2>
            <p className="text-sm text-muted-foreground">Configure support availability and auto-replies</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn('px-3 py-1', currentStatus.color)}>
            {currentStatus.status === 'open' && <CheckCircle className="h-3 w-3 mr-1" />}
            {currentStatus.status === 'closed' && <Moon className="h-3 w-3 mr-1" />}
            {currentStatus.status === 'break' && <Coffee className="h-3 w-3 mr-1" />}
            {currentStatus.status === 'holiday' && <Sun className="h-3 w-3 mr-1" />}
            {currentStatus.message}
          </Badge>
          <Button onClick={() => toast.success('Settings saved')} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule" className="gap-2">
            <Clock className="h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Holidays
          </TabsTrigger>
          <TabsTrigger value="autoreplies" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Auto-Replies
          </TabsTrigger>
        </TabsList>

        {/* Weekly Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Business Hours</CardTitle>
              <CardDescription>Set your support team's operating hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                    schedule[day].enabled ? "bg-card" : "bg-muted/50"
                  )}
                >
                  <Switch
                    checked={schedule[day].enabled}
                    onCheckedChange={(checked) => updateDaySchedule(day, { enabled: checked })}
                  />
                  <span className="w-24 font-medium">{DAY_LABELS[day]}</span>
                  
                  {schedule[day].enabled ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Start</Label>
                        <Input
                          type="time"
                          value={schedule[day].start}
                          onChange={(e) => updateDaySchedule(day, { start: e.target.value })}
                          className="w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">End</Label>
                        <Input
                          type="time"
                          value={schedule[day].end}
                          onChange={(e) => updateDaySchedule(day, { end: e.target.value })}
                          className="w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-4 border-l pl-4">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={schedule[day].breakStart || ''}
                          onChange={(e) => updateDaySchedule(day, { breakStart: e.target.value })}
                          className="w-28"
                          placeholder="Break"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={schedule[day].breakEnd || ''}
                          onChange={(e) => updateDaySchedule(day, { breakEnd: e.target.value })}
                          className="w-28"
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Closed</span>
                  )}
                </div>
              ))}

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    DAYS.forEach(day => {
                      if (['saturday', 'sunday'].includes(day)) {
                        updateDaySchedule(day, { enabled: false });
                      } else {
                        updateDaySchedule(day, { enabled: true, start: '09:00', end: '17:00' });
                      }
                    });
                    toast.success('Applied standard business hours');
                  }}
                >
                  Set Standard (Mon-Fri 9-5)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    DAYS.forEach(day => updateDaySchedule(day, { enabled: true, start: '08:00', end: '20:00' }));
                    toast.success('Applied extended hours');
                  }}
                >
                  Extended Hours (8AM-8PM)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    DAYS.forEach(day => updateDaySchedule(day, { enabled: true, start: '00:00', end: '23:59' }));
                    toast.success('Applied 24/7 support');
                  }}
                >
                  24/7 Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays */}
        <TabsContent value="holidays" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Holiday Calendar</h3>
              <p className="text-sm text-muted-foreground">Mark days when support is unavailable</p>
            </div>
            <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Holiday Name *</Label>
                    <Input
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                      placeholder="e.g., Independence Day"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newHoliday.date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newHoliday.date ? format(newHoliday.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newHoliday.date}
                          onSelect={(date) => setNewHoliday({ ...newHoliday, date })}
                          disabled={(date) => isBefore(date, startOfDay(new Date()))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Auto-Reply (optional)</Label>
                    <Textarea
                      value={newHoliday.autoReply}
                      onChange={(e) => setNewHoliday({ ...newHoliday, autoReply: e.target.value })}
                      placeholder="Leave blank to use default holiday message"
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" onClick={addHoliday}>
                    Add Holiday
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Holiday List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                {holidays.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No holidays configured</p>
                ) : (
                  <div className="space-y-3">
                    {holidays
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((holiday) => {
                        const isPast = isBefore(holiday.date, startOfDay(new Date()));
                        return (
                          <div
                            key={holiday.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isPast ? "bg-muted/50 opacity-60" : "bg-card"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/20">
                                <Sun className="h-4 w-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium">{holiday.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(holiday.date, 'EEEE, MMMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHoliday(holiday.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="multiple"
                  selected={holidays.map(h => h.date)}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    holiday: holidays.map(h => h.date)
                  }}
                  modifiersStyles={{
                    holiday: { backgroundColor: 'hsl(var(--primary))', color: 'white', borderRadius: '50%' }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Auto-Replies */}
        <TabsContent value="autoreplies" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {/* After Hours */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    After Hours Message
                  </CardTitle>
                  <Switch
                    checked={autoReply.afterHoursEnabled}
                    onCheckedChange={(v) => setAutoReply({ ...autoReply, afterHoursEnabled: v })}
                  />
                </div>
                <CardDescription>Sent when tickets are created outside business hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={autoReply.afterHoursMessage}
                  onChange={(e) => setAutoReply({ ...autoReply, afterHoursMessage: e.target.value })}
                  rows={5}
                  disabled={!autoReply.afterHoursEnabled}
                  placeholder="Enter your after-hours auto-reply message..."
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Available variables:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{"{{hours}}"}</Badge>
                    <Badge variant="secondary" className="text-xs">{"{{customer_name}}"}</Badge>
                    <Badge variant="secondary" className="text-xs">{"{{ticket_id}}"}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Holiday Message */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Holiday Message
                  </CardTitle>
                  <Switch
                    checked={autoReply.holidayEnabled}
                    onCheckedChange={(v) => setAutoReply({ ...autoReply, holidayEnabled: v })}
                  />
                </div>
                <CardDescription>Default message for tickets during holidays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={autoReply.holidayMessage}
                  onChange={(e) => setAutoReply({ ...autoReply, holidayMessage: e.target.value })}
                  rows={5}
                  disabled={!autoReply.holidayEnabled}
                  placeholder="Enter your holiday auto-reply message..."
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Available variables:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{"{{holiday}}"}</Badge>
                    <Badge variant="secondary" className="text-xs">{"{{return_date}}"}</Badge>
                    <Badge variant="secondary" className="text-xs">{"{{customer_name}}"}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Response Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Send Acknowledgement</Label>
                    <p className="text-sm text-muted-foreground">Automatically confirm ticket receipt to customers</p>
                  </div>
                  <Switch
                    checked={autoReply.acknowledgement}
                    onCheckedChange={(v) => setAutoReply({ ...autoReply, acknowledgement: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Estimated Response Time</Label>
                    <p className="text-sm text-muted-foreground">Include expected response time in auto-replies</p>
                  </div>
                  <Input
                    value={autoReply.estimatedResponse}
                    onChange={(e) => setAutoReply({ ...autoReply, estimatedResponse: e.target.value })}
                    className="w-32"
                    placeholder="e.g., 4 hours"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Message Preview
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </div>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/20">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Auto-Reply Bot</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {autoReply.afterHoursMessage
                            .replace('{{hours}}', getBusinessHoursSummary())
                            .replace('{{customer_name}}', 'John')
                            .replace('{{ticket_id}}', 'TKT-001')}
                        </p>
                        {autoReply.estimatedResponse && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Expected response time: {autoReply.estimatedResponse}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

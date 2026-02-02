import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, Plus, Clock, Users, Phone, 
  ChevronLeft, ChevronRight, User, Shield, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
}

interface OnCallShift {
  id: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
  type: 'primary' | 'backup';
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@company.com', phone: '+1-555-0101', role: 'Senior Engineer' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', phone: '+1-555-0102', role: 'DevOps Lead' },
  { id: '3', name: 'Mike Wilson', email: 'mike@company.com', phone: '+1-555-0103', role: 'Network Admin' },
  { id: '4', name: 'Emily Brown', email: 'emily@company.com', phone: '+1-555-0104', role: 'Systems Engineer' },
];

const generateShifts = (): OnCallShift[] => {
  const shifts: OnCallShift[] = [];
  let currentDate = startOfWeek(new Date());
  
  for (let i = 0; i < 8; i++) {
    shifts.push({
      id: `shift-${i}`,
      memberId: mockTeam[i % mockTeam.length].id,
      startDate: currentDate,
      endDate: addDays(currentDate, 7),
      type: 'primary'
    });
    shifts.push({
      id: `shift-backup-${i}`,
      memberId: mockTeam[(i + 1) % mockTeam.length].id,
      startDate: currentDate,
      endDate: addDays(currentDate, 7),
      type: 'backup'
    });
    currentDate = addWeeks(currentDate, 1);
  }
  
  return shifts;
};

export function OnCallScheduleManager() {
  const { toast } = useToast();
  const [team] = useState(mockTeam);
  const [shifts, setShifts] = useState(generateShifts);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getCurrentOnCall = () => {
    const now = new Date();
    return shifts.find(s => 
      s.type === 'primary' && 
      s.startDate <= now && 
      s.endDate > now
    );
  };

  const getBackupOnCall = () => {
    const now = new Date();
    return shifts.find(s => 
      s.type === 'backup' && 
      s.startDate <= now && 
      s.endDate > now
    );
  };

  const getMemberById = (id: string) => team.find(m => m.id === id);

  const currentPrimary = getCurrentOnCall();
  const currentBackup = getBackupOnCall();
  const primaryMember = currentPrimary ? getMemberById(currentPrimary.memberId) : null;
  const backupMember = currentBackup ? getMemberById(currentBackup.memberId) : null;

  const getWeekShifts = (weekStart: Date) => {
    return shifts.filter(s => 
      s.startDate >= weekStart && 
      s.startDate < addWeeks(weekStart, 1)
    );
  };

  const weeks = Array.from({ length: 8 }, (_, i) => addWeeks(currentWeek, i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">On-Call Schedule</h2>
          <p className="text-muted-foreground">Manage on-call rotations and automatic alert routing</p>
        </div>
        <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Shift</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add On-Call Shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Team Member</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {team.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shift Type</Label>
                <Select defaultValue="primary">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary On-Call</SelectItem>
                    <SelectItem value="backup">Backup On-Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date Range</Label>
                <Calendar 
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className="rounded-md border"
                />
              </div>
              <Button className="w-full" onClick={() => setShowAddShift(false)}>
                Add Shift
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current On-Call */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-green-400 mb-4">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Primary On-Call</span>
              <Badge className="bg-green-500/20 text-green-400">Active Now</Badge>
            </div>
            {primaryMember && (
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{primaryMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{primaryMember.name}</h3>
                  <p className="text-muted-foreground">{primaryMember.role}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {primaryMember.phone}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-green-500/20 text-sm text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Until {currentPrimary ? format(currentPrimary.endDate, 'MMM d, h:mm a') : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-blue-400 mb-4">
              <User className="h-5 w-5" />
              <span className="font-semibold">Backup On-Call</span>
            </div>
            {backupMember && (
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{backupMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{backupMember.name}</h3>
                  <p className="text-muted-foreground">{backupMember.role}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {backupMember.phone}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-blue-500/20 text-sm text-muted-foreground">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Escalated if primary doesn't respond in 15 min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Rotation Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, -4))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentWeek(startOfWeek(new Date()))}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 4))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {weeks.map(weekStart => {
                const weekShifts = getWeekShifts(weekStart);
                const primary = weekShifts.find(s => s.type === 'primary');
                const backup = weekShifts.find(s => s.type === 'backup');
                const primaryM = primary ? getMemberById(primary.memberId) : null;
                const backupM = backup ? getMemberById(backup.memberId) : null;
                const isCurrentWeek = weekStart <= new Date() && addWeeks(weekStart, 1) > new Date();

                return (
                  <div 
                    key={weekStart.toISOString()} 
                    className={`flex items-center gap-4 p-4 rounded-lg ${isCurrentWeek ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                  >
                    <div className="w-48">
                      <p className="font-medium">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
                      </p>
                      {isCurrentWeek && (
                        <Badge className="bg-primary/20 text-primary text-xs mt-1">Current Week</Badge>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="bg-green-500/10 text-green-400">Primary</Badge>
                        {primaryM && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{primaryM.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span>{primaryM.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400">Backup</Badge>
                        {backupM && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{backupM.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span>{backupM.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            On-Call Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {team.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <div className="text-sm text-right">
                  <p>{member.phone}</p>
                  <p className="text-muted-foreground">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

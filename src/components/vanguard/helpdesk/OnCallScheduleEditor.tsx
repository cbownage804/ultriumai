/**
 * On-Call Schedule Editor
 * Manage after-hours on-call rotations and schedules
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Clock, Phone, User, Plus, ChevronLeft, ChevronRight,
  Bell, AlertTriangle, CheckCircle2, RefreshCw, Users, Settings,
  Repeat, Moon, Sun, Edit, Trash2, Shield, PhoneCall, Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface OnCallMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  color: string;
}

interface OnCallRotation {
  id: string;
  name: string;
  description: string;
  rotation_type: 'daily' | 'weekly' | 'custom';
  members: string[];
  start_date: string;
  current_index: number;
  is_active: boolean;
  escalation_minutes: number;
}

interface OnCallOverride {
  id: string;
  rotation_id: string;
  original_member: string;
  override_member: string;
  start_time: string;
  end_time: string;
  reason: string;
}

// Data loaded from database - empty initial state
const initialMembers: OnCallMember[] = [];
const initialRotations: OnCallRotation[] = [];

export function OnCallScheduleEditor() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [rotations, setRotations] = useState<OnCallRotation[]>(initialRotations);
  const [members, setMembers] = useState<OnCallMember[]>(initialMembers);
  const [overrides, setOverrides] = useState<OnCallOverride[]>([]);
  const [showNewRotation, setShowNewRotation] = useState(false);
  const [showNewOverride, setShowNewOverride] = useState(false);
  const [selectedRotation, setSelectedRotation] = useState<OnCallRotation | null>(null);

  const [rotationForm, setRotationForm] = useState({
    name: '',
    description: '',
    rotation_type: 'weekly' as OnCallRotation['rotation_type'],
    members: [] as string[],
    escalation_minutes: 15,
    is_active: true
  });

  const [overrideForm, setOverrideForm] = useState({
    rotation_id: '',
    original_member: '',
    override_member: '',
    start_time: '',
    end_time: '',
    reason: ''
  });

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatWeekRange = () => {
    const days = getWeekDays();
    const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getOnCallForDay = (rotation: OnCallRotation, date: Date) => {
    const startDate = new Date(rotation.start_date);
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let index: number;
    if (rotation.rotation_type === 'daily') {
      index = daysDiff % rotation.members.length;
    } else {
      const weeksDiff = Math.floor(daysDiff / 7);
      index = weeksDiff % rotation.members.length;
    }
    
    return rotation.members[index];
  };

  const getMemberById = (id: string) => members.find(m => m.id === id);

  const toggleMemberInRotation = (memberId: string) => {
    setRotationForm(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(id => id !== memberId)
        : [...prev.members, memberId]
    }));
  };

  const handleCreateRotation = () => {
    if (!rotationForm.name || rotationForm.members.length < 2) {
      toast.error('Please provide a name and at least 2 members');
      return;
    }

    const newRotation: OnCallRotation = {
      id: `rot-${Date.now()}`,
      ...rotationForm,
      start_date: new Date().toISOString().split('T')[0],
      current_index: 0
    };

    setRotations(prev => [...prev, newRotation]);
    setShowNewRotation(false);
    setRotationForm({
      name: '',
      description: '',
      rotation_type: 'weekly',
      members: [],
      escalation_minutes: 15,
      is_active: true
    });
    toast.success('Rotation created');
  };

  const handleCreateOverride = () => {
    if (!overrideForm.rotation_id || !overrideForm.override_member || !overrideForm.start_time) {
      toast.error('Please fill in required fields');
      return;
    }

    const newOverride: OnCallOverride = {
      id: `ovr-${Date.now()}`,
      ...overrideForm
    };

    setOverrides(prev => [...prev, newOverride]);
    setShowNewOverride(false);
    setOverrideForm({
      rotation_id: '',
      original_member: '',
      override_member: '',
      start_time: '',
      end_time: '',
      reason: ''
    });
    toast.success('Override created');
  };

  const deleteRotation = (id: string) => {
    if (confirm('Are you sure you want to delete this rotation?')) {
      setRotations(prev => prev.filter(r => r.id !== id));
      toast.success('Rotation deleted');
    }
  };

  const toggleRotationActive = (id: string) => {
    setRotations(prev => prev.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    ));
  };

  const weekDays = getWeekDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-7 w-7 text-cyan-400" />
            On-Call Schedule
          </h2>
          <p className="text-white/60 mt-1">Manage after-hours rotations and escalations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNewOverride(true)}
            className="border-amber-500/30 text-amber-400"
          >
            <Repeat className="h-4 w-4 mr-2" />
            Add Override
          </Button>
          <Button
            onClick={() => setShowNewRotation(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Rotation
          </Button>
        </div>
      </div>

      {/* Currently On-Call Banner */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <PhoneCall className="h-6 w-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-white/60">Currently On-Call</p>
                <div className="flex items-center gap-3 mt-1">
                  {rotations.filter(r => r.is_active).map(rotation => {
                    const memberId = getOnCallForDay(rotation, new Date());
                    const member = getMemberById(memberId);
                    return member ? (
                      <div key={rotation.id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback style={{ backgroundColor: member.color + '30', color: member.color }}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-white/50">{rotation.name}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-white/50">Next Rotation</p>
                <p className="text-sm text-white/80">Monday 12:00 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-cyan-500/20">
          <TabsTrigger value="schedule" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="rotations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Repeat className="h-4 w-4 mr-2" />
            Rotations ({rotations.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="overrides" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Overrides ({overrides.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {/* Week Navigation */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="text-white/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <span className="font-medium text-white">{formatWeekRange()}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="text-white/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-white/10">
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className={`p-3 text-center border-r border-white/10 last:border-r-0 ${
                      day.toDateString() === new Date().toDateString() ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <p className="text-xs text-white/50">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-lg font-semibold ${
                      day.toDateString() === new Date().toDateString() ? 'text-cyan-400' : 'text-white'
                    }`}>
                      {day.getDate()}
                    </p>
                  </div>
                ))}
              </div>
              
              {rotations.filter(r => r.is_active).map(rotation => (
                <div key={rotation.id} className="grid grid-cols-7 border-b border-white/5 last:border-b-0">
                  {weekDays.map((day, i) => {
                    const memberId = getOnCallForDay(rotation, day);
                    const member = getMemberById(memberId);
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={i}
                        className={`p-3 border-r border-white/5 last:border-r-0 ${
                          isToday ? 'bg-cyan-500/5' : ''
                        }`}
                      >
                        {member && (
                          <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback style={{ backgroundColor: member.color + '30', color: member.color }}>
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                              <p className="text-xs font-medium text-white">{member.name.split(' ')[0]}</p>
                              <p className="text-[10px] text-white/40">{rotation.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rotations" className="space-y-4">
          <div className="grid gap-4">
            {rotations.map(rotation => (
              <Card key={rotation.id} className="bg-slate-900/50 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{rotation.name}</h3>
                        <Badge
                          variant="outline"
                          className={rotation.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }
                        >
                          {rotation.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                          {rotation.rotation_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/60 mb-3">{rotation.description}</p>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1 text-sm text-white/50">
                          <Clock className="h-4 w-4" />
                          Escalate after {rotation.escalation_minutes}m
                        </div>
                        <div className="flex items-center gap-1 text-sm text-white/50">
                          <Users className="h-4 w-4" />
                          {rotation.members.length} members
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {rotation.members.map(memberId => {
                          const member = getMemberById(memberId);
                          return member ? (
                            <Avatar key={memberId} className="h-8 w-8">
                              <AvatarFallback style={{ backgroundColor: member.color + '30', color: member.color }}>
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rotation.is_active}
                        onCheckedChange={() => toggleRotationActive(rotation.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/40 hover:text-cyan-400"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRotation(rotation.id)}
                        className="text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map(member => (
              <Card key={member.id} className="bg-slate-900/50 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{ backgroundColor: member.color + '30', color: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-white">{member.name}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          {overrides.length === 0 ? (
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="py-12 text-center">
                <Repeat className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No schedule overrides</p>
                <Button
                  variant="outline"
                  onClick={() => setShowNewOverride(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Override
                </Button>
              </CardContent>
            </Card>
          ) : (
            overrides.map(override => (
              <Card key={override.id} className="bg-slate-900/50 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {getMemberById(override.override_member)?.name} covering for {getMemberById(override.original_member)?.name}
                      </p>
                      <p className="text-sm text-white/50">
                        {new Date(override.start_time).toLocaleString()} - {new Date(override.end_time).toLocaleString()}
                      </p>
                      <p className="text-sm text-white/40 mt-1">{override.reason}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOverrides(prev => prev.filter(o => o.id !== override.id))}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* New Rotation Dialog */}
      <Dialog open={showNewRotation} onOpenChange={setShowNewRotation}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Repeat className="h-5 w-5 text-cyan-400" />
              New Rotation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Name</Label>
              <Input
                value={rotationForm.name}
                onChange={(e) => setRotationForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Primary On-Call"
                className="bg-slate-800/50 border-white/10 mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70">Description</Label>
              <Input
                value={rotationForm.description}
                onChange={(e) => setRotationForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this rotation..."
                className="bg-slate-800/50 border-white/10 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Rotation Type</Label>
                <Select
                  value={rotationForm.rotation_type}
                  onValueChange={(value) => setRotationForm(prev => ({ ...prev, rotation_type: value as OnCallRotation['rotation_type'] }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Escalation (minutes)</Label>
                <Input
                  type="number"
                  value={rotationForm.escalation_minutes}
                  onChange={(e) => setRotationForm(prev => ({ ...prev, escalation_minutes: parseInt(e.target.value) }))}
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/70">Members (select 2+)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    onClick={() => toggleMemberInRotation(member.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      rotationForm.members.includes(member.id)
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-slate-800/50 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback style={{ backgroundColor: member.color + '30', color: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white">{member.name}</span>
                    {rotationForm.members.includes(member.id) && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setShowNewRotation(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRotation} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                Create Rotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Override Dialog */}
      <Dialog open={showNewOverride} onOpenChange={setShowNewOverride}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Schedule Override
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Rotation</Label>
              <Select
                value={overrideForm.rotation_id}
                onValueChange={(value) => setOverrideForm(prev => ({ ...prev, rotation_id: value }))}
              >
                <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                  <SelectValue placeholder="Select rotation" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  {rotations.map(rotation => (
                    <SelectItem key={rotation.id} value={rotation.id}>
                      {rotation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Original Member</Label>
                <Select
                  value={overrideForm.original_member}
                  onValueChange={(value) => setOverrideForm(prev => ({ ...prev, original_member: value }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                    <SelectValue placeholder="Who's being covered" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Covering Member</Label>
                <Select
                  value={overrideForm.override_member}
                  onValueChange={(value) => setOverrideForm(prev => ({ ...prev, override_member: value }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                    <SelectValue placeholder="Who's covering" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Start</Label>
                <Input
                  type="datetime-local"
                  value={overrideForm.start_time}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, start_time: e.target.value }))}
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">End</Label>
                <Input
                  type="datetime-local"
                  value={overrideForm.end_time}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, end_time: e.target.value }))}
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/70">Reason</Label>
              <Input
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Vacation, sick leave..."
                className="bg-slate-800/50 border-white/10 mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setShowNewOverride(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOverride} className="bg-amber-500 hover:bg-amber-600 text-black">
                Create Override
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

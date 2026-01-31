/**
 * Dispatch Board Calendar
 * Visual drag-drop scheduling for field technicians
 */

import { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar, Clock, MapPin, User, Plus, ChevronLeft, ChevronRight,
  Truck, Phone, Mail, AlertTriangle, CheckCircle2, RefreshCw,
  Filter, List, Grid3X3, Wrench, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';

interface Technician {
  id: string;
  name: string;
  initials: string;
  color: string;
  phone?: string;
  email?: string;
  status: 'available' | 'busy' | 'offline';
  current_location?: string;
}

interface Appointment {
  id: string;
  title: string;
  customer_name: string;
  customer_address: string;
  start_time: string;
  end_time: string;
  technician_id: string;
  ticket_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

const mockTechnicians: Technician[] = [
  { id: 'tech-1', name: 'John Smith', initials: 'JS', color: '#06b6d4', status: 'available', phone: '555-0101' },
  { id: 'tech-2', name: 'Sarah Wilson', initials: 'SW', color: '#8b5cf6', status: 'busy', phone: '555-0102' },
  { id: 'tech-3', name: 'Mike Johnson', initials: 'MJ', color: '#f59e0b', status: 'available', phone: '555-0103' },
  { id: 'tech-4', name: 'Emily Davis', initials: 'ED', color: '#10b981', status: 'offline', phone: '555-0104' },
];

const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    title: 'Network Installation',
    customer_name: 'Acme Corp',
    customer_address: '123 Business Ave',
    start_time: '2024-01-30T09:00:00',
    end_time: '2024-01-30T11:00:00',
    technician_id: 'tech-1',
    ticket_id: 'TKT-001',
    status: 'scheduled',
    priority: 'high'
  },
  {
    id: 'apt-2',
    title: 'Server Maintenance',
    customer_name: 'TechStart Inc',
    customer_address: '456 Innovation Blvd',
    start_time: '2024-01-30T13:00:00',
    end_time: '2024-01-30T15:00:00',
    technician_id: 'tech-2',
    ticket_id: 'TKT-002',
    status: 'in_progress',
    priority: 'critical'
  },
  {
    id: 'apt-3',
    title: 'Workstation Setup',
    customer_name: 'DataFlow LLC',
    customer_address: '789 Data Drive',
    start_time: '2024-01-30T10:00:00',
    end_time: '2024-01-30T12:00:00',
    technician_id: 'tech-3',
    status: 'scheduled',
    priority: 'medium'
  },
];

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export function DispatchBoard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [technicians] = useState<Technician[]>(mockTechnicians);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ techId: string; time: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    customer_name: '',
    customer_address: '',
    start_time: '',
    end_time: '',
    technician_id: '',
    priority: 'medium' as Appointment['priority'],
    notes: ''
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getAppointmentsForSlot = (techId: string, time: string) => {
    return appointments.filter(apt => {
      const aptStart = new Date(apt.start_time);
      const slotHour = parseInt(time.split(':')[0]);
      return apt.technician_id === techId && aptStart.getHours() === slotHour;
    });
  };

  const getAppointmentDuration = (apt: Appointment) => {
    const start = new Date(apt.start_time);
    const end = new Date(apt.end_time);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const [techId, time] = result.destination.droppableId.split('|');
    const appointmentId = result.draggableId;

    setAppointments(prev => prev.map(apt => {
      if (apt.id === appointmentId) {
        const newStart = new Date(currentDate);
        const [hours] = time.split(':');
        newStart.setHours(parseInt(hours), 0, 0, 0);
        
        const duration = getAppointmentDuration(apt);
        const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);

        return {
          ...apt,
          technician_id: techId,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        };
      }
      return apt;
    }));

    toast.success('Appointment rescheduled');
  };

  const handleSlotClick = (techId: string, time: string) => {
    setSelectedSlot({ techId, time });
    const startDate = new Date(currentDate);
    const [hours] = time.split(':');
    startDate.setHours(parseInt(hours), 0, 0, 0);
    
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    setNewAppointment(prev => ({
      ...prev,
      technician_id: techId,
      start_time: startDate.toISOString().slice(0, 16),
      end_time: endDate.toISOString().slice(0, 16)
    }));
    setShowNewAppointment(true);
  };

  const handleCreateAppointment = () => {
    if (!newAppointment.title || !newAppointment.customer_name) {
      toast.error('Please fill in required fields');
      return;
    }

    const apt: Appointment = {
      id: `apt-${Date.now()}`,
      ...newAppointment,
      status: 'scheduled'
    };

    setAppointments(prev => [...prev, apt]);
    setShowNewAppointment(false);
    setNewAppointment({
      title: '',
      customer_name: '',
      customer_address: '',
      start_time: '',
      end_time: '',
      technician_id: '',
      priority: 'medium',
      notes: ''
    });
    toast.success('Appointment created');
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPriorityColor = (priority: Appointment['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-slate-500';
      default: return 'border-l-slate-500';
    }
  };

  const getTechStatusColor = (status: Technician['status']) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'busy': return 'bg-amber-500';
      case 'offline': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="h-7 w-7 text-cyan-400" />
            Dispatch Board
          </h2>
          <p className="text-white/60 mt-1">Schedule and manage field technician appointments</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-slate-800/50 border-white/10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-cyan-500/20">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowNewAppointment(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="bg-slate-900/50 border-cyan-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className={viewMode === 'day' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={viewMode === 'week' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                >
                  Week
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="text-white/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <span className="font-medium text-white">{formatDate(currentDate)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('next')}
                className="text-white/60"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="text-cyan-400 border-cyan-500/30"
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {technicians.map(tech => (
                <div key={tech.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50">
                  <div className={`w-2 h-2 rounded-full ${getTechStatusColor(tech.status)}`} />
                  <span className="text-sm text-white/70">{tech.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Card className="bg-slate-900/50 border-cyan-500/20 overflow-hidden">
          <ScrollArea className="h-[600px]">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="flex border-b border-white/10 bg-slate-800/50 sticky top-0 z-10">
                <div className="w-20 p-3 border-r border-white/10">
                  <Clock className="h-4 w-4 text-white/40 mx-auto" />
                </div>
                {technicians.map(tech => (
                  <div
                    key={tech.id}
                    className="flex-1 p-3 border-r border-white/10 last:border-r-0"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: tech.color + '30', color: tech.color }}>
                          {tech.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{tech.name}</p>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getTechStatusColor(tech.status)}`} />
                          <span className="text-xs text-white/50 capitalize">{tech.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map(time => (
                <div key={time} className="flex border-b border-white/5 min-h-[80px]">
                  <div className="w-20 p-3 border-r border-white/10 text-center">
                    <span className="text-sm text-white/50">{time}</span>
                  </div>
                  {technicians.map(tech => {
                    const slotAppointments = getAppointmentsForSlot(tech.id, time);
                    return (
                      <Droppable
                        key={`${tech.id}|${time}`}
                        droppableId={`${tech.id}|${time}`}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-1 border-r border-white/5 last:border-r-0 cursor-pointer transition-colors ${
                              snapshot.isDraggingOver ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                            }`}
                            onClick={() => slotAppointments.length === 0 && handleSlotClick(tech.id, time)}
                          >
                            {slotAppointments.map((apt, index) => (
                              <Draggable key={apt.id} draggableId={apt.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-2 rounded-md bg-slate-800/80 border border-white/10 border-l-4 ${getPriorityColor(apt.priority)} ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-cyan-500/50' : ''
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      height: `${getAppointmentDuration(apt) * 70}px`
                                    }}
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-xs font-medium text-white truncate flex-1">
                                        {apt.title}
                                      </span>
                                      <Badge variant="outline" className={`text-[10px] ml-1 ${getStatusColor(apt.status)}`}>
                                        {apt.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-white/50">
                                      <Building2 className="h-3 w-3" />
                                      {apt.customer_name}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{apt.customer_address}</span>
                                    </div>
                                    {apt.ticket_id && (
                                      <Badge variant="outline" className="text-[10px] mt-1 bg-purple-500/10 text-purple-400">
                                        {apt.ticket_id}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </DragDropContext>

      {/* Unassigned Appointments */}
      <Card className="bg-slate-900/50 border-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Unassigned Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {appointments.filter(apt => !apt.technician_id).length === 0 ? (
              <p className="text-white/40 text-sm">No unassigned appointments</p>
            ) : (
              appointments.filter(apt => !apt.technician_id).map(apt => (
                <Badge
                  key={apt.id}
                  variant="outline"
                  className="bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-move"
                >
                  {apt.title} - {apt.customer_name}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wrench className="h-5 w-5 text-cyan-400" />
              New Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Title *</Label>
              <Input
                value={newAppointment.title}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Network Installation"
                className="bg-slate-800/50 border-white/10 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Customer *</Label>
                <Input
                  value={newAppointment.customer_name}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Customer name"
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">Address</Label>
                <Input
                  value={newAppointment.customer_address}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, customer_address: e.target.value }))}
                  placeholder="Customer address"
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Start Time</Label>
                <Input
                  type="datetime-local"
                  value={newAppointment.start_time}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, start_time: e.target.value }))}
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">End Time</Label>
                <Input
                  type="datetime-local"
                  value={newAppointment.end_time}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, end_time: e.target.value }))}
                  className="bg-slate-800/50 border-white/10 mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Technician</Label>
                <Select
                  value={newAppointment.technician_id}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, technician_id: value }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTechStatusColor(tech.status)}`} />
                          {tech.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Priority</Label>
                <Select
                  value={newAppointment.priority}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, priority: value as Appointment['priority'] }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/70">Notes</Label>
              <Textarea
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
                className="bg-slate-800/50 border-white/10 mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setShowNewAppointment(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                Create Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

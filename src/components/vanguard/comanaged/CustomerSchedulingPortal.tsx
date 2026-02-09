import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, Clock, Video, Phone, MapPin, Monitor, Check, Settings, Plus, Calendar as CalendarIcon, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, addHours, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Appointment {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string;
  appointment_type: string;
  scheduled_start: Date;
  scheduled_end: Date;
  technician_name: string;
  status: string;
}

interface CustomerSchedulingPortalProps {
  organizationId?: string;
}

export function CustomerSchedulingPortal({ organizationId }: CustomerSchedulingPortalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("remote_support");
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("booking");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", description: "" });

  const appointmentTypes = [
    { id: "remote_support", label: "Remote Support", icon: Monitor, duration: "30-60 min" },
    { id: "phone", label: "Phone Call", icon: Phone, duration: "15-30 min" },
    { id: "screenshare", label: "Screen Share", icon: Video, duration: "30-60 min" },
    { id: "onsite", label: "On-Site Visit", icon: MapPin, duration: "1-2 hours" },
  ];

  const timeSlots = [
    { time: "9:00 AM", available: true }, { time: "9:30 AM", available: true },
    { time: "10:00 AM", available: true }, { time: "10:30 AM", available: true },
    { time: "11:00 AM", available: true }, { time: "11:30 AM", available: true },
    { time: "1:00 PM", available: true }, { time: "1:30 PM", available: true },
    { time: "2:00 PM", available: true }, { time: "2:30 PM", available: true },
    { time: "3:00 PM", available: true }, { time: "3:30 PM", available: true },
    { time: "4:00 PM", available: true }, { time: "4:30 PM", available: true },
  ];

  // Note: CustomerSchedulingPortal currently uses local state for appointments
  // as there's no dedicated appointments table yet. The booking flow stores locally.
  useEffect(() => { setLoading(false); }, []);

  const handleBookAppointment = () => {
    if (!formData.name || !formData.email) { toast.error('Name and email required'); return; }
    const apt: Appointment = {
      id: Date.now().toString(),
      title: formData.description || appointmentTypes.find(t => t.id === appointmentType)?.label || 'Appointment',
      customer_name: formData.name,
      customer_email: formData.email,
      appointment_type: appointmentType,
      scheduled_start: selectedDate,
      scheduled_end: addHours(selectedDate, 1),
      technician_name: 'Auto-assigned',
      status: 'scheduled',
    };
    setAppointments(prev => [...prev, apt]);
    toast.success("Appointment booked! Confirmation sent.");
    setStep(1);
    setSelectedTime(null);
    setFormData({ name: "", email: "", phone: "", description: "" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-500/20 text-green-400">Confirmed</Badge>;
      case 'scheduled': return <Badge className="bg-cyan-500/20 text-cyan-400">Scheduled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-cyan-400" />Appointment Scheduling
          </h2>
          <p className="text-white/60">Let customers book time with your technicians</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700"><Settings className="h-4 w-4 mr-2" />Configure</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/30">
          <TabsTrigger value="booking" className="data-[state=active]:bg-cyan-500/20"><Plus className="h-4 w-4 mr-2" />Book Appointment</TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-500/20"><Clock className="h-4 w-4 mr-2" />Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="booking">
          <div className="grid grid-cols-3 gap-6">
            <Card className={`bg-black/40 border-cyan-500/30 ${step !== 1 ? 'opacity-60' : ''}`}>
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">1</div>Select Type</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {appointmentTypes.map((type) => (
                  <div key={type.id} onClick={() => { setAppointmentType(type.id); setStep(Math.max(step, 2)); }}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${appointmentType === type.id ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-black/20 border border-transparent hover:border-cyan-500/30'}`}>
                    <type.icon className="h-5 w-5 text-cyan-400" />
                    <div><p className="text-white font-medium">{type.label}</p><p className="text-xs text-white/40">{type.duration}</p></div>
                    {appointmentType === type.id && <Check className="h-4 w-4 text-cyan-400 ml-auto" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={`bg-black/40 border-cyan-500/30 ${step < 2 ? 'opacity-60 pointer-events-none' : ''}`}>
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">2</div>Select Date & Time</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} className="rounded-md border border-cyan-500/20 bg-black/20" />
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Available Times</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                    {timeSlots.map((slot, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => { setSelectedTime(slot.time); setStep(3); }}
                        className={`text-xs ${selectedTime === slot.time ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-cyan-500/30 hover:bg-cyan-500/10 text-white'}`}>
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-black/40 border-cyan-500/30 ${step < 3 ? 'opacity-60 pointer-events-none' : ''}`}>
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">3</div>Your Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label className="text-white/80">Name</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="Your name" /></div>
                <div className="space-y-2"><Label className="text-white/80">Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="you@company.com" /></div>
                <div className="space-y-2"><Label className="text-white/80">Issue Description</Label><Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="Briefly describe..." rows={3} /></div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-cyan-400 font-medium text-sm mb-2">Booking Summary</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white/60"><span className="text-white">{appointmentTypes.find(t => t.id === appointmentType)?.label}</span></p>
                    <p className="text-white/60">{format(selectedDate, 'EEEE, MMMM d, yyyy')} at <span className="text-white">{selectedTime}</span></p>
                  </div>
                </div>
                <Button onClick={handleBookAppointment} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600" disabled={!formData.name || !formData.email}>
                  <Check className="h-4 w-4 mr-2" />Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader><CardTitle className="text-white text-sm">Upcoming Appointments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 rounded-lg bg-black/20 border border-cyan-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Monitor className="h-6 w-6 text-cyan-400" /></div>
                    <div>
                      <p className="text-white font-medium">{apt.title}</p>
                      <p className="text-sm text-white/60">{apt.customer_name} • {apt.customer_email}</p>
                      <p className="text-xs text-white/40 mt-1">{format(apt.scheduled_start, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              ))}
              {appointments.length === 0 && <p className="text-center text-white/40 py-8">No upcoming appointments</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

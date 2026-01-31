import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Clock, 
  Video, 
  Phone, 
  MapPin,
  Monitor,
  ChevronLeft,
  ChevronRight,
  User,
  Check,
  Settings,
  Plus,
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, addHours, isSameDay } from "date-fns";

interface TimeSlot {
  time: string;
  available: boolean;
  technician?: string;
}

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

export function CustomerSchedulingPortal() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("remote_support");
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("calendar");

  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      title: "Software Installation",
      customer_name: "Sarah Johnson",
      customer_email: "sarah@acmecorp.com",
      appointment_type: "remote_support",
      scheduled_start: addHours(new Date(), 2),
      scheduled_end: addHours(new Date(), 3),
      technician_name: "Alex Thompson",
      status: "confirmed"
    },
    {
      id: "2",
      title: "Network Setup",
      customer_name: "Michael Chen",
      customer_email: "m.chen@acmecorp.com",
      appointment_type: "onsite",
      scheduled_start: addDays(new Date(), 1),
      scheduled_end: addDays(addHours(new Date(), 2), 1),
      technician_name: "Jordan Lee",
      status: "scheduled"
    }
  ]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    location: ""
  });

  const appointmentTypes = [
    { id: "remote_support", label: "Remote Support", icon: Monitor, duration: "30-60 min", color: "cyan" },
    { id: "phone", label: "Phone Call", icon: Phone, duration: "15-30 min", color: "green" },
    { id: "screenshare", label: "Screen Share", icon: Video, duration: "30-60 min", color: "purple" },
    { id: "onsite", label: "On-Site Visit", icon: MapPin, duration: "1-2 hours", color: "amber" }
  ];

  const timeSlots: TimeSlot[] = [
    { time: "9:00 AM", available: true, technician: "Alex Thompson" },
    { time: "9:30 AM", available: false },
    { time: "10:00 AM", available: true, technician: "Jordan Lee" },
    { time: "10:30 AM", available: true, technician: "Alex Thompson" },
    { time: "11:00 AM", available: false },
    { time: "11:30 AM", available: true, technician: "Jordan Lee" },
    { time: "1:00 PM", available: true, technician: "Alex Thompson" },
    { time: "1:30 PM", available: true, technician: "Alex Thompson" },
    { time: "2:00 PM", available: false },
    { time: "2:30 PM", available: true, technician: "Jordan Lee" },
    { time: "3:00 PM", available: true, technician: "Alex Thompson" },
    { time: "3:30 PM", available: true, technician: "Jordan Lee" },
    { time: "4:00 PM", available: true, technician: "Alex Thompson" },
    { time: "4:30 PM", available: false }
  ];

  const handleBookAppointment = () => {
    toast.success("Appointment booked! Confirmation sent to your email.");
    setStep(1);
    setSelectedTime(null);
    setFormData({ name: "", email: "", phone: "", description: "", location: "" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-400">Confirmed</Badge>;
      case 'scheduled':
        return <Badge className="bg-cyan-500/20 text-cyan-400">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/20 text-purple-400">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500/20 text-gray-400">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    const t = appointmentTypes.find(at => at.id === type);
    if (!t) return Monitor;
    return t.icon;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-cyan-400" />
            Appointment Scheduling
          </h2>
          <p className="text-white/60">Let customers book time with your technicians</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Settings className="h-4 w-4 mr-2" />
          Configure Availability
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/30">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-cyan-500/20">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="booking" className="data-[state=active]:bg-cyan-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-500/20">
            <Clock className="h-4 w-4 mr-2" />
            Upcoming
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-white/40 text-sm py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => {
                  const date = addDays(startOfWeek(new Date()), i);
                  const hasAppointments = appointments.some(a => isSameDay(a.scheduled_start, date));
                  const isToday = isSameDay(date, new Date());
                  const isSelected = isSameDay(date, selectedDate);
                  
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 rounded-lg cursor-pointer transition-all min-h-[80px] ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : isToday
                            ? 'bg-purple-500/10 border border-purple-500/30'
                            : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
                      }`}
                    >
                      <span className={`text-sm ${isToday ? 'text-purple-400 font-bold' : 'text-white/60'}`}>
                        {format(date, 'd')}
                      </span>
                      {hasAppointments && (
                        <div className="mt-1">
                          {appointments
                            .filter(a => isSameDay(a.scheduled_start, date))
                            .slice(0, 2)
                            .map((apt, idx) => (
                              <div 
                                key={apt.id} 
                                className="text-xs px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 truncate mb-0.5"
                              >
                                {format(apt.scheduled_start, 'h:mm a')}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Flow */}
        <TabsContent value="booking">
          <div className="grid grid-cols-3 gap-6">
            {/* Step 1: Select Type */}
            <Card className={`bg-black/40 border-cyan-500/30 ${step !== 1 ? 'opacity-60' : ''}`}>
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">
                    1
                  </div>
                  Select Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointmentTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => {
                      setAppointmentType(type.id);
                      setStep(Math.max(step, 2));
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                      appointmentType === type.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-lg bg-${type.color}-500/20 flex items-center justify-center`}>
                      <type.icon className={`h-5 w-5 text-${type.color}-400`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{type.label}</p>
                      <p className="text-xs text-white/40">{type.duration}</p>
                    </div>
                    {appointmentType === type.id && (
                      <Check className="h-4 w-4 text-cyan-400 ml-auto" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Step 2: Select Date & Time */}
            <Card className={`bg-black/40 border-cyan-500/30 ${step < 2 ? 'opacity-60 pointer-events-none' : ''}`}>
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">
                    2
                  </div>
                  Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border border-cyan-500/20 bg-black/20"
                />
                
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Available Times</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                    {timeSlots.map((slot, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setStep(3);
                        }}
                        className={`text-xs ${
                          selectedTime === slot.time
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : slot.available
                              ? 'border-cyan-500/30 hover:bg-cyan-500/10 text-white'
                              : 'border-white/10 text-white/30'
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Details */}
            <Card className={`bg-black/40 border-cyan-500/30 ${step < 3 ? 'opacity-60 pointer-events-none' : ''}`}>
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">
                    3
                  </div>
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Issue Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="Briefly describe the issue..."
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-cyan-400 font-medium text-sm mb-2">Booking Summary</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white/60">
                      <span className="text-white">{appointmentTypes.find(t => t.id === appointmentType)?.label}</span>
                    </p>
                    <p className="text-white/60">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')} at <span className="text-white">{selectedTime}</span>
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleBookAppointment}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  disabled={!formData.name || !formData.email}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upcoming Appointments */}
        <TabsContent value="upcoming">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white text-sm">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointments.map((apt) => {
                const TypeIcon = getTypeIcon(apt.appointment_type);
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg bg-black/20 border border-cyan-500/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <TypeIcon className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{apt.title}</p>
                        <p className="text-sm text-white/60">{apt.customer_name} • {apt.customer_email}</p>
                        <p className="text-xs text-white/40 mt-1">
                          {format(apt.scheduled_start, 'EEEE, MMMM d, yyyy')} at {format(apt.scheduled_start, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-white/60">Technician</p>
                        <p className="text-white">{apt.technician_name}</p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

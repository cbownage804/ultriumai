import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MessageSquare, Clock, Send, Video, Phone, Plus, User, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  appointment_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string;
  meeting_link: string;
}

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export function ClientPortalEnhanced() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [bookingForm, setBookingForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    appointment_type: "support",
    scheduled_at: "",
    duration_minutes: 30,
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      loadChatMessages(selectedTicketId);
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`ticket-chat-${selectedTicketId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'vanguard_ticket_chat_messages',
            filter: `ticket_id=eq.${selectedTicketId}`
          },
          (payload) => {
            setChatMessages(prev => [...prev, payload.new as ChatMessage]);
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicketId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load appointments
      const { data: apptData } = await (supabase as any)
        .from('vanguard_portal_appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (apptData) setAppointments(apptData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (ticketId: string) => {
    const { data } = await (supabase as any)
      .from('vanguard_ticket_chat_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (data) {
      setChatMessages(data);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const bookAppointment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('vanguard_portal_appointments')
        .insert({
          user_id: user.id,
          ...bookingForm,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Appointment Booked",
        description: "Your appointment request has been submitted."
      });

      setShowBookingDialog(false);
      setBookingForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        appointment_type: "support",
        scheduled_at: "",
        duration_minutes: 30,
        notes: ""
      });
      loadData();

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive"
      });
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedTicketId) return;
    
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await (supabase as any)
        .from('vanguard_ticket_chat_messages')
        .insert({
          ticket_id: selectedTicketId,
          sender_type: 'customer',
          sender_id: user?.id,
          sender_name: user?.email || 'Customer',
          message: newMessage,
          is_internal: false
        });

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    await (supabase as any)
      .from('vanguard_portal_appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', appointmentId);

    setAppointments(prev => 
      prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a)
    );
    toast({ title: "Appointment Cancelled" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed': return <Badge className="bg-blue-500">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <Video className="h-4 w-4" />;
      case 'support': return <MessageSquare className="h-4 w-4" />;
      case 'training': return <User className="h-4 w-4" />;
      case 'review': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Ticket Chat
          </TabsTrigger>
        </TabsList>

        {/* Appointments */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Appointment Scheduling
                  </CardTitle>
                  <CardDescription>
                    Book consultations, support sessions, and training
                  </CardDescription>
                </div>
                <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Book an Appointment</DialogTitle>
                      <DialogDescription>
                        Schedule a session with our support team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Your Name</Label>
                        <Input
                          value={bookingForm.customer_name}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, customer_name: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={bookingForm.customer_email}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, customer_email: e.target.value }))}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone (Optional)</Label>
                        <Input
                          value={bookingForm.customer_phone}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label>Appointment Type</Label>
                        <Select
                          value={bookingForm.appointment_type}
                          onValueChange={(value) => setBookingForm(prev => ({ ...prev, appointment_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultation">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Consultation
                              </div>
                            </SelectItem>
                            <SelectItem value="support">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Support Session
                              </div>
                            </SelectItem>
                            <SelectItem value="training">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Training
                              </div>
                            </SelectItem>
                            <SelectItem value="review">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Account Review
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={bookingForm.scheduled_at}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Select
                            value={String(bookingForm.duration_minutes)}
                            onValueChange={(value) => setBookingForm(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Describe what you'd like to discuss..."
                        />
                      </div>
                      <Button onClick={bookAppointment} className="w-full">
                        Book Appointment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No appointments scheduled. Book one to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          {getAppointmentTypeIcon(appt.appointment_type)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{appt.appointment_type} Session</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(appt.scheduled_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>{appt.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(appt.status)}
                        {appt.status === 'confirmed' && appt.meeting_link && (
                          <Button size="sm" asChild>
                            <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </a>
                          </Button>
                        )}
                        {appt.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelAppointment(appt.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Chat */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ticket Chat
              </CardTitle>
              <CardDescription>
                Real-time messaging with support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Select a Ticket</Label>
                <Input
                  placeholder="Enter Ticket ID to start chatting..."
                  value={selectedTicketId || ""}
                  onChange={(e) => setSelectedTicketId(e.target.value || null)}
                />
              </div>

              {selectedTicketId ? (
                <div className="border rounded-lg">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No messages yet. Start the conversation!
                        </p>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender_type === 'customer'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {msg.sender_name}
                              </p>
                              <p>{msg.message}</p>
                              <p className="text-xs mt-1 opacity-50">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4 flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <Button onClick={sendChatMessage} disabled={isSending || !newMessage.trim()}>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Enter a ticket ID above to start chatting
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

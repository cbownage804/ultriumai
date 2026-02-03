/**
 * Customer Portal - Create New Ticket
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

export default function CustomerPortalNewTicket() {
  const navigate = useNavigate();
  const { session } = usePortalSession();
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-ticket-api', {
        body: { subject, description, priority, category },
        headers: {
          'x-portal-session': session.sessionToken
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Ticket created successfully!');
      navigate(`/customer-portal/tickets/${data.ticket.id}`);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/customer-portal/dashboard')}
            className="text-white/60 hover:text-white mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Create Support Ticket</CardTitle>
              <CardDescription className="text-white/60">
                Describe your issue and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white/80">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-white/80">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white/80">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white/80">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant information..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 resize-none"
                    required
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium text-sm">Before submitting</p>
                    <p className="text-amber-400/70 text-sm">
                      Please ensure you've included all relevant details. The more information you provide, the faster we can help!
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/customer-portal/dashboard')}
                    className="text-white/60 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !subject.trim() || !description.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

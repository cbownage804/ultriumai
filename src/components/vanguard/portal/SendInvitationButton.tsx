/**
 * Send Portal Invitation Button
 * Sends branded invitation email to a contact
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SendInvitationButtonProps {
  contactId: string;
  contactName: string;
  email: string;
  onSuccess?: () => void;
}

export function SendInvitationButton({ 
  contactId, 
  contactName, 
  email,
  onSuccess 
}: SendInvitationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-send-invitation', {
        body: {
          contactId,
          welcomeMessage: welcomeMessage.trim() || undefined,
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setIsSent(true);
      toast({
        title: 'Invitation Sent',
        description: `Portal invitation sent to ${email}`,
      });

      setTimeout(() => {
        setIsOpen(false);
        setIsSent(false);
        setWelcomeMessage('');
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: 'Failed to Send',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          Send Invitation
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-900 border-cyan-500/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-400" />
            Send Portal Invitation
          </DialogTitle>
          <DialogDescription>
            Send a branded invitation email to {contactName} ({email})
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
            <p className="text-white font-medium">Invitation Sent!</p>
            <p className="text-white/60 text-sm">Check their inbox</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-300">
                  The email will include:
                </p>
                <ul className="text-sm text-purple-300/70 mt-2 space-y-1">
                  <li>• Login credentials (temporary password)</li>
                  <li>• Link to the customer portal</li>
                  <li>• Your custom welcome message (optional)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome" className="text-white/80">
                  Custom Welcome Message (Optional)
                </Label>
                <Textarea
                  id="welcome"
                  placeholder="Add a personal message to include in the invitation..."
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white/60"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

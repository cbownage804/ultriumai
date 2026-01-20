/**
 * Password History - View previous passwords for an entry
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { supabase } from '@/integrations/supabase/client';
import { decryptData } from '@/utils/crypto';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Copy, Eye, EyeOff, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface HistoryEntry {
  id: string;
  password: string;
  strength: number;
  changed_at: string;
}

interface PasswordHistoryProps {
  entryId: string;
  entryTitle: string;
}

export const PasswordHistory = ({ entryId, entryTitle }: PasswordHistoryProps) => {
  const { user } = useAuth();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const loadHistory = async () => {
    if (!user || !isUnlocked || !entryId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('safepass_password_history')
        .select('*')
        .eq('entry_id', entryId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      const decrypted = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const decryptedData = await decryptData(item.encrypted_password as any, masterPassword!);
            const parsed = JSON.parse(decryptedData);
            return {
              id: item.id,
              password: parsed.password || '',
              strength: item.password_strength_score || 0,
              changed_at: item.changed_at
            };
          } catch {
            return null;
          }
        })
      );

      setHistory(decrypted.filter(Boolean) as HistoryEntry[]);
    } catch (error) {
      console.error('Failed to load password history');
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, entryId]);

  const toggleVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password);
    toast.success('Password copied');
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    if (strength >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Password History
          </DialogTitle>
          <DialogDescription>
            Previous passwords for "{entryTitle}"
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p>Unlock your vault to view history</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No password history</p>
            <p className="text-sm text-muted-foreground">
              History is saved when you update a password
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {history.map((item, index) => (
                <div 
                  key={item.id} 
                  className="p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.changed_at), 'MMM d, yyyy h:mm a')}
                    </div>
                    <span className={`text-xs font-medium ${getStrengthColor(item.strength)}`}>
                      {item.strength}% strength
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm bg-background px-2 py-1 rounded">
                      {visiblePasswords.has(item.id) 
                        ? item.password 
                        : '•'.repeat(Math.min(item.password.length, 16))}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleVisibility(item.id)}
                    >
                      {visiblePasswords.has(item.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyPassword(item.password)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordHistory;

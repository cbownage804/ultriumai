import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Shield, 
  Clock, 
  CheckCircle,
  Lock,
  Globe,
  User,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SharedCredential {
  id: string;
  entry_id: string;
  entry_title: string;
  owner_email: string;
  permission_level: string;
  shared_at: string;
  expires_at: string | null;
  website: string;
  username: string;
}

export const SharedPasswordAccess = () => {
  const { user } = useAuth();
  const [sharedCredentials, setSharedCredentials] = useState<SharedCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      loadSharedCredentials();
    }
  }, [user?.email]);

  const loadSharedCredentials = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const { data: sharedAccess, error } = await supabase
        .from('safepass_shared_access')
        .select('*')
        .eq('shared_with_email', user.email.toLowerCase());

      if (error) throw error;

      // Filter out expired entries client-side
      const validAccess = (sharedAccess || []).filter(access => 
        !access.expires_at || new Date(access.expires_at) > new Date()
      );

      // For each shared access, get the entry details
      const credentials: SharedCredential[] = [];
      for (const access of validAccess) {
        const { data: entry } = await supabase
          .from('safepass_entries')
          .select('id, title, url')
          .eq('id', access.entry_id)
          .single();

        if (entry) {
          credentials.push({
            id: access.id,
            entry_id: access.entry_id,
            entry_title: entry.title,
            owner_email: 'Owner',
            permission_level: access.permission_level,
            shared_at: access.shared_at,
            expires_at: access.expires_at,
            website: entry.url || '',
            username: ''
          });
        }
      }

      setSharedCredentials(credentials);
    } catch (error) {
      console.error('Failed to load shared credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCredential = async (credential: SharedCredential) => {
    try {
      // Update access tracking
      await supabase
        .from('safepass_shared_access')
        .update({ 
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', credential.id);

      toast.info('Use the Vault browser extension to autofill', {
        description: 'The extension fills credentials without showing the password',
        duration: 5000
      });

      setCopiedId(credential.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to access credential');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sharedCredentials.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Shared Passwords</h3>
          <p className="text-muted-foreground">
            When someone shares a password with you, it will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Shared With Me</h2>
        <p className="text-muted-foreground">
          Credentials shared with you. Use them without seeing the actual password.
        </p>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {sharedCredentials.map((credential, index) => {
            const isExpiringSoon = credential.expires_at && 
              new Date(credential.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{credential.entry_title}</h3>
                            {credential.website && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="truncate">{credential.website}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {credential.permission_level === 'view' ? 'View Only' : 'Can Edit'}
                            </Badge>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Username:</span>
                            <code className="text-sm bg-background px-2 py-0.5 rounded">••••••••</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Password:</span>
                            <code className="text-sm bg-background px-2 py-0.5 rounded">••••••••••••</code>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Shared {formatDistanceToNow(new Date(credential.shared_at), { addSuffix: true })}</span>
                            {credential.expires_at && (
                              <>
                                <span>•</span>
                                <span>Expires {formatDistanceToNow(new Date(credential.expires_at), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseCredential(credential)}
                            className="gap-2"
                          >
                            {copiedId === credential.id ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Ready</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Use Credential</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Install the Vault Extension</h4>
              <p className="text-sm text-muted-foreground">
                Autofill shared passwords directly without ever seeing them.
              </p>
            </div>
            <Button asChild variant="default" size="sm">
              <a href="/app/safepass/extension">Get Extension</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

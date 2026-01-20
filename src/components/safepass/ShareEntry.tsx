import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Share2, 
  UserPlus, 
  Trash2, 
  Clock,
  Shield,
  Eye,
  Edit,
  Loader2,
  Link,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SharedAccess {
  id: string;
  shared_with_email: string;
  shared_with_user_id: string | null;
  permission_level: string;
  shared_at: string;
  expires_at: string | null;
  access_count: number;
}

interface ShareEntryProps {
  entryId: string;
  entryTitle: string;
  vaultId: string;
}

export const ShareEntry = ({ entryId, entryTitle, vaultId }: ShareEntryProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([]);
  
  const [shareEmail, setShareEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [expiresIn, setExpiresIn] = useState('never');

  const loadSharedAccess = useCallback(async () => {
    if (!user || !entryId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('safepass_shared_access')
        .select('*')
        .eq('entry_id', entryId)
        .eq('owner_user_id', user.id);

      if (error) throw error;
      setSharedAccess(data || []);
    } catch (error) {
      console.error('Failed to load shared access');
    } finally {
      setIsLoading(false);
    }
  }, [user, entryId]);

  useEffect(() => {
    if (isOpen) {
      loadSharedAccess();
    }
  }, [isOpen, loadSharedAccess]);

  const handleShare = async () => {
    if (!user || !shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    try {
      // Calculate expiration date
      let expiresAt = null;
      if (expiresIn !== 'never') {
        const now = new Date();
        switch (expiresIn) {
          case '1h': expiresAt = new Date(now.getTime() + 60 * 60 * 1000); break;
          case '24h': expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
          case '7d': expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
          case '30d': expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); break;
        }
      }

      const { error } = await supabase
        .from('safepass_shared_access')
        .insert({
          vault_id: vaultId,
          entry_id: entryId,
          owner_user_id: user.id,
          shared_with_email: shareEmail.toLowerCase().trim(),
          permission_level: permission,
          expires_at: expiresAt?.toISOString() || null
        });

      if (error) throw error;

      toast.success(`Shared with ${shareEmail}`);
      setShareEmail('');
      loadSharedAccess();
    } catch (error: any) {
      console.error('Share failed:', error);
      if (error.code === '23505') {
        toast.error('Already shared with this email');
      } else {
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (accessId: string, email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;

    try {
      const { error } = await supabase
        .from('safepass_shared_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast.success('Access revoked');
      loadSharedAccess();
    } catch (error) {
      console.error('Revoke failed');
      toast.error('Failed to revoke access');
    }
  };

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'admin': return Shield;
      case 'edit': return Edit;
      default: return Eye;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" />
          {sharedAccess.length > 0 && (
            <span className="text-xs bg-primary/10 px-1.5 rounded-full">
              {sharedAccess.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share - {entryTitle}
          </DialogTitle>
          <DialogDescription>
            Share this password securely with others
          </DialogDescription>
        </DialogHeader>

        {/* Share Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Permission</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" /> View Only
                    </span>
                  </SelectItem>
                  <SelectItem value="edit">
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4" /> Can Edit
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Expires</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleShare} 
            disabled={isSharing || !shareEmail.trim()}
            className="w-full"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Share Password
              </>
            )}
          </Button>
        </div>

        {/* Shared With List */}
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : sharedAccess.length > 0 ? (
          <div className="space-y-2 mt-4">
            <Label>Shared With</Label>
            {sharedAccess.map((access) => {
              const PermIcon = getPermissionIcon(access.permission_level);
              const isExpired = access.expires_at && new Date(access.expires_at) < new Date();
              
              return (
                <Card key={access.id} className={`p-3 ${isExpired ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <PermIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{access.shared_with_email}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {access.permission_level}
                          </Badge>
                          {access.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {isExpired ? 'Expired' : `Expires ${formatDistanceToNow(new Date(access.expires_at), { addSuffix: true })}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(access.id, access.shared_with_email)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Not shared with anyone yet
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

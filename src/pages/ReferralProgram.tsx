import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Copy, Check, Users, TrendingUp, Award, Link2, Share2, Loader2 } from 'lucide-react';

interface Referral {
  id: string;
  referred_email: string | null;
  status: string;
  credits_earned: number;
  created_at: string;
}

export function ReferralProgram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode = user?.id?.slice(0, 8)?.toUpperCase() || 'LOADING';
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      setReferrals((data as Referral[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalEarned = referrals.filter(r => r.status === 'converted').reduce((s, r) => s + r.credits_earned, 0);
  const totalInvites = referrals.length;
  const totalConverted = referrals.filter(r => r.status === 'converted').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Share it with friends to earn credits.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted': return <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-[10px]">Converted</Badge>;
      case 'signed_up': return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 text-[10px]">Signed Up</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto">
          <Gift className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Refer a Friend</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Share UltriumAI with colleagues and earn <strong className="text-primary">50 bonus credits</strong> for every friend who signs up and subscribes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Invites Sent</p>
              <p className="text-2xl font-bold text-foreground">{totalInvites}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Converted</p>
              <p className="text-2xl font-bold text-foreground">{totalConverted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Credits Earned</p>
              <p className="text-2xl font-bold text-foreground">{totalEarned}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" /> Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-sm" />
            <Button onClick={handleCopy} variant="outline" className="shrink-0 gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              window.open(`mailto:?subject=Try UltriumAI&body=Check out UltriumAI: ${referralLink}`, '_blank');
            }}>
              <Share2 className="h-4 w-4" /> Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : referrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No referrals yet. Share your link to get started!</p>
          ) : (
            <div className="space-y-3">
              {referrals.map(ref => (
                <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ref.referred_email || 'Pending signup'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {ref.credits_earned > 0 && (
                      <span className="text-sm font-medium text-green-500">+{ref.credits_earned} credits</span>
                    )}
                    {getStatusBadge(ref.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">How it works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Send your unique referral link to friends and colleagues.' },
              { step: '2', title: 'They sign up', desc: 'Your friend creates an account and subscribes to any plan.' },
              { step: '3', title: 'You earn credits', desc: 'You both receive 50 bonus credits as a reward.' },
            ].map(s => (
              <div key={s.step} className="text-center space-y-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <h4 className="text-sm font-medium text-foreground">{s.title}</h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferralProgram;

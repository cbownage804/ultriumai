import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Gift, Copy, Users, DollarSign, CheckCircle2, Clock,
  Share2, Mail, Twitter, Linkedin, Trophy, Star, Send, Loader2, ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Referral {
  id: string;
  company: string;
  email: string;
  status: 'active' | 'pending' | 'expired';
  reward: number;
  date: string;
}

const initialReferrals: Referral[] = [
  { id: '1', company: 'TechFlow Inc', email: 'contact@techflow.io', status: 'active', reward: 500, date: 'Jan 15, 2024' },
  { id: '2', company: 'DataSync LLC', email: 'hello@datasync.com', status: 'pending', reward: 500, date: 'Feb 1, 2024' },
  { id: '3', company: 'CloudBase', email: 'team@cloudbase.io', status: 'active', reward: 500, date: 'Feb 10, 2024' },
];

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  expired: 'bg-slate-500/20 text-slate-400',
};

export default function VanguardReferrals() {
  const referralLink = 'https://vanguard.ultriumai.com/ref/VGMSP2024';
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  
  // Dialogs
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Form states
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState(
    `Hi,\n\nI've been using Vanguard for my MSP operations and thought you might find it valuable too. It's an all-in-one security and RMM platform that has significantly improved our efficiency.\n\nUse my referral link to get started: ${referralLink}\n\nBest regards`
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Referral Program | Vanguard';
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent('Check out Vanguard - the all-in-one security platform for MSPs! 🚀');
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    toast.success('Opening Twitter...');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    toast.success('Opening LinkedIn...');
  };

  const handleSendEmail = () => {
    if (!recipientEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      // Add as pending referral
      const newReferral: Referral = {
        id: Date.now().toString(),
        company: recipientEmail.split('@')[1]?.split('.')[0] || 'Unknown',
        email: recipientEmail,
        status: 'pending',
        reward: 500,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setReferrals([newReferral, ...referrals]);
      
      toast.success(`Referral email sent to ${recipientEmail}`);
      setShowEmailDialog(false);
      setRecipientEmail('');
      setIsLoading(false);
    }, 1500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vanguard - Security Platform for MSPs',
          text: 'Check out Vanguard - the all-in-one security and RMM platform!',
          url: referralLink,
        });
        toast.success('Thanks for sharing!');
      } catch (err) {
        // User cancelled
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const stats = [
    { label: 'Total Referrals', value: referrals.length, icon: Users, color: 'text-cyan-400' },
    { label: 'Active Referrals', value: referrals.filter(r => r.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Pending', value: referrals.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-amber-400' },
    { label: 'Total Earned', value: `$${referrals.filter(r => r.status === 'active').reduce((sum, r) => sum + r.reward, 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
  ];

  const rewards = [
    { tier: 'Bronze', referrals: '1-5', reward: '$500 per referral', icon: '🥉' },
    { tier: 'Silver', referrals: '6-10', reward: '$750 per referral', icon: '🥈' },
    { tier: 'Gold', referrals: '11-20', reward: '$1,000 per referral', icon: '🥇' },
    { tier: 'Diamond', referrals: '21+', reward: '$1,500 per referral', icon: '💎' },
  ];

  // Determine current tier
  const totalActive = referrals.filter(r => r.status === 'active').length;
  const currentTierIndex = totalActive >= 21 ? 3 : totalActive >= 11 ? 2 : totalActive >= 6 ? 1 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Gift className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Refer a Friend</h1>
            <p className="text-white/60 text-sm">Earn rewards for every successful referral</p>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/30 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-cyan-500/20 rounded-full">
                <Trophy className="h-12 w-12 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white">Earn up to $1,500 per referral</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Share Vanguard with fellow MSPs and earn rewards when they become paying customers. 
              The more you refer, the higher your rewards!
            </p>
            
            {/* Referral Link */}
            <div className="flex items-center gap-2 max-w-lg mx-auto mt-6">
              <Input 
                value={referralLink}
                readOnly
                className="bg-black/40 border-cyan-500/20 text-white text-center"
              />
              <Button onClick={copyLink} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="flex justify-center gap-3 mt-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => setShowEmailDialog(true)}
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                onClick={shareToTwitter}
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                onClick={shareToLinkedIn}
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reward Tiers */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              Reward Tiers
            </CardTitle>
            <CardDescription className="text-white/60">
              Unlock higher rewards as you refer more customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards.map((reward, i) => (
              <motion.div
                key={reward.tier}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-lg ${i === currentTierIndex ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-900/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        {reward.tier}
                        {i === currentTierIndex && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Current</Badge>
                        )}
                      </p>
                      <p className="text-white/60 text-sm">{reward.referrals} referrals</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400">{reward.reward}</Badge>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Your Referrals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.map((referral, i) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-slate-900/50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{referral.company}</p>
                    <p className="text-white/60 text-sm">{referral.email}</p>
                    <p className="text-white/40 text-xs mt-1">{referral.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColors[referral.status]}>
                      {referral.status}
                    </Badge>
                    {referral.status === 'active' && (
                      <p className="text-emerald-400 font-medium mt-1">${referral.reward}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {referrals.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No referrals yet</p>
                <p className="text-white/40 text-sm">Share your link to start earning!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Share Your Link', description: 'Send your unique referral link to fellow MSPs' },
              { step: '2', title: 'They Sign Up', description: 'When they become a paying customer, your referral is confirmed' },
              { step: '3', title: 'Get Rewarded', description: 'Receive your reward directly to your account' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-cyan-400 font-bold text-xl">{item.step}</span>
                </div>
                <h3 className="text-white font-medium mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Share Your Referral Link</DialogTitle>
            <DialogDescription className="text-white/60">
              Choose how you'd like to share your referral link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-cyan-500/20 text-white hover:bg-cyan-500/10"
              onClick={() => {
                setShowShareDialog(false);
                setShowEmailDialog(true);
              }}
            >
              <Mail className="h-6 w-6" />
              Email
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-cyan-500/20 text-white hover:bg-cyan-500/10"
              onClick={() => {
                shareToTwitter();
                setShowShareDialog(false);
              }}
            >
              <Twitter className="h-6 w-6" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-cyan-500/20 text-white hover:bg-cyan-500/10"
              onClick={() => {
                shareToLinkedIn();
                setShowShareDialog(false);
              }}
            >
              <Linkedin className="h-6 w-6" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-cyan-500/20 text-white hover:bg-cyan-500/10"
              onClick={() => {
                copyLink();
                setShowShareDialog(false);
              }}
            >
              <Copy className="h-6 w-6" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Send Referral Email</DialogTitle>
            <DialogDescription className="text-white/60">
              Invite someone to try Vanguard with a personalized email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Recipient Email</Label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Message</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEmailDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

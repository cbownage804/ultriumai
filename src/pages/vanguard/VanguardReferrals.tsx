import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, Copy, Users, DollarSign, CheckCircle2, Clock,
  Share2, Mail, Twitter, Linkedin, Trophy, Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const referrals = [
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
  const { toast } = useToast();
  const referralLink = 'https://vanguard.ultriumai.com/ref/VGMSP2024';

  useEffect(() => {
    document.title = 'Refer a Friend | Ultrium Vanguard';
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Link Copied!',
      description: 'Referral link copied to clipboard',
    });
  };

  const stats = [
    { label: 'Total Referrals', value: 12, icon: Users, color: 'text-cyan-400' },
    { label: 'Active Referrals', value: 8, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Pending', value: 4, icon: Clock, color: 'text-amber-400' },
    { label: 'Total Earned', value: '$4,000', icon: DollarSign, color: 'text-green-400' },
  ];

  const rewards = [
    { tier: 'Bronze', referrals: '1-5', reward: '$500 per referral', icon: '🥉' },
    { tier: 'Silver', referrals: '6-10', reward: '$750 per referral', icon: '🥈' },
    { tier: 'Gold', referrals: '11-20', reward: '$1,000 per referral', icon: '🥇' },
    { tier: 'Diamond', referrals: '21+', reward: '$1,500 per referral', icon: '💎' },
  ];

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
              <Button variant="outline" size="icon" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
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
                className={`p-4 rounded-lg ${i === 0 ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-900/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <p className="text-white font-medium">{reward.tier}</p>
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
                    <Badge className={statusColors[referral.status as keyof typeof statusColors]}>
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
    </div>
  );
}

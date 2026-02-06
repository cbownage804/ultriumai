import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Crown, Users, DollarSign, Building2, ArrowRight, Check, 
  TrendingUp, Package, Shield, Sparkles, Upload, Loader2 
} from 'lucide-react';
import { RESELLER_TIERS, MODULE_ADDONS, ADDON_BUNDLES, calculateResellerMargin, getBundleSavings } from '@/config/vanguardAddons';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { uploadModuleLogos } from '@/utils/uploadModuleLogos';
import { useToast } from '@/hooks/use-toast';

export default function VanguardPartnerProgram() {
  useEffect(() => {
    document.title = 'Partner Program | Ultrium Vanguard';
  }, []);

  const [seats, setSeats] = useState(25);
  const [resalePrice, setResalePrice] = useState(12);
  const [uploadingLogos, setUploadingLogos] = useState(false);
  const { toast } = useToast();
  const selectedAddon = MODULE_ADDONS[0]; // Pursuit XDR as default example
  const wholesalePrice = selectedAddon.monthlyPricePerUser;

  // Determine tier based on seats
  const currentTier = [...RESELLER_TIERS].reverse().find(t => seats >= t.minSeats) || RESELLER_TIERS[0];
  const discountedWholesale = wholesalePrice * (1 - currentTier.discountPercent / 100);
  const margin = calculateResellerMargin(discountedWholesale, resalePrice, seats);

  const handleUploadLogos = async () => {
    setUploadingLogos(true);
    try {
      const { results } = await uploadModuleLogos();
      toast({
        title: 'Logo Upload Complete',
        description: results.join('\n'),
      });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingLogos(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="border-b border-cyan-500/20 bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-amber-500/10">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-violet-600 border-0">
            <Crown className="h-3 w-3 mr-1" /> MSP Partner Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-white to-violet-400 bg-clip-text text-transparent">
            Resell Vanguard. Grow Your MRR.
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8">
            White-label our security modules and sell to your clients at your markup. 
            Volume discounts up to 35% off wholesale.
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-violet-600 hover:opacity-90">
              Apply to Partner Program <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleUploadLogos}
              disabled={uploadingLogos}
            >
              {uploadingLogos ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Sync Module Logos
            </Button>
          </div>
        </div>
      </div>

      {/* Partner Tiers */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Partner Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RESELLER_TIERS.map((tier) => (
              <Card key={tier.id} className={`bg-white/5 border-white/10 transition-all ${
                tier.id === currentTier.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : ''
              }`}>
                <CardHeader>
                  <Badge className={`w-fit mb-2 ${
                    tier.id === 'platinum' ? 'bg-violet-500/20 text-violet-300' :
                    tier.id === 'gold' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {tier.name}
                  </Badge>
                  <CardTitle className="text-white text-2xl">{tier.discountPercent}% Off</CardTitle>
                  <CardDescription className="text-white/60">
                    {tier.minSeats}+ seats minimum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-cyan-400" />
                    White-label: {tier.whiteLabel === 'full' ? 'Complete' : tier.whiteLabel === 'partial' ? 'Partial' : 'None'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-cyan-400" />
                    {tier.coBranding}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-cyan-400" />
                    Bulk licensing dashboard
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-cyan-400" />
                    Marketing kit access
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Margin Calculator */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Margin Calculator</h2>
          <p className="text-center text-white/60 mb-12">See your profit at different markups and volumes</p>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-white/70">Number of Seats</Label>
                  <Slider
                    value={[seats]}
                    onValueChange={(v) => setSeats(v[0])}
                    min={5}
                    max={200}
                    step={5}
                  />
                  <div className="flex justify-between text-sm text-white/50">
                    <span>{seats} seats</span>
                    <span className="text-cyan-400">{currentTier.name} ({currentTier.discountPercent}% off)</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-white/70">Your Resale Price (per user/mo)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">$</span>
                    <Input
                      type="number"
                      value={resalePrice}
                      onChange={(e) => setResalePrice(Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white"
                      min={1}
                    />
                  </div>
                  <p className="text-xs text-white/40">
                    Wholesale: ${discountedWholesale.toFixed(2)}/user/mo ({currentTier.discountPercent}% off ${wholesalePrice})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-400">${margin.monthlyMargin.toFixed(0)}</div>
                    <div className="text-xs text-white/50">Monthly Margin</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/30">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-cyan-400">${margin.annualMargin.toFixed(0)}</div>
                    <div className="text-xs text-white/50">Annual Margin</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-violet-500/30">
                  <CardContent className="p-4 text-center">
                    <Sparkles className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-violet-400">{margin.marginPercent}%</div>
                    <div className="text-xs text-white/50">Margin %</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Module Add-Ons Catalog */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Module Add-Ons</h2>
          <p className="text-center text-white/60 mb-12">Each module is available as a standalone add-on for your clients</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULE_ADDONS.map((addon) => (
              <Card key={addon.id} className="bg-white/5 border-white/10 hover:border-cyan-500/40 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <ModuleLogo module={addon.module} size="md" glow />
                    <div>
                      <CardTitle className="text-white text-sm">{addon.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                        {addon.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60 text-xs mb-3">{addon.description}</p>
                  <div className="text-lg font-bold text-cyan-400 mb-2">
                    ${addon.monthlyPricePerUser}<span className="text-xs text-white/50 font-normal">/user/mo</span>
                  </div>
                  <div className="space-y-1">
                    {addon.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                        <Check className="h-3 w-3 text-cyan-400" />
                        {f}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Bundles */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Strategic Bundles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ADDON_BUNDLES.map((bundle) => (
              <Card key={bundle.id} className="bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{bundle.name}</CardTitle>
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      Save {bundle.discountPercent}%
                    </Badge>
                  </div>
                  <CardDescription className="text-white/60">{bundle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-white">${bundle.monthlyPricePerUser}</span>
                    <span className="text-white/50">/user/mo</span>
                    <span className="text-sm text-white/40 line-through">${bundle.alaCartePricePerUser}</span>
                  </div>
                  <p className="text-sm text-green-400">
                    Save ${getBundleSavings(bundle)}/user/mo
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

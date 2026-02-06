import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Loader2, Sparkles, FileCheck, Presentation, Mail, BookOpen } from 'lucide-react';
import { useResellerPartner, useResellerMarketing } from '@/hooks/useResellerData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ASSET_TYPES = [
  { id: 'proposal', label: 'Sales Proposal', icon: FileText, description: 'Full client proposal with pricing and ROI analysis' },
  { id: 'one_pager', label: 'One-Pager', icon: FileCheck, description: 'Single-page product summary for quick pitches' },
  { id: 'slide_deck', label: 'Slide Deck', icon: Presentation, description: 'Presentation deck for client meetings' },
  { id: 'email_template', label: 'Email Template', icon: Mail, description: 'Outreach email for prospecting' },
  { id: 'case_study', label: 'Case Study', icon: BookOpen, description: 'Client success story template' },
] as const;

export default function MarketingKitGenerator() {
  const { partner } = useResellerPartner();
  const { assets } = useResellerMarketing(partner?.id);
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('proposal');
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    if (!partner) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-kit', {
        body: {
          partner_id: partner.id,
          asset_type: selectedType,
          client_name: clientName,
          industry,
          additional_context: additionalContext,
          partner_company: partner.company_name,
          partner_tier: partner.tier,
        },
      });
      if (error) throw error;
      toast({ title: 'Asset Generated', description: `Your ${selectedType.replace('_', ' ')} has been created.` });
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        <p>Join the Partner Program first to access marketing tools.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Marketing Kit Generator
        </h1>
        <p className="text-white/50 text-sm">Generate co-branded proposals, one-pagers, and sales collateral</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm">Create New Asset</CardTitle>
              <CardDescription className="text-white/40">AI-generated, co-branded with your company logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Type Selection */}
              <div>
                <Label className="text-white/70">Asset Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {ASSET_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all text-sm ${
                          isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-white/40'}`} />
                        <span className={isSelected ? 'text-white' : 'text-white/60'}>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Client/Prospect Name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/70">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Healthcare', 'Finance', 'Legal', 'Manufacturing', 'Retail', 'Education', 'Technology', 'Government', 'Other'].map(i => (
                        <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white/70">Additional Context</Label>
                <Textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="Specific pain points, compliance needs, or selling points to highlight..." className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
              </div>

              <Button onClick={handleGenerate} disabled={generating || !clientName} className="w-full bg-gradient-to-r from-amber-500 to-violet-600">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate {ASSET_TYPES.find(t => t.id === selectedType)?.label}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assets */}
        <div>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm">Recent Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No assets generated yet</p>
              ) : (
                <div className="space-y-2">
                  {assets.slice(0, 10).map(asset => {
                    const typeInfo = ASSET_TYPES.find(t => t.id === asset.asset_type);
                    const Icon = typeInfo?.icon || FileText;
                    return (
                      <div key={asset.id} className="flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                        <Icon className="h-4 w-4 text-white/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{asset.title}</div>
                          <div className="text-xs text-white/30">{new Date(asset.generated_at).toLocaleDateString()}</div>
                        </div>
                        {asset.file_url && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(asset.file_url!, '_blank')}>
                            <Download className="h-3 w-3 text-white/40" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 mt-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`border-0 text-xs ${
                  partner.tier === 'platinum' ? 'bg-violet-500/20 text-violet-400' :
                  partner.tier === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {partner.tier} partner
                </Badge>
              </div>
              <p className="text-xs text-white/40">
                {partner.tier === 'platinum' ? 'Full white-label — no UltriumAI branding' :
                 partner.tier === 'gold' ? 'Co-branded with your logo + "Powered by UltriumAI"' :
                 'Assets include UltriumAI branding badge'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

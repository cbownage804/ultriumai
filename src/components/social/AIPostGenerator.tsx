import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, Building2, Newspaper, FileCheck, Trophy, Shield, Pencil, Download } from 'lucide-react';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { cn } from '@/lib/utils';

import { Users, Home, Smartphone, CreditCard, Mail, Wifi } from 'lucide-react';

const CONTENT_TYPE_GROUPS = [
  {
    label: 'For Everyone',
    types: [
      { id: 'personal_safety', label: 'Personal Safety', description: 'Protect yourself & family online', icon: Home, color: 'text-green-400' },
      { id: 'password_tips', label: 'Password Tips', description: 'Simple password security advice', icon: Shield, color: 'text-blue-400' },
      { id: 'scam_alert', label: 'Scam Alert', description: 'Warn about common scams & fraud', icon: AlertTriangle, color: 'text-red-400' },
      { id: 'device_security', label: 'Device Security', description: 'Phone, laptop & smart device tips', icon: Smartphone, color: 'text-purple-400' },
      { id: 'privacy_tips', label: 'Privacy Tips', description: 'Protect your personal information', icon: Users, color: 'text-cyan-400' },
    ]
  },
  {
    label: 'For Small Businesses',
    types: [
      { id: 'smb_security', label: 'SMB Security', description: 'Security basics for small teams', icon: Building2, color: 'text-blue-400' },
      { id: 'payment_safety', label: 'Payment Safety', description: 'Protect business transactions', icon: CreditCard, color: 'text-emerald-400' },
      { id: 'email_security', label: 'Email Security', description: 'Avoid phishing & email threats', icon: Mail, color: 'text-yellow-400' },
      { id: 'network_basics', label: 'Network Basics', description: 'WiFi & network security tips', icon: Wifi, color: 'text-orange-400' },
    ]
  },
  {
    label: 'For MSPs & Enterprise',
    types: [
      { id: 'threat_alert', label: 'Threat Alert', description: 'New security threat or vulnerability', icon: AlertTriangle, color: 'text-red-400' },
      { id: 'service_highlight', label: 'Service Highlight', description: 'Showcase UltriumAI MSP services', icon: Building2, color: 'text-blue-400' },
      { id: 'industry_news', label: 'Industry News', description: 'Comment on cybersecurity news', icon: Newspaper, color: 'text-purple-400' },
      { id: 'compliance_update', label: 'Compliance Update', description: 'Regulatory and compliance info', icon: FileCheck, color: 'text-emerald-400' },
      { id: 'success_story', label: 'Success Story', description: 'Client success or use case', icon: Trophy, color: 'text-amber-400' },
    ]
  },
  {
    label: 'General',
    types: [
      { id: 'security_tip', label: 'Security Tip', description: 'Quick actionable security advice', icon: Lightbulb, color: 'text-yellow-400' },
      { id: 'awareness_campaign', label: 'Awareness Campaign', description: 'Cybersecurity awareness content', icon: Shield, color: 'text-cyan-400' },
      { id: 'custom_topic', label: 'Custom Topic', description: 'Write your own topic', icon: Pencil, color: 'text-muted-foreground' },
    ]
  }
];

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly & Approachable' },
  { id: 'urgent', label: 'Urgent & Alarming' },
  { id: 'educational', label: 'Educational' },
  { id: 'inspirational', label: 'Inspirational' },
];

interface AIPostGeneratorProps {
  onUseContent: (content: string, imageUrl?: string) => void;
}

export function AIPostGenerator({ onUseContent }: AIPostGeneratorProps) {
  const { generatePost, generateImage, bundleAccounts } = useSocialPosts();
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [tone, setTone] = useState('professional');
  const [additionalContext, setAdditionalContext] = useState('');

  const platformTypes = [...new Set(bundleAccounts?.map(a => a.platform) || [])];

  const handleGenerateBoth = async () => {
    // Find the content type from any group
    const allTypes = CONTENT_TYPE_GROUPS.flatMap(g => g.types);
    const contentType = allTypes.find(t => t.id === selectedType);
    const topic = contentType 
      ? `${contentType.description}${additionalContext ? `: ${additionalContext}` : ''}`
      : additionalContext || 'Professional cybersecurity content';

    // Generate both in parallel
    const [textResult, imageResult] = await Promise.all([
      generatePost.mutateAsync({
        topic,
        tone,
        platforms: platformTypes,
        additionalContext,
        contentType: selectedType,
      }),
      generateImage.mutateAsync({
        prompt: topic,
        aspectRatio: '16:9',
        contentType: selectedType,
      }),
    ]);
    
    // Send to composer
    onUseContent(textResult, imageResult);
  };

  const isGenerating = generatePost.isPending || generateImage.isPending;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Post Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate cybersecurity posts with auto-matching images (watermarked with UltriumAI logo)
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Content Type Groups */}
        <div className="space-y-4">
          <Label className="text-sm block">Content Type</Label>
          {CONTENT_TYPE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{group.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.types.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(isSelected ? null : type.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border/50 hover:border-border hover:bg-muted/30"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", type.color)} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{type.label}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{type.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tone Selector */}
        <div>
          <Label htmlFor="tone">Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Context */}
        <div>
          <Label htmlFor="context">Additional Context (optional)</Label>
          <Textarea
            id="context"
            placeholder="Any specific details, statistics, hashtags, or mentions to include..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Watermark Notice */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Download className="h-4 w-4 shrink-0" />
          <span>Generated images include UltriumAI watermark automatically</span>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          onClick={handleGenerateBoth}
          disabled={!selectedType || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate Post & Image
        </Button>
      </CardContent>
    </Card>
  );
}

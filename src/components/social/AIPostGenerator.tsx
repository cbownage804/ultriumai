import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Image as ImageIcon, Wand2, Copy, Check } from 'lucide-react';
import { useSocialPosts } from '@/hooks/useSocialPosts';

const TOPIC_PRESETS = [
  { id: 'threat_alert', label: '🚨 Threat Alert', description: 'Recent cybersecurity threat or vulnerability' },
  { id: 'security_tip', label: '💡 Security Tip', description: 'Actionable security advice for users' },
  { id: 'product_update', label: '🚀 Product Update', description: 'New feature or product announcement' },
  { id: 'industry_news', label: '📰 Industry News', description: 'Cybersecurity news and trends' },
  { id: 'thought_leadership', label: '🧠 Thought Leadership', description: 'Expert insights and opinions' },
  { id: 'customer_success', label: '⭐ Customer Success', description: 'Success stories and testimonials' },
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
  
  const [topic, setTopic] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [tone, setTone] = useState('professional');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const platformTypes = [...new Set(bundleAccounts?.map(a => a.platform) || [])];

  const handleGenerate = async () => {
    const finalTopic = selectedPreset 
      ? `${TOPIC_PRESETS.find(p => p.id === selectedPreset)?.description}: ${topic}`
      : topic;

    const result = await generatePost.mutateAsync({
      topic: finalTopic,
      tone,
      platforms: platformTypes,
      additionalContext,
    });
    
    setGeneratedContent(result);
  };

  const handleGenerateImage = async () => {
    const imagePrompt = topic || generatedContent.substring(0, 100);
    const result = await generateImage.mutateAsync({
      prompt: imagePrompt,
      aspectRatio: '16:9',
    });
    setGeneratedImage(result);
  };

  const handleGenerateBoth = async () => {
    // Generate both in parallel
    const finalTopic = selectedPreset 
      ? `${TOPIC_PRESETS.find(p => p.id === selectedPreset)?.description}: ${topic}`
      : topic;

    const [textResult] = await Promise.all([
      generatePost.mutateAsync({
        topic: finalTopic,
        tone,
        platforms: platformTypes,
        additionalContext,
      }),
      // Start image generation with topic
      generateImage.mutateAsync({
        prompt: topic || 'Professional cybersecurity technology concept',
        aspectRatio: '16:9',
      }).then(url => setGeneratedImage(url)),
    ]);
    
    setGeneratedContent(textResult);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseInComposer = () => {
    onUseContent(generatedContent, generatedImage || undefined);
  };

  const isGenerating = generatePost.isPending || generateImage.isPending;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Post Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Topic Presets */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Quick Topics</Label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_PRESETS.map((preset) => (
              <Badge
                key={preset.id}
                variant={selectedPreset === preset.id ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
              >
                {preset.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <Label htmlFor="topic">Topic / Subject</Label>
          <Input
            id="topic"
            placeholder="e.g., New ransomware variant affecting healthcare..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1"
          />
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
            placeholder="Any specific points to include, hashtags, or mentions..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>

        {/* Generate Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!topic || isGenerating}
          >
            {generatePost.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate Text
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateImage}
            disabled={!topic || isGenerating}
          >
            {generateImage.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            Generate Image
          </Button>
          <Button
            variant="secondary"
            onClick={handleGenerateBoth}
            disabled={!topic || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Both
          </Button>
        </div>

        {/* Generated Content Preview */}
        {generatedContent && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Generated Content</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="whitespace-pre-wrap text-sm">{generatedContent}</p>
            </div>
          </div>
        )}

        {/* Generated Image Preview */}
        {generatedImage && (
          <div className="mt-4 space-y-2">
            <Label>Generated Image</Label>
            <div className="relative rounded-lg overflow-hidden border border-border/50">
              <img 
                src={generatedImage} 
                alt="AI Generated" 
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        )}

        {/* Use in Composer Button */}
        {generatedContent && (
          <Button 
            className="w-full mt-4"
            onClick={handleUseInComposer}
          >
            Use in Composer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

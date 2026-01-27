import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Calendar, Clock, Twitter, Linkedin, Facebook, Instagram, AlertCircle } from 'lucide-react';
import { useSocialPosts, BundleAccount } from '@/hooks/useSocialPosts';
import { ImageUploader } from './ImageUploader';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
};

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};

interface SocialPostComposerProps {
  initialContent?: string;
  initialImageUrl?: string;
}

export function SocialPostComposer({ initialContent = '', initialImageUrl }: SocialPostComposerProps) {
  const { bundleAccounts, accountsLoading, accountsError, schedulePost } = useSocialPosts();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Update content when initialContent changes
  useState(() => {
    if (initialContent) setContent(initialContent);
  });

  // Update image when initialImageUrl changes  
  useState(() => {
    if (initialImageUrl) setImageUrl(initialImageUrl);
  });

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const getCharacterLimit = () => {
    if (selectedAccounts.length === 0) return null;
    
    const selectedPlatforms = bundleAccounts
      ?.filter(a => selectedAccounts.includes(a.id))
      .map(a => a.platform.toLowerCase()) || [];
    
    const limits = selectedPlatforms
      .map(p => PLATFORM_LIMITS[p] || 3000)
      .filter(Boolean);
    
    return limits.length > 0 ? Math.min(...limits) : null;
  };

  const characterLimit = getCharacterLimit();
  const isOverLimit = characterLimit && content.length > characterLimit;

  const handleSubmit = async () => {
    if (!content || selectedAccounts.length === 0) return;

    let scheduledAt: string | undefined;
    if (isScheduled && scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    await schedulePost.mutateAsync({
      title: title || content.substring(0, 50),
      content,
      platforms: selectedAccounts,
      scheduledAt,
      imageUrl: imageUrl || undefined,
    });

    // Reset form on success
    setTitle('');
    setContent('');
    setImageUrl(null);
    setSelectedAccounts([]);
    setIsScheduled(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  // Group accounts by platform
  const accountsByPlatform = bundleAccounts?.reduce((acc, account) => {
    const platform = account.platform.toLowerCase();
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(account);
    return acc;
  }, {} as Record<string, BundleAccount[]>) || {};

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Compose Post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title (internal reference)</Label>
          <Input
            id="title"
            placeholder="e.g., Q1 Security Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="content">Post Content</Label>
            {characterLimit && (
              <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length} / {characterLimit}
              </span>
            )}
          </div>
          <Textarea
            id="content"
            placeholder="Write your post content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 min-h-[120px]"
          />
          {isOverLimit && (
            <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              Content exceeds character limit for selected platforms
            </div>
          )}
        </div>

        {/* Image Uploader */}
        <ImageUploader imageUrl={imageUrl} onImageChange={setImageUrl} />

        {/* Platform Selection */}
        <div>
          <Label className="mb-2 block">Select Platforms</Label>
          
          {accountsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading accounts...
            </div>
          ) : accountsError ? (
            <div className="text-destructive text-sm">
              Failed to load accounts. Check your Bundle.Social configuration.
            </div>
          ) : Object.keys(accountsByPlatform).length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No social accounts connected. Connect accounts in Bundle.Social.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(accountsByPlatform).map(([platform, accounts]) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium capitalize">
                    {PLATFORM_ICONS[platform] || null}
                    {platform}
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedAccounts.includes(account.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-border'
                        }`}
                        onClick={() => toggleAccount(account.id)}
                      >
                        <Checkbox
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => toggleAccount(account.id)}
                        />
                        {account.avatar && (
                          <img 
                            src={account.avatar} 
                            alt={account.name}
                            className="h-6 w-6 rounded-full"
                          />
                        )}
                        <span className="text-sm">{account.name}</span>
                        {account.username && (
                          <span className="text-xs text-muted-foreground">
                            @{account.username}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="schedule"
              checked={isScheduled}
              onCheckedChange={(checked) => setIsScheduled(checked === true)}
            />
            <Label htmlFor="schedule" className="cursor-pointer">
              Schedule for later
            </Label>
          </div>

          {isScheduled && (
            <div className="flex gap-3 pl-6">
              <div className="flex-1">
                <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="pl-9"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="time" className="text-xs text-muted-foreground">Time</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={
            !content || 
            selectedAccounts.length === 0 || 
            schedulePost.isPending ||
            (isScheduled && (!scheduleDate || !scheduleTime)) ||
            isOverLimit
          }
        >
          {schedulePost.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isScheduled ? (
            <Calendar className="h-4 w-4 mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isScheduled ? 'Schedule Post' : 'Publish Now'}
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, Calendar, Clock, AlertCircle, ImagePlus, MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { useSocialPosts, BundleAccount } from '@/hooks/useSocialPosts';
import { ImageUploader } from './ImageUploader';
import { cn } from '@/lib/utils';

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏',
  x: '𝕏',
  linkedin: 'in',
  facebook: 'f',
  instagram: '📷',
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
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [previewPlatform, setPreviewPlatform] = useState('facebook');

  // Update content when props change
  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (initialImageUrl) setImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const getCharacterLimit = () => {
    if (selectedAccounts.length === 0) return 5000;
    
    const selectedPlatforms = bundleAccounts
      ?.filter(a => selectedAccounts.includes(a.id))
      .map(a => a.platform.toLowerCase()) || [];
    
    const limits = selectedPlatforms
      .map(p => PLATFORM_LIMITS[p] || 3000)
      .filter(Boolean);
    
    return limits.length > 0 ? Math.min(...limits) : 5000;
  };

  const characterLimit = getCharacterLimit();
  const isOverLimit = content.length > characterLimit;

  const handlePostNow = async () => {
    if (!content || selectedAccounts.length === 0) return;

    try {
      await schedulePost.mutateAsync({
        title: title || content.substring(0, 50),
        content,
        platforms: selectedAccounts,
        imageUrl: imageUrl || undefined,
      });

      resetForm();
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      console.error('Post failed:', error);
    }
  };

  const handleSchedule = async () => {
    if (!content || selectedAccounts.length === 0 || !scheduleDate || !scheduleTime) return;

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

      await schedulePost.mutateAsync({
        title: title || content.substring(0, 50),
        content,
        platforms: selectedAccounts,
        scheduledAt,
        imageUrl: imageUrl || undefined,
      });

      resetForm();
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      console.error('Schedule failed:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImageUrl(null);
    setSelectedAccounts([]);
    setScheduleDate('');
    setScheduleTime('12:00');
  };

  // Get first selected account for preview
  const previewAccount = bundleAccounts?.find(a => 
    a.platform.toLowerCase() === previewPlatform || 
    (previewPlatform === 'x' && a.platform.toLowerCase() === 'twitter')
  );

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Create Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Post Title */}
          <div>
            <Label htmlFor="title">Post Title (for reference)</Label>
            <Input
              id="title"
              placeholder="Give your post a name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Post Content */}
          <div>
            <Label htmlFor="content">Post Content</Label>
            <div className="relative mt-1">
              <Textarea
                id="content"
                placeholder="What would you like to share?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] pr-20"
              />
              <span className={cn(
                "absolute bottom-2 right-3 text-xs",
                isOverLimit ? "text-destructive" : "text-muted-foreground"
              )}>
                {content.length} / {characterLimit} characters
              </span>
            </div>
            {isOverLimit && (
              <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                <AlertCircle className="h-3 w-3" />
                Content exceeds character limit for selected platforms
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <Label>Image (optional)</Label>
            <div className="mt-1">
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border/50">
                  <img src={imageUrl} alt="Post image" className="w-full h-32 object-cover" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setImageUrl(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <ImageUploader imageUrl={imageUrl} onImageChange={setImageUrl} />
              )}
            </div>
          </div>

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
            ) : !bundleAccounts || bundleAccounts.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No social accounts connected. Connect accounts in Bundle.Social.
              </div>
            ) : (
              <div className="space-y-2">
                {bundleAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => toggleAccount(account.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedAccounts.includes(account.id)
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    {account.avatar ? (
                      <img src={account.avatar} alt={account.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {PLATFORM_ICONS[account.platform.toLowerCase()] || account.platform[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{account.platform}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div>
            <Label className="mb-2 block">Schedule (optional)</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="pl-9"
                  placeholder="Pick a date"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="w-28 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handlePostNow}
              disabled={
                !content || 
                selectedAccounts.length === 0 || 
                schedulePost.isPending ||
                isOverLimit
              }
            >
              {schedulePost.isPending && !scheduleDate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Now
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSchedule}
              disabled={
                !content || 
                selectedAccounts.length === 0 || 
                !scheduleDate ||
                !scheduleTime ||
                schedulePost.isPending ||
                isOverLimit
              }
            >
              {schedulePost.isPending && scheduleDate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Previews */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Platform Previews</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={previewPlatform} onValueChange={setPreviewPlatform}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="x" className="text-xs">𝕏 X</TabsTrigger>
              <TabsTrigger value="linkedin" className="text-xs">🔗 LinkedIn</TabsTrigger>
              <TabsTrigger value="facebook" className="text-xs">📘 Facebook</TabsTrigger>
              <TabsTrigger value="instagram" className="text-xs">📷 Instagram</TabsTrigger>
            </TabsList>
            
            <TabsContent value={previewPlatform} className="mt-4">
              <div className="bg-muted/30 rounded-lg p-4">
                {/* Facebook-style preview */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">UltriumAI</span>
                      <span className="text-xs text-muted-foreground">Just now · 🌐</span>
                      <MoreHorizontal className="h-4 w-4 ml-auto text-muted-foreground" />
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      {content || 'Your post preview will appear here...'}
                    </p>
                    {imageUrl && (
                      <img src={imageUrl} alt="Preview" className="mt-3 rounded-lg w-full object-cover max-h-48" />
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <span>0 Likes</span>
                      <span>0 Comments · 0 Shares</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="h-4 w-4" />
                        Like
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        Comment
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

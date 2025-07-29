import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Globe, Code, QrCode, Mail, MessageSquare, Share2, Download, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { safeWindowOpen } from "@/utils/security";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gptId: string;
  gptName: string;
  gptDescription?: string;
}

const ShareModal = ({ isOpen, onClose, gptId, gptName, gptDescription }: ShareModalProps) => {
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  const publicUrl = `https://gpt.ultriumai.com/${gptId}`;
  const embedCode = `<iframe src="${publicUrl}/embed" width="400" height="600" frameborder="0"></iframe>`;
  const shareText = `Check out ${gptName}${gptDescription ? ` - ${gptDescription}` : ''} ${publicUrl}`;
  
  const isPremium = subscription.subscription_tier !== "free";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Try ${gptName} - Custom AI Assistant`);
    const body = encodeURIComponent(shareText);
    safeWindowOpen(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(shareText);
    safeWindowOpen(`sms:?body=${body}`);
  };

  const shareViaSocial = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(publicUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    };

    if (urls[platform as keyof typeof urls]) {
      safeWindowOpen(urls[platform as keyof typeof urls], '_blank');
    }
  };

  const downloadQRCode = () => {
    // This would typically generate and download a QR code
    toast({
      title: "QR Code",
      description: "QR code generation would be implemented here",
    });
  };

  const platforms = [
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-blue-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'bg-blue-400' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {gptName}
          </DialogTitle>
          <DialogDescription>
            Share your Custom GPT with others through various methods
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">Direct Link</TabsTrigger>
            <TabsTrigger value="embed" className="relative">
              Embed
              {!isPremium && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          {/* Direct Link */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Public URL</Label>
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(publicUrl, "Public URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => safeWindowOpen(publicUrl, '_blank')} className="flex-1">
                <Globe className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={downloadQRCode} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={shareViaEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" onClick={shareViaSMS}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Embed Code */}
          <TabsContent value="embed" className="space-y-4">
            {!isPremium ? (
              <div className="p-4 border-2 border-dashed border-yellow-200 bg-yellow-50 rounded-lg text-center">
                <Crown className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <h3 className="font-medium text-yellow-800">Premium Feature</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Embed functionality is available with Premium plans
                </p>
                <Button variant="outline" size="sm">
                  Upgrade to Premium
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <textarea
                      value={embedCode}
                      readOnly
                      className="w-full h-24 p-3 border rounded-lg font-mono text-sm bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(embedCode, "Embed code")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input defaultValue="400" />
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input defaultValue="600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="w-full h-32 bg-muted rounded border-2 border-dashed flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Embed Preview</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social" className="space-y-4">
            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    onClick={() => shareViaSocial(platform.id)}
                    className="justify-start"
                  >
                    <span className="mr-2">{platform.icon}</span>
                    {platform.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Custom Message</Label>
              <textarea
                defaultValue={shareText}
                className="w-full h-20 p-3 border rounded-lg text-sm"
                placeholder="Customize your share message..."
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareText, "Share message")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Message
              </Button>
            </div>
          </TabsContent>

          {/* Other Methods */}
          <TabsContent value="other" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Generate Shareable Assets</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Banner
                  </Button>
                  <Button variant="outline">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code Image
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>API Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Use the API to integrate sharing into your own applications
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="text-xs">
                    GET /api/share/{gptId}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Track how your GPT is being shared and accessed
                </p>
                <Badge variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  124 shares this month
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => copyToClipboard(publicUrl, "Share URL")}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Share URL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;

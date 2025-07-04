import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Download, Eye } from "lucide-react";

interface ShareLinkConfigProps {
  publicUrl: string;
  copyToClipboard: (text: string, label: string) => void;
}

const ShareLinkConfig = ({ publicUrl, copyToClipboard }: ShareLinkConfigProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Link
        </CardTitle>
        <CardDescription>
          Share your GPT with others via direct link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Public URL</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(publicUrl, "Public URL")}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
          <Input value={publicUrl} readOnly />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
          <Button variant="outline" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareLinkConfig;
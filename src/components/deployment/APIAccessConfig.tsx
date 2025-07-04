import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Copy, Code, Crown } from "lucide-react";

interface APIAccessConfigProps {
  isPremiumFeature: (feature: string) => boolean;
  apiEndpoint: string;
  apiExample: string;
  copyToClipboard: (text: string, label: string) => void;
}

const APIAccessConfig = ({
  isPremiumFeature,
  apiEndpoint,
  apiExample,
  copyToClipboard
}: APIAccessConfigProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          API Access
          {isPremiumFeature('api') && (
            <Badge variant="secondary" className="ml-2">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Integrate your GPT with external applications via REST API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPremiumFeature('api') ? (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              API access is available with Premium plans. Upgrade to unlock this feature.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>API Endpoint</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiEndpoint, "API endpoint")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Input value={apiEndpoint} readOnly />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value="sk-..." readOnly className="flex-1" />
                  <Button variant="outline" size="sm">
                    Generate New Key
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Example Code</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiExample, "API example")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <Textarea
                value={apiExample}
                readOnly
                className="font-mono text-sm h-40"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default APIAccessConfig;
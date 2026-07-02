/**
 * ScanApp — Ray's device-scanning surface.
 *
 * The agent installer isn't shipped yet, so this card sets expectations
 * in Ray's voice instead of leaving the page feeling empty. Once the
 * agent is available, this file becomes the launcher.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ScanAppProps {
  isWhiteLabeled?: boolean;
  brandName?: string;
  hideHeader?: boolean;
}

export function ScanApp({ brandName = 'Wrayth' }: ScanAppProps) {
  const handleNotify = () => {
    toast.success("You're on the early-access list", {
      description: `The ${brandName} device agent is in final testing. I'll email you the moment your build is ready.`,
    });
  };

  return (
    <Card className="border-violet-500/10 bg-card/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2">
            <ShieldCheck className="h-5 w-5 text-violet-300" />
          </div>
          <CardTitle className="text-lg font-medium text-foreground">
            Device scanning is on its way
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Soon I'll be able to watch every device you own — patch levels,
          vulnerable services, misconfigurations — and quietly fix what I
          can. The agent is small, silent, and installs in a single click.
        </p>
        <p className="text-xs text-muted-foreground/80 max-w-xl">
          In the meantime, paste a suspicious file, URL, or email above and
          I'll analyze it right now.
        </p>
        <Button
          onClick={handleNotify}
          variant="outline"
          className="border-violet-500/30 text-violet-200 hover:bg-violet-500/10 hover:text-violet-100"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Join early access
        </Button>
      </CardContent>
    </Card>
  );
}

export default ScanApp;

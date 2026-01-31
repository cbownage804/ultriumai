import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, Download, Wifi, WifiOff, CheckCircle, 
  Share, Plus, ArrowRight, Apple, Chrome
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function MobileAppBanner() {
  const { canInstall, isInstalled, isOnline, isStandalone, promptInstall } = usePWA();

  // Don't show if already installed as standalone
  if (isStandalone) return null;

  return (
    <Card className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10 border-cyan-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <Smartphone className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Install Vanguard App</h4>
              <p className="text-xs text-slate-400">Get faster access with our mobile app</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            {canInstall ? (
              <Button size="sm" onClick={promptInstall} className="bg-cyan-500 hover:bg-cyan-600">
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
            ) : isInstalled ? (
              <Badge className="bg-green-500/20 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Installed
              </Badge>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MobileInstallInstructions() {
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isInstalled) {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">App Installed!</h3>
          <p className="text-slate-400">Vanguard has been added to your home screen.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Direct Install Button */}
      {canInstall && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
          <CardContent className="p-6 text-center">
            <Download className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Install Vanguard</h3>
            <p className="text-slate-400 mb-4">Add Vanguard to your home screen for quick access</p>
            <Button onClick={promptInstall} className="bg-cyan-500 hover:bg-cyan-600">
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* iOS Instructions */}
      {isIOS && !canInstall && (
        <Card className="bg-black/40 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5" />
              <CardTitle>Install on iOS</CardTitle>
            </div>
            <CardDescription>Follow these steps to add Vanguard to your iPhone or iPad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">1</Badge>
              <div>
                <p className="font-medium">Tap the Share button</p>
                <p className="text-sm text-slate-400">
                  <Share className="h-4 w-4 inline mr-1" />
                  Located at the bottom of Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">2</Badge>
              <div>
                <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                <p className="text-sm text-slate-400">
                  <Plus className="h-4 w-4 inline mr-1" />
                  This adds Vanguard to your apps
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">3</Badge>
              <div>
                <p className="font-medium">Tap "Add" to confirm</p>
                <p className="text-sm text-slate-400">You're all set!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android Instructions */}
      {isAndroid && !canInstall && (
        <Card className="bg-black/40 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5" />
              <CardTitle>Install on Android</CardTitle>
            </div>
            <CardDescription>Follow these steps to add Vanguard to your Android device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">1</Badge>
              <div>
                <p className="font-medium">Tap the menu button</p>
                <p className="text-sm text-slate-400">Three dots in the top right corner</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">2</Badge>
              <div>
                <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                <p className="text-sm text-slate-400">This creates an app shortcut</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">3</Badge>
              <div>
                <p className="font-medium">Confirm the installation</p>
                <p className="text-sm text-slate-400">Vanguard will appear on your home screen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card className="bg-black/40 border-slate-700/50">
        <CardHeader>
          <CardTitle>Mobile App Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'Works offline with cached data',
              'Push notifications for alerts',
              'Fast loading from home screen',
              'Native-like experience',
              'No app store required',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

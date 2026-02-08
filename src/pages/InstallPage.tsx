import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Smartphone, Wifi, WifiOff, Zap, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: <Smartphone className="h-5 w-5" />, title: 'Home Screen Access', desc: 'Launch instantly like a native app' },
    { icon: <WifiOff className="h-5 w-5" />, title: 'Offline Support', desc: 'Core features work without internet' },
    { icon: <Zap className="h-5 w-5" />, title: 'Fast & Lightweight', desc: 'No app store download required' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Install UltriumAI</h1>
            <p className="text-sm text-muted-foreground">Add to your device for the best experience</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 mb-8">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1.5">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {isInstalled && (
            <Badge variant="outline" className="gap-1.5 text-emerald-500 border-emerald-500/30">
              <Check className="h-3 w-3" />
              Installed
            </Badge>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Install button */}
        {isInstalled ? (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="py-6 text-center">
              <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium">App is installed!</p>
              <p className="text-sm text-muted-foreground mt-1">You can launch UltriumAI from your home screen.</p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2" variant="hero">
            <Download className="h-5 w-5" />
            Install UltriumAI
          </Button>
        ) : (
          <Card className="border-border">
            <CardContent className="py-6 text-center">
              <Smartphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-sm">Manual Install</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
                <strong>iPhone:</strong> Tap Share → "Add to Home Screen"<br />
                <strong>Android:</strong> Tap browser menu → "Install app" or "Add to Home Screen"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      initializeTracking(savedPreferences);
    }
  }, []);

  const initializeTracking = (prefs: typeof preferences) => {
    if (prefs.analytics && typeof window !== 'undefined') {
      // Initialize Google Analytics
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }
      
      // Initialize Clarity
      if (window.clarity) {
        window.clarity('consent');
      }
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setShowBanner(false);
    initializeTracking(allAccepted);
  };

  const acceptSelected = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    initializeTracking(preferences);
  };

  const rejectAll = () => {
    const minimal = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(minimal);
    localStorage.setItem('cookie-consent', JSON.stringify(minimal));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-6 md:right-6">
      <Card className="border-2 shadow-lg backdrop-blur-md bg-background/95">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-medium text-sm">We use cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                  You can manage your preferences anytime.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  size="sm" 
                  onClick={acceptAll}
                  className="text-xs px-4"
                >
                  Accept All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={rejectAll}
                  className="text-xs px-4"
                >
                  Necessary Only
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-xs px-4">
                      <Settings className="h-3 w-3 mr-1" />
                      Customize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cookie className="h-4 w-4" />
                        Cookie Preferences
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Necessary</Label>
                            <p className="text-xs text-muted-foreground">
                              Required for basic site functionality
                            </p>
                          </div>
                          <Switch checked={true} disabled />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Analytics</Label>
                            <p className="text-xs text-muted-foreground">
                              Help us improve our website
                            </p>
                          </div>
                          <Switch 
                            checked={preferences.analytics}
                            onCheckedChange={(checked) => 
                              setPreferences(prev => ({ ...prev, analytics: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Marketing</Label>
                            <p className="text-xs text-muted-foreground">
                              Personalized ads and content
                            </p>
                          </div>
                          <Switch 
                            checked={preferences.marketing}
                            onCheckedChange={(checked) => 
                              setPreferences(prev => ({ ...prev, marketing: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Functional</Label>
                            <p className="text-xs text-muted-foreground">
                              Enhanced features and preferences
                            </p>
                          </div>
                          <Switch 
                            checked={preferences.functional}
                            onCheckedChange={(checked) => 
                              setPreferences(prev => ({ ...prev, functional: checked }))
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={acceptSelected} size="sm" className="flex-1">
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={() => setShowBanner(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;
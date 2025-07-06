import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Smartphone, 
  Download, 
  Shield, 
  Bell, 
  Eye,
  Settings,
  Network,
  AlertTriangle,
  CheckCircle,
  Gauge,
  Users,
  Globe,
  QrCode,
  Fingerprint,
  Lock,
  Wifi,
  Activity,
  BarChart3,
  MapPin,
  Camera,
  Scan,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export const SafeNetMobile = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'features' | 'download'>('overview');

  const mobileFeatures = [
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Instant push notifications for critical security events',
      demo: 'Receive alerts for new vulnerabilities, device failures, or network breaches'
    },
    {
      icon: Eye,
      title: 'Network Monitoring',
      description: 'View real-time network status and device health',
      demo: 'Monitor network uptime, device status, and performance metrics'
    },
    {
      icon: QrCode,
      title: 'QR Code Scanning',
      description: 'Quick device identification and configuration',
      demo: 'Scan device QR codes to instantly view security status and details'
    },
    {
      icon: Fingerprint,
      title: 'Biometric Security',
      description: 'Secure app access with fingerprint or face recognition',
      demo: 'Protect sensitive network data with device biometric authentication'
    },
    {
      icon: MapPin,
      title: 'Geofenced Alerts',
      description: 'Location-based security notifications',
      demo: 'Get notified when entering client locations or sensitive areas'
    },
    {
      icon: Camera,
      title: 'Visual Scanning',
      description: 'Photograph and analyze network equipment',
      demo: 'Take photos of network devices for visual inventory and documentation'
    },
    {
      icon: Gauge,
      title: 'Performance Dashboard',
      description: 'Real-time network performance metrics',
      demo: 'View bandwidth usage, latency, and network health indicators'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share alerts and coordinate incident response',
      demo: 'Collaborate with team members on security incidents and tasks'
    }
  ];

  const appStats = {
    downloads: '15K+',
    rating: 4.8,
    reviews: 847,
    platforms: ['iOS', 'Android'],
    lastUpdate: '2 days ago',
    version: '3.2.1'
  };

  const downloadApp = (platform: 'ios' | 'android') => {
    toast({
      title: "Download Started",
      description: `SafeNet Mobile for ${platform.toUpperCase()} is downloading...`,
    });
    
    // In real implementation, this would redirect to app stores
    const storeUrls = {
      ios: 'https://apps.apple.com/app/safenet-mobile',
      android: 'https://play.google.com/store/apps/details?id=com.ultrium.safenet'
    };
    
    console.log(`Redirecting to: ${storeUrls[platform]}`);
  };

  const generateQRCode = () => {
    toast({
      title: "QR Code Generated",
      description: "QR code for mobile app download link created",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products/safenet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SafeNet
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Smartphone className="h-8 w-8 text-primary" />
              SafeNet Mobile
            </h1>
            <p className="text-muted-foreground">
              Network security management on the go - iOS & Android apps
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => downloadApp('ios')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            iOS App
          </Button>
          <Button onClick={() => downloadApp('android')} variant="hero">
            <Download className="h-4 w-4 mr-2" />
            Android App
          </Button>
        </div>
      </div>

      {/* App Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{appStats.downloads}</div>
            <p className="text-xs text-muted-foreground">Active installations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Rating</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{appStats.rating}/5</div>
            <p className="text-xs text-muted-foreground">{appStats.reviews} reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appStats.platforms.length}</div>
            <p className="text-xs text-muted-foreground">iOS & Android</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Version</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appStats.version}</div>
            <p className="text-xs text-muted-foreground">Updated {appStats.lastUpdate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button 
          variant={selectedTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </Button>
        <Button 
          variant={selectedTab === 'features' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('features')}
        >
          Features
        </Button>
        <Button 
          variant={selectedTab === 'download' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('download')}
        >
          Download
        </Button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Mobile App Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Dashboard
                </CardTitle>
                <CardDescription>
                  Real-time network security monitoring in your pocket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock Mobile Interface */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Network Status</h3>
                      <Badge variant="default" className="bg-green-500">Online</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-2xl font-bold">127</div>
                        <div className="text-xs opacity-75">Devices</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-400">8</div>
                        <div className="text-xs opacity-75">Vulnerabilities</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Network Health</span>
                        <span>87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Scan className="h-3 w-3 mr-1" />
                        Scan
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/20 text-white">
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Instant alerts for critical security events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mock Notifications */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Critical Vulnerability</div>
                      <div className="text-xs text-muted-foreground">Server-01 has unpatched CVE-2023-4567</div>
                      <div className="text-xs text-muted-foreground">2 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-orange-50 border-orange-200">
                    <Wifi className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Network Anomaly</div>
                      <div className="text-xs text-muted-foreground">Unusual traffic detected on subnet 192.168.1.0/24</div>
                      <div className="text-xs text-muted-foreground">15 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Scan Complete</div>
                      <div className="text-xs text-muted-foreground">Network scan finished - 3 new devices found</div>
                      <div className="text-xs text-muted-foreground">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Why Use SafeNet Mobile?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Instant Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified immediately when security issues are detected across your networks
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-semibold">On-site Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Access network data and perform scans while physically at client locations
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6 text-info" />
                  </div>
                  <h3 className="font-semibold">Team Coordination</h3>
                  <p className="text-sm text-muted-foreground">
                    Collaborate with team members and coordinate incident response activities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Tab */}
      {selectedTab === 'features' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mobileFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.demo}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Download Tab */}
      {selectedTab === 'download' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Mobile App
                </CardTitle>
                <CardDescription>
                  Get SafeNet Mobile for iOS and Android devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => downloadApp('ios')} 
                    className="h-16 flex flex-col items-center gap-1"
                    variant="outline"
                  >
                    <Smartphone className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">iOS App</div>
                      <div className="text-xs">App Store</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => downloadApp('android')} 
                    className="h-16 flex flex-col items-center gap-1"
                    variant="outline"
                  >
                    <Smartphone className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Android App</div>
                      <div className="text-xs">Google Play</div>
                    </div>
                  </Button>
                </div>

                <div className="text-center">
                  <Button onClick={generateQRCode} variant="outline">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share download link via QR code
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">iOS Requirements:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• iOS 14.0 or later</li>
                    <li>• iPhone 8 or newer</li>
                    <li>• 50 MB available storage</li>
                    <li>• Internet connection required</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Android Requirements:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Android 8.0 (API level 26) or higher</li>
                    <li>• 2 GB RAM minimum</li>
                    <li>• 50 MB available storage</li>
                    <li>• Internet connection required</li>
                  </ul>
                </div>

                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    All data is encrypted in transit and at rest. Biometric authentication required for sensitive operations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* App Screenshots Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                App Screenshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[9/16] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Smartphone className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Screenshot {i}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
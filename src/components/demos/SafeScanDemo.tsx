import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Mail, 
  Link, 
  AlertCircle, 
  CheckCircle, 
  Zap,
  Shield,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import safescanLogo from '@/assets/safescan-logo.png';

export const ScanDemo = () => {
  const [activeScanner, setActiveScanner] = useState('url');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);

  const scanResults = {
    url: {
      url: 'https://fake-microsoft-login.com',
      threats: 4,
      status: 'malicious',
      details: ['Domain spoofing', 'Fake login form', 'SSL certificate mismatch', 'Known malware distribution']
    },
    document: {
      fileName: 'invoice_Q4_2024.pdf',
      threats: 2,
      status: 'malicious',
      details: ['Embedded JavaScript exploit', 'Suspicious macro detected']
    },
    email: {
      sender: 'noreply@suspicious-bank.com',
      subject: 'Urgent: Account Verification Required',
      threats: 3,
      status: 'phishing',
      details: ['Domain spoofing detected', 'Credential harvesting attempt', 'Urgent language patterns']
    }
  };

  const tabs = [
    { id: 'url', label: 'URL Scanner', icon: Link },
    { id: 'document', label: 'Document Scanner', icon: FileText },
    { id: 'email', label: 'Email Scanner', icon: Mail },
  ];

  const startScan = () => {
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* Header with Scan branding - centered logo only */}
      <div className="flex justify-center mb-4">
        <img src={safescanLogo} alt="Scan" className="h-28 w-auto" />
      </div>

      {/* Scanner Selection - styled like real app */}
      <ScrollArea className="w-full">
        <div className="flex justify-center gap-1 p-1 bg-muted/50 rounded-lg mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button 
                key={tab.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-shrink-0 gap-2 transition-all",
                  activeScanner === tab.id 
                    ? "bg-red-500 text-white hover:bg-red-600 hover:text-white" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveScanner(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Scan Interface */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {activeScanner === 'url' && <Link className="h-5 w-5 text-red-500" />}
            {activeScanner === 'document' && <FileText className="h-5 w-5 text-red-500" />}
            {activeScanner === 'email' && <Mail className="h-5 w-5 text-red-500" />}
            {activeScanner === 'url' && 'URL Scanner'}
            {activeScanner === 'document' && 'Document Scanner'}
            {activeScanner === 'email' && 'Email Scanner'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeScanner === 'url' && (
            <div className="space-y-3">
              <Input placeholder="Enter URL to scan" defaultValue="https://fake-microsoft-login.com" className="bg-background/50" />
              <Button onClick={startScan} className="w-full bg-red-500 hover:bg-red-600 text-white">
                Scan URL
              </Button>
            </div>
          )}

          {activeScanner === 'document' && (
            <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center bg-background/30">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm mb-3">Drop files here or click to upload</p>
              <Button onClick={startScan} className="bg-red-500 hover:bg-red-600 text-white">
                Scan Document
              </Button>
            </div>
          )}

          {activeScanner === 'email' && (
            <div className="space-y-3">
              <Input placeholder="Enter sender email address" defaultValue="noreply@suspicious-bank.com" className="bg-background/50" />
              <Input placeholder="Enter email subject" defaultValue="Urgent: Account Verification Required" className="bg-background/50" />
              <Button onClick={startScan} className="w-full bg-red-500 hover:bg-red-600 text-white">
                Analyze Email
              </Button>
            </div>
          )}

          {scanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning with AI threat detection...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}

          {!scanning && scanProgress === 100 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    {scanResults[activeScanner].threats} Threats Detected
                  </span>
                  <Badge variant="destructive">
                    {scanResults[activeScanner].status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {scanResults[activeScanner].details.map((detail, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-destructive rounded-full" />
                      {detail}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Shield className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold text-emerald-500">99.8%</div>
            <div className="text-xs text-muted-foreground">Detection Accuracy</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Zap className="h-6 w-6 mx-auto mb-1 text-red-500" />
            <div className="text-lg font-bold text-red-500">0.3s</div>
            <div className="text-xs text-muted-foreground">Average Scan Time</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-cyan-500" />
            <div className="text-lg font-bold text-cyan-500">500+</div>
            <div className="text-xs text-muted-foreground">Threat Sources</div>
          </CardContent>
        </Card>
      </div>

      {/* CTA with red branding */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={safescanLogo} alt="Scan" className="h-16 w-auto" />
          </div>
          <h4 className="text-lg font-bold mb-1">Multi-Engine AI Detection</h4>
          <p className="text-muted-foreground text-sm mb-3">
            Combines behavioral analysis, signature detection, and machine learning
          </p>
          <Button className="bg-red-500 hover:bg-red-600 text-white">
            Deploy Scan Suite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
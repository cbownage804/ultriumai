import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  Mail, 
  Link, 
  Key,
  AlertCircle, 
  CheckCircle, 
  Clock,
  Zap,
  Shield,
  Upload
} from 'lucide-react';

export const SafeScanDemo = () => {
  const [activeScanner, setActiveScanner] = useState('document');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);

  const scanResults = {
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
    },
    url: {
      url: 'https://fake-microsoft-login.com',
      threats: 4,
      status: 'malicious',
      details: ['Domain spoofing', 'Fake login form', 'SSL certificate mismatch', 'Known malware distribution']
    },
    password: {
      password: 'password123',
      score: 15,
      strength: 'very weak',
      breaches: 15847,
      details: ['Found in 15,847 data breaches', 'Common password pattern', 'Dictionary word detected', 'No special characters']
    }
  };

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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">🔍 SafeScan AI-Powered Threat Detection</h3>
        <p className="text-muted-foreground">Advanced scanning that catches what others miss</p>
      </div>

      {/* Scanner Selection */}
      <div className="flex justify-center gap-2 mb-6">
        <Button 
          variant={activeScanner === 'document' ? 'default' : 'outline'} 
          onClick={() => setActiveScanner('document')}
        >
          <FileText className="h-4 w-4 mr-2" />
          SafeDoc
        </Button>
        <Button 
          variant={activeScanner === 'email' ? 'default' : 'outline'} 
          onClick={() => setActiveScanner('email')}
        >
          <Mail className="h-4 w-4 mr-2" />
          SafeMail
        </Button>
        <Button 
          variant={activeScanner === 'url' ? 'default' : 'outline'} 
          onClick={() => setActiveScanner('url')}
        >
          <Link className="h-4 w-4 mr-2" />
          SafeLink
        </Button>
        <Button 
          variant={activeScanner === 'password' ? 'default' : 'outline'} 
          onClick={() => setActiveScanner('password')}
        >
          <Key className="h-4 w-4 mr-2" />
          SafePass
        </Button>
      </div>

      {/* Scan Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeScanner === 'document' && <FileText className="h-5 w-5 text-primary" />}
            {activeScanner === 'email' && <Mail className="h-5 w-5 text-primary" />}
            {activeScanner === 'url' && <Link className="h-5 w-5 text-primary" />}
            {activeScanner === 'password' && <Key className="h-5 w-5 text-primary" />}
            {activeScanner === 'document' && 'Document Scanner'}
            {activeScanner === 'email' && 'Email Threat Analysis'}
            {activeScanner === 'url' && 'URL Security Check'}
            {activeScanner === 'password' && 'Password Security Analysis'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeScanner === 'document' && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Drop files here or click to upload</p>
              <Button onClick={startScan}>
                Scan Document
              </Button>
            </div>
          )}

          {activeScanner === 'email' && (
            <div className="space-y-3">
              <Input placeholder="Enter sender email address" defaultValue="noreply@suspicious-bank.com" />
              <Input placeholder="Enter email subject" defaultValue="Urgent: Account Verification Required" />
              <Button onClick={startScan} className="w-full">
                Analyze Email
              </Button>
            </div>
          )}

          {activeScanner === 'url' && (
            <div className="space-y-3">
              <Input placeholder="Enter URL to scan" defaultValue="https://fake-microsoft-login.com" />
              <Button onClick={startScan} className="w-full">
                Scan URL
              </Button>
            </div>
          )}

          {activeScanner === 'password' && (
            <div className="space-y-3">
              <Input 
                type="password" 
                placeholder="Enter password to analyze" 
                defaultValue="password123" 
              />
              <Input placeholder="Enter email address for breach check (optional)" />
              <Button onClick={startScan} className="w-full">
                Analyze Password Security
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold text-success">99.8%</div>
            <div className="text-sm text-muted-foreground">Detection Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">0.3s</div>
            <div className="text-sm text-muted-foreground">Average Scan Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-info" />
            <div className="text-2xl font-bold text-info">500+</div>
            <div className="text-sm text-muted-foreground">Threat Sources</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h4 className="text-xl font-bold mb-2">Multi-Engine AI Detection</h4>
          <p className="text-muted-foreground mb-4">
            Combines behavioral analysis, signature detection, and machine learning for unmatched accuracy
          </p>
          <Button size="lg">
            Deploy SafeScan Suite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
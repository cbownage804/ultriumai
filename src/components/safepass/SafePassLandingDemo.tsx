import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Copy, 
  Plus,
  AlertTriangle,
  RefreshCw,
  Globe,
  CreditCard,
  FileText,
  Lock,
  CheckCircle,
  Smartphone,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';

export const VaultLandingDemo = () => {
  const [activeTab, setActiveTab] = useState('vault');
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  
  // Password Generator State
  const [generatedPassword, setGeneratedPassword] = useState('Kj$9mP#xL2@nQw5v');
  const [passwordLength, setPasswordLength] = useState([16]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const demoPasswords = [
    { id: 1, site: 'Gmail', username: 'user@gmail.com', password: 'SecurePass123!', strength: 85, category: 'login', favorite: true },
    { id: 2, site: 'GitHub', username: 'developer', password: 'GitH@b2024$ecure', strength: 92, category: 'login', favorite: false },
    { id: 3, site: 'Netflix', username: 'streaming@email.com', password: 'N3tflix!Stream', strength: 78, category: 'login', favorite: true },
    { id: 4, site: 'Bank Account', username: 'john.doe', password: 'B@nk$ecure2024!#', strength: 95, category: 'payment', favorite: true },
  ];

  const demoNotes = [
    { id: 1, title: 'Server SSH Keys', content: '-----BEGIN RSA PRIVATE KEY-----...', createdAt: '2024-01-15' },
    { id: 2, title: 'Recovery Codes', content: 'Backup codes for 2FA recovery...', createdAt: '2024-02-20' },
  ];

  const demoCards = [
    { id: 1, name: 'Personal Visa', lastFour: '4242', expiry: '12/26', type: 'visa' },
    { id: 2, name: 'Business Mastercard', lastFour: '8888', expiry: '03/25', type: 'mastercard' },
  ];

  const demoTOTP = [
    { id: 1, issuer: 'Google', account: 'user@gmail.com', code: '482 915' },
    { id: 2, issuer: 'GitHub', account: 'developer', code: '739 204' },
    { id: 3, issuer: 'AWS', account: 'admin@company.com', code: '156 873' },
  ];

  const breachAlerts = [
    { email: 'user@gmail.com', breaches: 2, status: 'compromised' },
    { email: 'work@company.com', breaches: 0, status: 'secure' },
  ];

  const togglePassword = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;
    
    if (!chars) chars = lowercase;
    
    let password = '';
    const array = new Uint32Array(passwordLength[0]);
    crypto.getRandomValues(array);
    for (let i = 0; i < passwordLength[0]; i++) {
      password += chars[array[i] % chars.length];
    }
    setGeneratedPassword(password);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-emerald-500';
    if (strength >= 60) return 'text-primary';
    return 'text-red-500';
  };

  const getStrengthBg = (strength: number) => {
    if (strength >= 80) return 'bg-emerald-500';
    if (strength >= 60) return 'bg-primary';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="vault" className="text-xs sm:text-sm">
            <Key className="h-4 w-4 mr-1 hidden sm:inline" />
            Vault
          </TabsTrigger>
          <TabsTrigger value="generator" className="text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 mr-1 hidden sm:inline" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="totp" className="text-xs sm:text-sm">
            <Smartphone className="h-4 w-4 mr-1 hidden sm:inline" />
            2FA
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="cards" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1 hidden sm:inline" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="breach" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1 hidden sm:inline" />
            Breach
          </TabsTrigger>
        </TabsList>

        {/* Password Vault Tab */}
        <TabsContent value="vault" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Password Vault</h4>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
          
          {demoPasswords.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.site}</span>
                        {item.favorite && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.username}</div>
                    </div>
                  </div>
                  <Badge className={getStrengthBg(item.strength)}>
                    {item.strength}%
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    type={showPasswords[item.id] ? 'text' : 'password'}
                    value={item.password}
                    readOnly
                    className="flex-1 font-mono"
                  />
                  <Button size="icon" variant="outline" onClick={() => togglePassword(item.id)}>
                    {showPasswords[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(item.password, 'Password')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <Progress value={item.strength} className={`h-1.5 mt-3`} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Password Generator Tab */}
        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Password Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <Input 
                  value={generatedPassword}
                  readOnly
                  className="flex-1 font-mono text-lg"
                />
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedPassword, 'Password')}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={generatePassword}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Length: {passwordLength[0]} characters</Label>
                  </div>
                  <Slider 
                    value={passwordLength} 
                    onValueChange={setPasswordLength}
                    min={8} 
                    max={64} 
                    step={1}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                    <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                    <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="numbers">Numbers (0-9)</Label>
                    <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="symbols">Symbols (!@#$)</Label>
                    <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                  </div>
                </div>

                <Button onClick={generatePassword} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOTP 2FA Tab */}
        <TabsContent value="totp" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Authenticator (TOTP)</h4>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

          <div className="grid gap-4">
            {demoTOTP.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{item.issuer}</div>
                        <div className="text-sm text-muted-foreground">{item.account}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold tracking-wider">{item.code}</span>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(item.code.replace(' ', ''), 'Code')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={75} className="h-1 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Secure Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Secure Notes</h4>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>

          <div className="grid gap-4">
            {demoNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{note.title}</div>
                        <div className="text-sm text-muted-foreground">Created {note.createdAt}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-2">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Credit Cards Tab */}
        <TabsContent value="cards" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Payment Cards</h4>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>

          <div className="grid gap-4">
            {demoCards.map((card) => (
              <Card key={card.id} className="bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-8">
                    <div className="h-10 w-14 bg-primary rounded opacity-80" />
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {card.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="font-mono text-xl tracking-widest mb-4">
                    •••• •••• •••• {card.lastFour}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs text-slate-400">CARD NAME</div>
                      <div className="font-medium">{card.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">EXPIRES</div>
                      <div className="font-medium">{card.expiry}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Breach Monitor Tab */}
        <TabsContent value="breach" className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Breach Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We continuously monitor breach databases to alert you if your credentials are compromised.
              </p>

              {breachAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      alert.status === 'compromised' ? 'bg-red-500/10' : 'bg-emerald-500/10'
                    }`}>
                      {alert.status === 'compromised' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{alert.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.breaches > 0 ? `Found in ${alert.breaches} breaches` : 'No breaches detected'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={alert.status === 'compromised' ? 'destructive' : 'default'}>
                    {alert.status === 'compromised' ? 'Action Required' : 'Secure'}
                  </Badge>
                </div>
              ))}

              <Button className="w-full" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Breach Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

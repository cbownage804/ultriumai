import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Key, 
  Plus,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  CheckCircle,
  Users,
  Loader2
} from "lucide-react";

interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  website: string;
  category: string;
  strength: number;
  lastUsed: string;
  shared: boolean;
}

const mockPasswords: PasswordEntry[] = [
  {
    id: "1",
    name: "Gmail Account",
    username: "john.doe@company.com",
    password: "Str0ng!P@ssw0rd2024",
    website: "gmail.com",
    category: "Email",
    strength: 95,
    lastUsed: "2 hours ago",
    shared: false
  },
  {
    id: "2", 
    name: "Company VPN",
    username: "jdoe",
    password: "VPN_S3cur3!2024",
    website: "company-vpn.local",
    category: "Security",
    strength: 88,
    lastUsed: "1 day ago",
    shared: true
  },
  {
    id: "3",
    name: "Office 365",
    username: "john.doe@company.com", 
    password: "weak123",
    website: "office.com",
    category: "Work",
    strength: 25,
    lastUsed: "3 days ago",
    shared: false
  }
];

export const SafePassDemo = () => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(mockPasswords);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const generatePassword = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
    setIsGenerating(false);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-500";
    if (strength >= 60) return "text-yellow-500";
    if (strength >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return "Strong";
    if (strength >= 60) return "Good";
    if (strength >= 40) return "Fair";
    return "Weak";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const averageStrength = Math.round(passwords.reduce((acc, p) => acc + p.strength, 0) / passwords.length);
  const weakPasswords = passwords.filter(p => p.strength < 60).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Key className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafePass Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Enterprise password management with security monitoring and team collaboration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getStrengthColor(averageStrength)}`}>
                  {averageStrength}%
                </div>
                <Progress value={averageStrength} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Overall password strength
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weak Passwords Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">
                  {weakPasswords}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Passwords need attention
                </p>
                {weakPasswords > 0 && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Update weak passwords immediately
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {passwords.filter(p => p.shared).length}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Shared credentials
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Manage Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Password Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Password Generator
              </CardTitle>
              <CardDescription>
                Generate secure passwords with custom requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  placeholder="Generated password will appear here"
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newPassword)}
                  disabled={!newPassword}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={generatePassword}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate Strong Password
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium mb-1">Length: 16</label>
                  <label className="block font-medium mb-1">Uppercase: ✓</label>
                </div>
                <div>
                  <label className="block font-medium mb-1">Numbers: ✓</label>
                  <label className="block font-medium mb-1">Symbols: ✓</label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Vault */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password Vault
              </CardTitle>
              <CardDescription>
                Secure storage for all your credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {passwords.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{entry.name}</h4>
                        {entry.shared && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      <Badge variant={entry.strength >= 60 ? "default" : "destructive"} className="text-xs">
                        {getStrengthLabel(entry.strength)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Website: {entry.website}</div>
                      <div>Username: {entry.username}</div>
                      <div className="flex items-center gap-2">
                        <span>Password:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">
                            {showPassword === entry.id ? entry.password : "••••••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => setShowPassword(showPassword === entry.id ? null : entry.id)}
                          >
                            {showPassword === entry.id ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => copyToClipboard(entry.password)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>Last used: {entry.lastUsed}</div>
                    </div>
                    
                    <Progress value={entry.strength} className="mt-2 h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
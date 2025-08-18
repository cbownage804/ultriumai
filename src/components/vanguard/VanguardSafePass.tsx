import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Key, Shield, AlertTriangle, Eye, EyeOff, Plus, Search } from "lucide-react";

interface PasswordEntry {
  id: string;
  title: string;
  url: string;
  username: string;
  category: string;
  strength: 'weak' | 'medium' | 'strong';
  compromised: boolean;
  lastUsed: string;
}

export const VanguardSafePass = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showPasswords, setShowPasswords] = useState(false);

  // Mock data
  const entries: PasswordEntry[] = [
    {
      id: "1",
      title: "Office 365",
      url: "office.com",
      username: "admin@company.com",
      category: "Business",
      strength: "strong",
      compromised: false,
      lastUsed: "2 hours ago"
    },
    {
      id: "2", 
      title: "AWS Console",
      url: "console.aws.amazon.com",
      username: "devops@company.com",
      category: "Infrastructure",
      strength: "strong",
      compromised: false,
      lastUsed: "1 day ago"
    },
    {
      id: "3",
      title: "Legacy System",
      url: "legacy.internal.com",
      username: "legacy_admin",
      category: "Internal",
      strength: "weak",
      compromised: true,
      lastUsed: "2 weeks ago"
    }
  ];

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'strong': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lock className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Identity & Access Management</h2>
          <p className="text-muted-foreground">Enterprise password security and authentication management</p>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Across all systems</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">12</div>
            <p className="text-xs text-muted-foreground">Need immediate update</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compromised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">Found in breaches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">2FA Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">Multi-factor enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Password Manager */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Password Vault</CardTitle>
              <CardDescription>Secure credential management for your organization</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)}>
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Password
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search passwords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="Business">Business</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Internal">Internal</option>
            </select>
          </div>

          {/* Password Entries */}
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{entry.title}</h3>
                        {entry.compromised && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.url}</p>
                      <p className="text-xs text-muted-foreground">Last used: {entry.lastUsed}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{entry.category}</Badge>
                    <Badge className={getStrengthColor(entry.strength)}>
                      {entry.strength.toUpperCase()}
                    </Badge>
                    {entry.compromised && (
                      <Badge variant="destructive">Compromised</Badge>
                    )}
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Username: </span>
                  <span className="text-muted-foreground">{entry.username}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Critical: Update Weak Passwords</h4>
              <p className="text-sm text-red-700">12 passwords are weak and need immediate attention. Click to update now.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-800">Enable 2FA on Remaining Systems</h4>
              <p className="text-sm text-orange-700">23 accounts still need two-factor authentication enabled.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Password Policy Compliance</h4>
              <p className="text-sm text-blue-700">Set up automated password rotation for service accounts.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
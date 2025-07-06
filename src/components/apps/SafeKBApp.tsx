import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  FileText, 
  Key, 
  Server, 
  Monitor, 
  Smartphone,
  Router,
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Tag,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeKBAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
  mspId?: string;
  clientId?: string;
}

interface Asset {
  id: string;
  name: string;
  type: 'server' | 'workstation' | 'mobile' | 'network' | 'software' | 'license';
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  location: string;
  assignedTo?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  lastUpdated: string;
}

interface Document {
  id: string;
  title: string;
  type: 'guide' | 'checklist' | 'walkthrough' | 'policy' | 'procedure' | 'manual';
  category: string;
  content: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
}

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  notes?: string;
  lastChanged: string;
  expiryDate?: string;
  strength: 'weak' | 'medium' | 'strong';
}

export const SafeKBApp = ({ 
  isWhiteLabeled = false, 
  brandColor = '#3b82f6', 
  brandName = 'Ultrium AI',
  mspId,
  clientId 
}: SafeKBAppProps) => {
  const [activeTab, setActiveTab] = useState('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});

  // Mock data - would come from API
  const [assets] = useState<Asset[]>([
    {
      id: '1',
      name: 'DC-SERVER-01',
      type: 'server',
      status: 'active',
      location: 'Main Data Center',
      assignedTo: 'IT Department',
      serialNumber: 'SRV-2024-001',
      model: 'PowerEdge R750',
      manufacturer: 'Dell',
      purchaseDate: '2024-01-15',
      warrantyExpiry: '2027-01-15',
      notes: 'Primary domain controller',
      lastUpdated: '2024-03-15'
    },
    {
      id: '2',
      name: 'LAPTOP-JANE-DOE',
      type: 'workstation',
      status: 'active',
      location: 'Finance Department',
      assignedTo: 'Jane Doe',
      serialNumber: 'LT-2024-015',
      model: 'ThinkPad X1 Carbon',
      manufacturer: 'Lenovo',
      purchaseDate: '2024-02-01',
      warrantyExpiry: '2027-02-01',
      lastUpdated: '2024-03-10'
    }
  ]);

  const [documents] = useState<Document[]>([
    {
      id: '1',
      title: 'New Employee Onboarding Checklist',
      type: 'checklist',
      category: 'HR Procedures',
      content: '1. Create user account\n2. Assign security groups\n3. Provision hardware\n4. Setup email\n5. Security briefing',
      tags: ['onboarding', 'hr', 'security'],
      author: 'IT Admin',
      createdAt: '2024-01-15',
      updatedAt: '2024-03-01',
      version: '2.1',
      status: 'published'
    },
    {
      id: '2',
      title: 'Server Backup Procedure',
      type: 'procedure',
      category: 'IT Operations',
      content: 'Daily backup procedures for critical servers...',
      tags: ['backup', 'servers', 'maintenance'],
      author: 'System Admin',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-15',
      version: '1.3',
      status: 'published'
    }
  ]);

  const [passwords] = useState<Password[]>([
    {
      id: '1',
      title: 'Domain Administrator',
      username: 'administrator',
      password: 'P@ssw0rd123!',
      url: 'https://domain.local',
      category: 'System Accounts',
      notes: 'Primary domain admin account',
      lastChanged: '2024-02-15',
      expiryDate: '2024-08-15',
      strength: 'strong'
    },
    {
      id: '2',
      title: 'WiFi Network Password',
      username: 'N/A',
      password: 'CompanyWiFi2024!',
      category: 'Network',
      notes: 'Main office WiFi password',
      lastChanged: '2024-01-01',
      expiryDate: '2024-12-31',
      strength: 'strong'
    }
  ]);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'workstation': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'network': return <Router className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'retired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'guide': return <FileText className="h-4 w-4" />;
      case 'checklist': return <FileText className="h-4 w-4" />;
      case 'walkthrough': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const togglePasswordVisibility = (passwordId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [passwordId]: !prev[passwordId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isWhiteLabeled ? brandName : 'Ultrium'} SafeKB
            </h1>
            <p className="text-muted-foreground">
              Comprehensive IT Knowledge Base & Asset Management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets, documents, passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="passwords" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Passwords
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Asset Inventory</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription>
                    Add a new asset to your inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="asset-name">Asset Name</Label>
                      <Input id="asset-name" placeholder="Enter asset name" />
                    </div>
                    <div>
                      <Label htmlFor="asset-type">Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="workstation">Workstation</SelectItem>
                          <SelectItem value="mobile">Mobile Device</SelectItem>
                          <SelectItem value="network">Network Equipment</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="license">License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serial">Serial Number</Label>
                      <Input id="serial" placeholder="Enter serial number" />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="Enter location" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Additional notes..." />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Asset</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAssetIcon(asset.type)}
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                    </div>
                    <Badge className={cn("text-white", getStatusColor(asset.status))}>
                      {asset.status}
                    </Badge>
                  </div>
                  <CardDescription>{asset.manufacturer} {asset.model}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{asset.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assigned:</span>
                      <span>{asset.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial:</span>
                      <span className="font-mono text-xs">{asset.serialNumber}</span>
                    </div>
                    {asset.warrantyExpiry && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Warranty:</span>
                        <span>{new Date(asset.warrantyExpiry).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-1 pt-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Knowledge Documents</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                  <DialogDescription>
                    Create a new guide, checklist, or procedure
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doc-title">Title</Label>
                      <Input id="doc-title" placeholder="Document title" />
                    </div>
                    <div>
                      <Label htmlFor="doc-type">Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="checklist">Checklist</SelectItem>
                          <SelectItem value="walkthrough">Walkthrough</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                          <SelectItem value="procedure">Procedure</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doc-category">Category</Label>
                      <Input id="doc-category" placeholder="e.g., IT Operations" />
                    </div>
                    <div>
                      <Label htmlFor="doc-tags">Tags</Label>
                      <Input id="doc-tags" placeholder="comma, separated, tags" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="doc-content">Content</Label>
                    <Textarea 
                      id="doc-content" 
                      placeholder="Document content..." 
                      className="min-h-32"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Save as Draft</Button>
                    <Button>Publish</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDocumentIcon(doc.type)}
                      <div>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>
                          {doc.category} • v{doc.version} • by {doc.author}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'published' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Badge variant="outline">{doc.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {doc.content}
                    </p>
                    <div className="flex items-center gap-2">
                      {doc.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Passwords Tab */}
        <TabsContent value="passwords" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Password Vault</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Password</DialogTitle>
                  <DialogDescription>
                    Store a new password securely
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pwd-title">Title</Label>
                    <Input id="pwd-title" placeholder="Password title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pwd-username">Username</Label>
                      <Input id="pwd-username" placeholder="Username" />
                    </div>
                    <div>
                      <Label htmlFor="pwd-category">Category</Label>
                      <Input id="pwd-category" placeholder="e.g., System Accounts" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pwd-password">Password</Label>
                    <Input id="pwd-password" type="password" placeholder="Password" />
                  </div>
                  <div>
                    <Label htmlFor="pwd-url">URL (Optional)</Label>
                    <Input id="pwd-url" placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="pwd-notes">Notes</Label>
                    <Textarea id="pwd-notes" placeholder="Additional notes..." />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Password</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {passwords.map((pwd) => (
              <Card key={pwd.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <CardTitle className="text-lg">{pwd.title}</CardTitle>
                    </div>
                    <Badge className={cn("text-white", getPasswordStrengthColor(pwd.strength))}>
                      {pwd.strength}
                    </Badge>
                  </div>
                  <CardDescription>{pwd.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Username:</span>
                      <span className="font-mono text-sm">{pwd.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Password:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showPassword[pwd.id] ? pwd.password : '•'.repeat(pwd.password.length)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(pwd.id)}
                        >
                          {showPassword[pwd.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(pwd.password)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {pwd.url && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">URL:</span>
                        <span className="text-sm text-blue-600 hover:underline cursor-pointer">{pwd.url}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Changed:</span>
                      <span className="text-sm">{new Date(pwd.lastChanged).toLocaleDateString()}</span>
                    </div>
                    {pwd.expiryDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expires:</span>
                        <span className="text-sm">{new Date(pwd.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {pwd.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{pwd.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-1 pt-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafeKBApp;
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  FileText, 
  Key, 
  Server, 
  Monitor, 
  Smartphone,
  Router,
  Shield,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Building,
  Calendar,
  User
} from 'lucide-react';

export const SafeKBDemo = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});

  // Mock data for demo
  const assets = [
    {
      id: '1',
      name: 'DC-SERVER-01',
      type: 'server',
      status: 'active',
      location: 'Data Center Rack A1',
      assignedTo: 'IT Department',
      serialNumber: 'SN123456789',
      model: 'Dell PowerEdge R740',
      manufacturer: 'Dell',
      purchaseDate: '2023-01-15',
      warrantyExpiry: '2026-01-15',
      lastUpdated: '2024-01-10'
    },
    {
      id: '2',
      name: 'WS-FINANCE-01',
      type: 'workstation',
      status: 'active',
      location: 'Finance Office',
      assignedTo: 'John Smith',
      serialNumber: 'WS987654321',
      model: 'OptiPlex 7090',
      manufacturer: 'Dell',
      purchaseDate: '2023-03-10',
      warrantyExpiry: '2026-03-10',
      lastUpdated: '2024-01-05'
    },
    {
      id: '3',
      name: 'SW-SWITCH-01',
      type: 'network',
      status: 'active',
      location: 'Network Closet B',
      assignedTo: 'Network Team',
      serialNumber: 'NET456789123',
      model: 'Catalyst 9300',
      manufacturer: 'Cisco',
      purchaseDate: '2023-02-20',
      warrantyExpiry: '2028-02-20',
      lastUpdated: '2024-01-08'
    }
  ];

  const documents = [
    {
      id: '1',
      title: 'Network Security Policy',
      type: 'policy',
      category: 'Security',
      author: 'IT Security Team',
      createdAt: '2023-12-01',
      updatedAt: '2024-01-15',
      version: '2.1',
      status: 'published',
      tags: ['security', 'network', 'policy']
    },
    {
      id: '2',
      title: 'Backup Procedures Guide',
      type: 'procedure',
      category: 'Operations',
      author: 'System Admin',
      createdAt: '2023-11-15',
      updatedAt: '2024-01-10',
      version: '1.3',
      status: 'published',
      tags: ['backup', 'procedure', 'disaster-recovery']
    },
    {
      id: '3',
      title: 'Employee Onboarding Checklist',
      type: 'checklist',
      category: 'HR',
      author: 'HR Department',
      createdAt: '2023-10-20',
      updatedAt: '2023-12-05',
      version: '1.2',
      status: 'published',
      tags: ['hr', 'onboarding', 'checklist']
    }
  ];

  const passwords = [
    {
      id: '1',
      title: 'Domain Controller Admin',
      username: 'administrator',
      password: 'SecureP@ssw0rd123!',
      url: 'https://dc01.company.local',
      category: 'Infrastructure',
      lastChanged: '2024-01-01',
      expiryDate: '2024-04-01',
      strength: 'strong' as const
    },
    {
      id: '2',
      title: 'WiFi Network Password',
      username: 'N/A',
      password: 'Company_WiFi_2024',
      category: 'Network',
      lastChanged: '2024-01-15',
      strength: 'medium' as const
    }
  ];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'mobile': return Smartphone;
      case 'network': return Router;
      case 'software': return FileText;
      case 'license': return Key;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'policy': return Shield;
      case 'procedure': return FileText;
      case 'checklist': return FileText;
      default: return FileText;
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPasswords = passwords.filter(pwd =>
    pwd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center space-y-2 mb-8">
        <Database className="h-16 w-16 mx-auto text-primary" />
        <h2 className="text-3xl font-bold">SafeKB Knowledge Base & Asset Management</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Centralized knowledge base, asset tracking, and secure password management for your organization.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search assets, documents, or passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="documents">Knowledge Base</TabsTrigger>
          <TabsTrigger value="passwords">Passwords</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Asset Inventory</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredAssets.map((asset) => {
              const AssetIcon = getAssetIcon(asset.type);
              return (
                <Card key={asset.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <AssetIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{asset.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{asset.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Location:</span>
                        <p className="mt-1">{asset.location}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Assigned To:</span>
                        <p className="mt-1">{asset.assignedTo}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Serial Number:</span>
                        <p className="mt-1 font-mono">{asset.serialNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Warranty:</span>
                        <p className="mt-1">{asset.warrantyExpiry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Knowledge Base</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredDocuments.map((doc) => {
              const DocIcon = getDocumentIcon(doc.type);
              return (
                <Card key={doc.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <DocIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground">{doc.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{doc.version}</Badge>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.updatedAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{doc.type}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="passwords" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Password Vault</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredPasswords.map((pwd) => (
              <Card key={pwd.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <Key className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{pwd.title}</h4>
                        <p className="text-sm text-muted-foreground">{pwd.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={
                          pwd.strength === 'strong' ? 'bg-green-100 text-green-800' :
                          pwd.strength === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {pwd.strength}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {pwd.username !== 'N/A' && (
                      <div>
                        <span className="font-medium text-muted-foreground text-sm">Username:</span>
                        <p className="mt-1 font-mono">{pwd.username}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-muted-foreground text-sm">Password:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono">
                          {showPassword[pwd.id] ? pwd.password : '••••••••••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePasswordVisibility(pwd.id)}
                          className="h-6 w-6"
                        >
                          {showPassword[pwd.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {pwd.url && (
                      <div>
                        <span className="font-medium text-muted-foreground text-sm">URL:</span>
                        <p className="mt-1 text-blue-600 underline">{pwd.url}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Last Changed: {pwd.lastChanged}</span>
                      {pwd.expiryDate && (
                        <span>Expires: {pwd.expiryDate}</span>
                      )}
                    </div>
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
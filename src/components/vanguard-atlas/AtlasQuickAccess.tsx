/**
 * SafeDoc Quick Access Panel
 * Auto-populates customer documentation data into forms and fields
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Key, Server, Users, Copy, CheckCircle, 
  Search, X, Eye, EyeOff, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import safedocLogo from '@/assets/logos/logo-safedoc.png';

interface SafeDocData {
  passwords: PasswordEntry[];
  configurations: ConfigEntry[];
  contacts: ContactEntry[];
  documents: DocumentEntry[];
}

interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: string;
  lastUpdated: string;
}

interface ConfigEntry {
  id: string;
  name: string;
  deviceType: string;
  ipAddress?: string;
  configuration: Record<string, string>;
  notes?: string;
  lastUpdated: string;
}

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

interface DocumentEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

interface SafeDocQuickAccessProps {
  organizationId?: string;
  organizationName?: string;
  onDataSelect?: (type: string, data: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SafeDocQuickAccess({ 
  organizationId, 
  organizationName,
  onDataSelect,
  isOpen = true,
  onClose 
}: SafeDocQuickAccessProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('passwords');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Empty initial state - data loaded from database
  const [data, setData] = useState<SafeDocData>({
    passwords: [],
    configurations: [],
    contacts: [],
    documents: []
  });

  const copyToClipboard = async (text: string, id: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: `${fieldName} copied to clipboard`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectData = (type: string, item: any) => {
    if (onDataSelect) {
      onDataSelect(type, item);
      toast({
        title: "Data Selected",
        description: `${type} data will be auto-filled`,
      });
    }
  };

  const filteredPasswords = data.passwords.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConfigs = data.configurations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = data.contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={safedocLogo} alt="SafeDoc" className="h-5 w-auto" />
            <CardTitle className="text-white text-lg">Quick Access</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {organizationName && (
          <Badge variant="outline" className="w-fit border-cyan-500/50 text-cyan-400">
            {organizationName}
          </Badge>
        )}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="passwords" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Key className="h-4 w-4 mr-1" />
              Passwords
            </TabsTrigger>
            <TabsTrigger value="configs" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Server className="h-4 w-4 mr-1" />
              Configs
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Users className="h-4 w-4 mr-1" />
              Contacts
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[300px] mt-3">
            <TabsContent value="passwords" className="mt-0 space-y-2">
              {filteredPasswords.map((password) => (
                <div 
                  key={password.id} 
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{password.name}</span>
                    <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                      {password.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Username:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-cyan-400 text-xs">{password.username}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(password.username, `user-${password.id}`, 'Username')}
                        >
                          {copiedId === `user-${password.id}` ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Password:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-cyan-400 text-xs">
                          {revealedPasswords.has(password.id) ? password.password : '••••••••'}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => togglePasswordVisibility(password.id)}
                        >
                          {revealedPasswords.has(password.id) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(password.password, `pass-${password.id}`, 'Password')}
                        >
                          {copiedId === `pass-${password.id}` ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {password.url && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">URL:</span>
                        <a 
                          href={password.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1 text-xs"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => handleSelectData('password', password)}
                  >
                    Use for Auto-Fill
                  </Button>
                </div>
              ))}
              {filteredPasswords.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No passwords found
                </div>
              )}
            </TabsContent>

            <TabsContent value="configs" className="mt-0 space-y-2">
              {filteredConfigs.map((config) => (
                <div 
                  key={config.id} 
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{config.name}</span>
                    <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                      {config.deviceType}
                    </Badge>
                  </div>
                  
                  {config.ipAddress && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">IP Address:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-cyan-400">{config.ipAddress}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(config.ipAddress!, `ip-${config.id}`, 'IP Address')}
                        >
                          {copiedId === `ip-${config.id}` ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    {Object.entries(config.configuration).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-slate-400">
                        <span>{key}:</span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => handleSelectData('config', config)}
                  >
                    Use Configuration
                  </Button>
                </div>
              ))}
              {filteredConfigs.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No configurations found
                </div>
              )}
            </TabsContent>

            <TabsContent value="contacts" className="mt-0 space-y-2">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{contact.name}</span>
                      {contact.isPrimary && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Primary</Badge>
                      )}
                    </div>
                    {contact.role && (
                      <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                        {contact.role}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-cyan-400 text-xs">{contact.email}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(contact.email, `email-${contact.id}`, 'Email')}
                        >
                          {copiedId === `email-${contact.id}` ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {contact.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white text-xs">{contact.phone}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(contact.phone!, `phone-${contact.id}`, 'Phone')}
                          >
                            {copiedId === `phone-${contact.id}` ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => handleSelectData('contact', contact)}
                  >
                    Use Contact Info
                  </Button>
                </div>
              ))}
              {filteredContacts.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No contacts found
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SafeDocQuickAccess;

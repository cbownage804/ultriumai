import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  FileText, 
  Search, 
  Send, 
  Copy,
  Star,
  Tag,
  Clock,
  User,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Settings
} from "lucide-react";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'troubleshooting' | 'guide' | 'script' | 'checklist' | 'password' | 'command';
  tags: string[];
  author: string;
  lastUsed?: string;
  useCount: number;
  rating: number;
}

interface SafeKBInjectionProps {
  onInjectText: (text: string) => void;
  onExecuteCommand: (command: string) => void;
}

export const SafeKBInjection = ({ onInjectText, onExecuteCommand }: SafeKBInjectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customText, setCustomText] = useState('');
  const { toast } = useToast();

  // Mock SafeKB data - in production, this would come from the SafeKB API
  const [knowledgeItems] = useState<KnowledgeItem[]>([
    {
      id: '1',
      title: 'Windows Password Reset Steps',
      content: `To reset a Windows password:
1. Boot from Windows installation media
2. Press Shift+F10 to open Command Prompt
3. Navigate to System32 folder: cd c:\\windows\\system32
4. Backup Utilman.exe: copy utilman.exe utilman.exe.bak
5. Replace with cmd.exe: copy cmd.exe utilman.exe
6. Restart the computer
7. At login screen, click Accessibility button
8. In opened Command Prompt, reset password: net user [username] [newpassword]
9. Login with new password
10. Restore Utilman.exe: copy utilman.exe.bak utilman.exe`,
      category: 'troubleshooting',
      tags: ['windows', 'password', 'reset', 'admin'],
      author: 'IT Support Team',
      lastUsed: '2024-01-10',
      useCount: 45,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Network Diagnostics Script',
      content: `@echo off
echo Running network diagnostics...
echo.
echo === IP Configuration ===
ipconfig /all
echo.
echo === DNS Cache ===
ipconfig /displaydns | findstr "Record Name"
echo.
echo === Network Connectivity ===
ping google.com -n 4
ping 8.8.8.8 -n 4
echo.
echo === Network Routes ===
route print
echo.
echo Diagnostics complete. Press any key to exit.
pause > nul`,
      category: 'script',
      tags: ['network', 'diagnostics', 'batch', 'troubleshooting'],
      author: 'Network Team',
      lastUsed: '2024-01-08',
      useCount: 32,
      rating: 4.6
    },
    {
      id: '3',
      title: 'Malware Removal Checklist',
      content: `Malware Removal Process:
☐ 1. Disconnect from internet
☐ 2. Boot into Safe Mode
☐ 3. Run Windows Defender full scan
☐ 4. Run Malwarebytes scan
☐ 5. Check startup programs (msconfig)
☐ 6. Review browser extensions
☐ 7. Check Windows Event Logs
☐ 8. Update all software
☐ 9. Reset browser settings
☐ 10. Create system restore point
☐ 11. Monitor system for 24-48 hours
☐ 12. Document findings and actions taken`,
      category: 'checklist',
      tags: ['malware', 'security', 'removal', 'checklist'],
      author: 'Security Team',
      lastUsed: '2024-01-12',
      useCount: 28,
      rating: 4.9
    },
    {
      id: '4',
      title: 'System Information Commands',
      content: `systeminfo
wmic computersystem get model,name,manufacturer,systemtype
wmic bios get serialnumber
wmic cpu get name
wmic memorychip get capacity,manufacturer,partnumber
wmic diskdrive get model,size,status`,
      category: 'command',
      tags: ['system', 'information', 'hardware', 'commands'],
      author: 'Hardware Team',
      lastUsed: '2024-01-09',
      useCount: 67,
      rating: 4.7
    },
    {
      id: '5',
      title: 'Office 365 Troubleshooting',
      content: `Common Office 365 Issues and Solutions:

1. Authentication Issues:
   - Clear cached credentials: Control Panel > Credential Manager
   - Sign out and sign back in
   - Check time/date settings

2. Sync Problems:
   - Restart OneDrive: %localappdata%\\Microsoft\\OneDrive\\onedrive.exe /reset
   - Clear OneDrive cache
   - Check available storage

3. Outlook Issues:
   - Create new profile: Control Panel > Mail > Show Profiles
   - Run in Safe Mode: outlook.exe /safe
   - Repair PST files: scanpst.exe

4. Teams Issues:
   - Clear Teams cache: %appdata%\\Microsoft\\Teams
   - Update Teams client
   - Check network connectivity`,
      category: 'guide',
      tags: ['office365', 'outlook', 'teams', 'onedrive'],
      author: 'Office 365 Team',
      lastUsed: '2024-01-11',
      useCount: 89,
      rating: 4.5
    }
  ]);

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleInjectKnowledge = (item: KnowledgeItem) => {
    if (item.category === 'command' || item.category === 'script') {
      onExecuteCommand(item.content);
    } else {
      onInjectText(item.content);
    }
    
    toast({
      title: "Knowledge Injected",
      description: `"${item.title}" has been injected into the remote session`,
    });
  };

  const handleInjectCustomText = () => {
    if (customText.trim()) {
      onInjectText(customText);
      setCustomText('');
      toast({
        title: "Text Injected",
        description: "Custom text has been injected into the remote session",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'troubleshooting': return <AlertCircle className="h-4 w-4" />;
      case 'guide': return <FileText className="h-4 w-4" />;
      case 'script': return <Zap className="h-4 w-4" />;
      case 'checklist': return <CheckCircle className="h-4 w-4" />;
      case 'command': return <Settings className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'troubleshooting': return 'bg-red-100 text-red-800';
      case 'guide': return 'bg-blue-100 text-blue-800';
      case 'script': return 'bg-green-100 text-green-800';
      case 'checklist': return 'bg-purple-100 text-purple-800';
      case 'command': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SafeKB Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="guide">Guides</SelectItem>
                  <SelectItem value="script">Scripts</SelectItem>
                  <SelectItem value="checklist">Checklists</SelectItem>
                  <SelectItem value="command">Commands</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Inject Custom Text */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Type custom text to inject..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button onClick={handleInjectCustomText} disabled={!customText.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Inject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Items */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(item.category)}
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {item.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Used {item.useCount} times
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(item.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleInjectKnowledge(item)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {item.category === 'command' || item.category === 'script' ? 'Execute' : 'Inject'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <pre className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap font-mono overflow-x-auto">
                  {item.content.substring(0, 300)}
                  {item.content.length > 300 && '...'}
                </pre>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No knowledge items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
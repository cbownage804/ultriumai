import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Search,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface RegistryKey {
  name: string;
  path: string;
  children?: RegistryKey[];
  values?: RegistryValue[];
}

interface RegistryValue {
  name: string;
  type: 'REG_SZ' | 'REG_DWORD' | 'REG_BINARY' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ';
  data: string;
}

interface RegistryEditorProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

// Root registry hives
const rootHives: RegistryKey[] = [
  { name: 'HKEY_LOCAL_MACHINE', path: 'HKLM', children: [] },
  { name: 'HKEY_CURRENT_USER', path: 'HKCU', children: [] },
  { name: 'HKEY_CLASSES_ROOT', path: 'HKCR', children: [] },
  { name: 'HKEY_USERS', path: 'HKU', children: [] },
  { name: 'HKEY_CURRENT_CONFIG', path: 'HKCC', children: [] },
];

function RegistryTreeNode({ 
  node, 
  level = 0, 
  onSelect,
  loadingPath,
}: { 
  node: RegistryKey; 
  level?: number; 
  onSelect: (node: RegistryKey) => void;
  loadingPath?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isLoading = loadingPath === node.path;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="flex items-center gap-1 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            onSelect(node);
            setIsOpen(!isOpen);
          }}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : hasChildren || level === 0 ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <Folder className="h-4 w-4 text-yellow-500" />
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {node.children?.map((child, i) => (
              <RegistryTreeNode
                key={i}
                node={child}
                level={level + 1}
                onSelect={onSelect}
                loadingPath={loadingPath}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function RegistryEditor({ agentId, sendCommand }: RegistryEditorProps) {
  const [registryTree, setRegistryTree] = useState<RegistryKey[]>(rootHives);
  const [selectedKey, setSelectedKey] = useState<RegistryKey | null>(null);
  const [searchPath, setSearchPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const loadRegistryKey = async (path: string): Promise<RegistryKey | null> => {
    setLoadingPath(path);
    try {
      const result = await sendCommand('read_registry', { path });
      if (result?.keys || result?.values) {
        return {
          name: path.split('\\').pop() || path,
          path,
          children: result.keys?.map((k: string) => ({
            name: k,
            path: `${path}\\${k}`,
            children: [],
          })) || [],
          values: result.values || [],
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to load registry key:', err);
      return null;
    } finally {
      setLoadingPath(null);
    }
  };

  const handleNavigate = async () => {
    if (!searchPath.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await loadRegistryKey(searchPath);
      if (result) {
        setSelectedKey(result);
        toast.success('Registry key loaded');
      } else {
        toast.error('Registry key not found or inaccessible');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectKey = async (node: RegistryKey) => {
    setSelectedKey(node);
    if (!node.values || node.values.length === 0) {
      const updated = await loadRegistryKey(node.path);
      if (updated) {
        setSelectedKey(updated);
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'REG_SZ': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'REG_DWORD': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'REG_BINARY': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'REG_EXPAND_SZ': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'REG_MULTI_SZ': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'REG_QWORD': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return <Badge className={colors[type] || 'bg-muted text-muted-foreground'}>{type}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Registry Editor
          </CardTitle>
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Read-only mode</span>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Enter registry path (e.g., HKLM\SOFTWARE\Microsoft)"
            value={searchPath}
            onChange={(e) => setSearchPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
          />
          <Button onClick={handleNavigate} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Navigate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 h-[400px]">
          {/* Tree View */}
          <ScrollArea className="col-span-1 border rounded-lg p-2">
            {registryTree.map((node, i) => (
              <RegistryTreeNode
                key={i}
                node={node}
                onSelect={handleSelectKey}
                loadingPath={loadingPath}
              />
            ))}
          </ScrollArea>
          
          {/* Values View */}
          <div className="col-span-2 border rounded-lg">
            {selectedKey ? (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Folder className="h-4 w-4 text-yellow-500" />
                  <span className="font-mono text-sm text-muted-foreground truncate">{selectedKey.path}</span>
                  {loadingPath === selectedKey.path && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <ScrollArea className="h-[340px]">
                  {selectedKey.values && selectedKey.values.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedKey.values.map((value, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                {value.name || '(Default)'}
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(value.type)}</TableCell>
                            <TableCell className="font-mono text-sm max-w-[200px] truncate" title={value.data}>
                              {value.data}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      {loadingPath === selectedKey.path ? 'Loading values...' : 'No values in this key'}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a registry key to view values
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

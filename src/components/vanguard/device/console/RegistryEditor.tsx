import { useState } from "react";
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
  RefreshCw,
  Search,
  AlertTriangle,
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

// Demo registry structure
const demoRegistry: RegistryKey[] = [
  {
    name: 'HKEY_LOCAL_MACHINE',
    path: 'HKLM',
    children: [
      {
        name: 'SOFTWARE',
        path: 'HKLM\\SOFTWARE',
        children: [
          {
            name: 'Microsoft',
            path: 'HKLM\\SOFTWARE\\Microsoft',
            children: [
              {
                name: 'Windows',
                path: 'HKLM\\SOFTWARE\\Microsoft\\Windows',
                values: [
                  { name: 'CurrentVersion', type: 'REG_SZ', data: '10.0' },
                  { name: 'BuildNumber', type: 'REG_DWORD', data: '22621' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'SYSTEM',
        path: 'HKLM\\SYSTEM',
        children: [
          {
            name: 'CurrentControlSet',
            path: 'HKLM\\SYSTEM\\CurrentControlSet',
            values: [
              { name: 'ControlSet', type: 'REG_DWORD', data: '1' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'HKEY_CURRENT_USER',
    path: 'HKCU',
    children: [
      {
        name: 'Software',
        path: 'HKCU\\Software',
        children: [],
      },
    ],
  },
];

function RegistryTreeNode({ 
  node, 
  level = 0, 
  onSelect 
}: { 
  node: RegistryKey; 
  level?: number; 
  onSelect: (node: RegistryKey) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="flex items-center gap-1 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            onSelect(node);
            if (hasChildren) setIsOpen(!isOpen);
          }}
        >
          {hasChildren ? (
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
            <span className="w-4" />
          )}
          <Folder className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">{node.name}</span>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {node.children?.map((child, i) => (
              <RegistryTreeNode
                key={i}
                node={child}
                level={level + 1}
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function RegistryEditor({ agentId, sendCommand }: RegistryEditorProps) {
  const [selectedKey, setSelectedKey] = useState<RegistryKey | null>(null);
  const [searchPath, setSearchPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = async () => {
    if (!searchPath.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await sendCommand('read_registry', { path: searchPath });
      if (result?.values) {
        setSelectedKey({
          name: searchPath.split('\\').pop() || searchPath,
          path: searchPath,
          values: result.values,
        });
      }
      toast.success('Registry key loaded');
    } catch (err) {
      toast.error('Failed to read registry key');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'REG_SZ': 'bg-blue-100 text-blue-800',
      'REG_DWORD': 'bg-green-100 text-green-800',
      'REG_BINARY': 'bg-purple-100 text-purple-800',
      'REG_EXPAND_SZ': 'bg-orange-100 text-orange-800',
      'REG_MULTI_SZ': 'bg-pink-100 text-pink-800',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
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
            <Search className="h-4 w-4 mr-2" />
            Navigate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 h-[400px]">
          {/* Tree View */}
          <ScrollArea className="col-span-1 border rounded-lg p-2">
            {demoRegistry.map((node, i) => (
              <RegistryTreeNode
                key={i}
                node={node}
                onSelect={setSelectedKey}
              />
            ))}
          </ScrollArea>
          
          {/* Values View */}
          <div className="col-span-2 border rounded-lg">
            {selectedKey ? (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Folder className="h-4 w-4 text-yellow-500" />
                  <span className="font-mono text-sm text-muted-foreground">{selectedKey.path}</span>
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
                                <File className="h-4 w-4 text-gray-400" />
                                {value.name || '(Default)'}
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(value.type)}</TableCell>
                            <TableCell className="font-mono text-sm">{value.data}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No values in this key
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

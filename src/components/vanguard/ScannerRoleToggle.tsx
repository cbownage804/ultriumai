/**
 * Scanner Role Toggle Component
 * Allows enabling/disabling network scanner role for an agent
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Radar, Plus, Trash2, Play, Settings2, Clock, Network
} from 'lucide-react';
import { toast } from 'sonner';
import { useVanguardScanner } from '@/hooks/useVanguardScanner';

interface ScannerRoleToggleProps {
  agentId: string;
  agentName: string;
  isScanner: boolean;
  subnets: string[];
  scanInterval: number;
  lastScan: string | null;
  onUpdate?: () => void;
}

export function ScannerRoleToggle({
  agentId,
  agentName,
  isScanner: initialIsScanner,
  subnets: initialSubnets,
  scanInterval: initialInterval,
  lastScan,
  onUpdate
}: ScannerRoleToggleProps) {
  const { setScannerRole, triggerScan, loading } = useVanguardScanner();
  
  const [isScanner, setIsScanner] = useState(initialIsScanner);
  const [subnets, setSubnets] = useState<string[]>(initialSubnets?.length ? initialSubnets : ['']);
  const [scanInterval, setScanInterval] = useState(initialInterval || 3600);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    try {
      await setScannerRole(agentId, enabled, subnets.filter(s => s), scanInterval);
      setIsScanner(enabled);
      onUpdate?.();
    } catch {
      // Error handled in hook
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setScannerRole(agentId, isScanner, subnets.filter(s => s), scanInterval);
      toast.success('Scanner settings saved');
      onUpdate?.();
    } catch {
      // Error handled in hook
    }
  };

  const handleTriggerScan = async () => {
    try {
      await triggerScan(agentId, subnets.filter(s => s)[0]);
    } catch {
      // Error handled in hook
    }
  };

  const addSubnet = () => {
    setSubnets([...subnets, '']);
  };

  const updateSubnet = (index: number, value: string) => {
    const newSubnets = [...subnets];
    newSubnets[index] = value;
    setSubnets(newSubnets);
  };

  const removeSubnet = (index: number) => {
    if (subnets.length <= 1) return;
    setSubnets(subnets.filter((_, i) => i !== index));
  };

  const formatLastScan = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card className="bg-black/40 border-cyan-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isScanner ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
              <Radar className={`h-5 w-5 ${isScanner ? 'text-cyan-400' : 'text-slate-500'}`} />
            </div>
            <div>
              <CardTitle className="text-white text-base">Network Scanner Role</CardTitle>
              <CardDescription className="text-white/60">
                Enable network discovery for {agentName}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={isScanner}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardHeader>

      {isScanner && (
        <>
          <Separator className="bg-cyan-500/20" />
          <CardContent className="pt-4 space-y-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="h-4 w-4" />
                  Last scan: <span className="text-white">{formatLastScan(lastScan)}</span>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400">
                  Every {Math.floor(scanInterval / 60)}m
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                <Button
                  size="sm"
                  onClick={handleTriggerScan}
                  disabled={loading}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Scan Now
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="space-y-4 p-4 rounded-lg bg-black/20 border border-cyan-500/10">
                {/* Subnets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white/80 flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Target Subnets
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addSubnet}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {subnets.map((subnet, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={subnet}
                          onChange={(e) => updateSubnet(i, e.target.value)}
                          placeholder="192.168.1.0/24"
                          className="bg-black/40 border-cyan-500/20 text-white"
                        />
                        {subnets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubnet(i)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Leave empty to auto-detect local subnet
                  </p>
                </div>

                {/* Scan Interval */}
                <div>
                  <Label className="text-white/80 flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    Scan Interval (seconds)
                  </Label>
                  <Input
                    type="number"
                    value={scanInterval}
                    onChange={(e) => setScanInterval(parseInt(e.target.value) || 3600)}
                    min={300}
                    max={86400}
                    className="bg-black/40 border-cyan-500/20 text-white w-32"
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Min: 5 minutes, Max: 24 hours
                  </p>
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                >
                  Save Settings
                </Button>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

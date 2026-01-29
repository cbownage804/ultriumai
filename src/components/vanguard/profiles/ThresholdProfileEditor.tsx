import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Thermometer,
  Wifi,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

export interface ThresholdRule {
  id: string;
  metric: 'cpu' | 'memory' | 'disk' | 'temperature' | 'network';
  operator: 'above' | 'below' | 'equals';
  value: number;
  duration: number; // minutes
  severity: 'warning' | 'critical';
  enabled: boolean;
}

export interface ThresholdProfile {
  id: string;
  name: string;
  description?: string;
  rules: ThresholdRule[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ThresholdProfileEditorProps {
  profile?: ThresholdProfile;
  onSave: (profile: Omit<ThresholdProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const metricIcons = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  temperature: Thermometer,
  network: Wifi,
};

const metricLabels = {
  cpu: 'CPU Usage',
  memory: 'Memory Usage',
  disk: 'Disk Usage',
  temperature: 'Temperature',
  network: 'Network Latency',
};

const defaultRules: ThresholdRule[] = [
  { id: '1', metric: 'cpu', operator: 'above', value: 90, duration: 5, severity: 'critical', enabled: true },
  { id: '2', metric: 'cpu', operator: 'above', value: 70, duration: 10, severity: 'warning', enabled: true },
  { id: '3', metric: 'memory', operator: 'above', value: 85, duration: 5, severity: 'critical', enabled: true },
  { id: '4', metric: 'memory', operator: 'above', value: 70, duration: 10, severity: 'warning', enabled: true },
  { id: '5', metric: 'disk', operator: 'above', value: 90, duration: 0, severity: 'critical', enabled: true },
  { id: '6', metric: 'disk', operator: 'above', value: 80, duration: 0, severity: 'warning', enabled: true },
];

export function ThresholdProfileEditor({ profile, onSave, onCancel }: ThresholdProfileEditorProps) {
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [rules, setRules] = useState<ThresholdRule[]>(profile?.rules || defaultRules);
  const [isDefault, setIsDefault] = useState(profile?.isDefault || false);

  const addRule = () => {
    const newRule: ThresholdRule = {
      id: crypto.randomUUID(),
      metric: 'cpu',
      operator: 'above',
      value: 80,
      duration: 5,
      severity: 'warning',
      enabled: true,
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<ThresholdRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Profile name is required');
      return;
    }
    onSave({ name, description, rules, isDefault });
  };

  const Icon = ({ metric }: { metric: ThresholdRule['metric'] }) => {
    const IconComponent = metricIcons[metric];
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profile Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production Servers"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <Label>Set as default profile for new devices</Label>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Threshold Rules</CardTitle>
            <CardDescription>Configure alerts for system metrics</CardDescription>
          </div>
          <Button onClick={addRule} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 border rounded-lg space-y-3 ${!rule.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon metric={rule.metric} />
                  <span className="font-medium">{metricLabels[rule.metric]}</span>
                  <Badge variant={rule.severity === 'critical' ? 'destructive' : 'outline'}>
                    {rule.severity}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => updateRule(rule.id, { enabled: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Metric</Label>
                  <Select
                    value={rule.metric}
                    onValueChange={(v: any) => updateRule(rule.id, { metric: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpu">CPU Usage</SelectItem>
                      <SelectItem value="memory">Memory Usage</SelectItem>
                      <SelectItem value="disk">Disk Usage</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="network">Network Latency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Condition</Label>
                  <Select
                    value={rule.operator}
                    onValueChange={(v: any) => updateRule(rule.id, { operator: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Threshold ({rule.metric === 'temperature' ? '°C' : '%'})</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[rule.value]}
                      onValueChange={([v]) => updateRule(rule.id, { value: v })}
                      max={rule.metric === 'temperature' ? 100 : 100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right font-mono text-sm">{rule.value}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={rule.duration}
                    onChange={(e) => updateRule(rule.id, { duration: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs">Severity:</Label>
                <Select
                  value={rule.severity}
                  onValueChange={(v: any) => updateRule(rule.id, { severity: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No threshold rules configured</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={addRule}>
                Add your first rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Profile
        </Button>
      </div>
    </div>
  );
}

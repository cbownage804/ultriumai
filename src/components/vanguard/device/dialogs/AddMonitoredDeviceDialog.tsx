import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type DeviceType = 'snmp' | 'tcp' | 'http' | 'generic';

interface AddMonitoredDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (device: {
    name: string;
    type: DeviceType;
    ip_address: string;
    port?: number;
  }) => Promise<void>;
}

export function AddMonitoredDeviceDialog({ open, onOpenChange, onSave }: AddMonitoredDeviceDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceType>("tcp");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setType("tcp");
    setIpAddress("");
    setPort("");
  };

  const getDefaultPort = (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'snmp': return '161';
      case 'http': return '80';
      case 'tcp': return '';
      default: return '';
    }
  };

  const handleTypeChange = (newType: DeviceType) => {
    setType(newType);
    if (!port) {
      setPort(getDefaultPort(newType));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !ipAddress.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        ip_address: ipAddress.trim(),
        port: port ? parseInt(port, 10) : undefined,
      });
      
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isValidIP = (ip: string) => {
    if (!ip) return true; // Allow empty for validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return ipRegex.test(ip) || hostnameRegex.test(ip);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Monitored Device</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deviceType">Monitor Type</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as DeviceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tcp">TCP Port</SelectItem>
                <SelectItem value="http">HTTP/HTTPS</SelectItem>
                <SelectItem value="snmp">SNMP</SelectItem>
                <SelectItem value="generic">Generic (Ping)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === 'tcp' && "Monitor a specific TCP port on the device"}
              {type === 'http' && "Monitor HTTP/HTTPS endpoints for availability"}
              {type === 'snmp' && "Query device via SNMP protocol"}
              {type === 'generic' && "Simple ping/availability check"}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name *</Label>
            <Input
              id="deviceName"
              placeholder="e.g., Main Router, Printer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address / Hostname *</Label>
            <Input
              id="ipAddress"
              placeholder="e.g., 192.168.1.1 or device.local"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            {ipAddress && !isValidIP(ipAddress) && (
              <p className="text-xs text-destructive">
                Please enter a valid IP address or hostname
              </p>
            )}
          </div>
          
          {type !== 'generic' && (
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder={`e.g., ${getDefaultPort(type) || '443'}`}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                min={1}
                max={65535}
              />
            </div>
          )}

          {type === 'http' && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                For HTTP monitoring, the agent will check the endpoint for a 2xx response.
                Use port 443 for HTTPS or 80 for HTTP.
              </p>
            </div>
          )}

          {type === 'snmp' && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                SNMP monitoring uses v2c with community string "public" by default.
                Advanced SNMP settings can be configured after adding the device.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim() || !ipAddress.trim() || !isValidIP(ipAddress)}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

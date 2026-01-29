import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, ShieldAlert, Lock, Eye, EyeOff, Copy, Monitor } from "lucide-react";
import { useState } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";

interface DeviceSecurityTabProps {
  agent: VanguardAgent;
}

export function DeviceSecurityTab({ agent }: DeviceSecurityTabProps) {
  const [showWindowsKey, setShowWindowsKey] = useState(false);
  const [showOfficeKey, setShowOfficeKey] = useState(false);
  
  // Extract OS and security info from agent config
  const osInfo = agent.config?.os || {};
  const securityInfo = agent.config?.security || {};

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getSecurityStatus = (status: string | undefined) => {
    if (!status) return { color: "bg-gray-100 text-gray-600", label: "Unknown" };
    const normalized = status.toLowerCase();
    if (normalized === "enabled" || normalized === "on" || normalized === "active") {
      return { color: "bg-green-100 text-green-700", label: status };
    }
    if (normalized === "disabled" || normalized === "off") {
      return { color: "bg-red-100 text-red-700", label: status };
    }
    return { color: "bg-yellow-100 text-yellow-700", label: status };
  };

  return (
    <div className="space-y-4">
      {/* Operating System */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Operating System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="OS edition" value={agent.os_info || osInfo.edition || "Unknown"} />
          <InfoRow label="OS version" value={osInfo.version || "—"} />
          <InfoRow label="OS build" value={osInfo.build || "—"} />
          
          {/* Windows Serial Key */}
          {osInfo.windows_key && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Windows serial key</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 font-mono">
                  {showWindowsKey ? osInfo.windows_key : "•••••-•••••-•••••-•••••-•••••"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowWindowsKey(!showWindowsKey)}
                >
                  {showWindowsKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(osInfo.windows_key, "Windows key")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          <InfoRow 
            label="TLS 1.2 compatibility" 
            value={osInfo.tls_compatible ? "Compatible" : "—"} 
          />
          
          {/* Office Information */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Microsoft Office</h4>
            <InfoRow label="Office version" value={osInfo.office_version || "—"} />
            
            {osInfo.office_key && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Office serial key</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-mono">
                    {showOfficeKey ? osInfo.office_key : "•••••-•••••-•••••-•••••-•••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowOfficeKey(!showOfficeKey)}
                  >
                    {showOfficeKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(osInfo.office_key, "Office key")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
          <p className="text-xs text-gray-400">Information pulled from Windows Security Center</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <SecurityRow 
            label="Antivirus" 
            value={securityInfo.antivirus_name || "—"}
            status={securityInfo.antivirus_status}
          />
          <SecurityRow 
            label="Anti-spyware" 
            value={securityInfo.antispyware_name || "—"}
            status={securityInfo.antispyware_status}
          />
          <SecurityRow 
            label="Firewall" 
            value={securityInfo.firewall_name || "—"}
            status={securityInfo.firewall_status}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function SecurityRow({ label, value, status }: { label: string; value: string; status?: string }) {
  const statusInfo = getSecurityStatusBadge(status);
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900">{value}</span>
        {status && (
          <Badge className={statusInfo.color}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        )}
      </div>
    </div>
  );
}

function getSecurityStatusBadge(status: string | undefined) {
  if (!status) return { color: "bg-gray-100 text-gray-600 border-gray-200", label: "", icon: null };
  const normalized = status.toLowerCase();
  if (normalized === "enabled" || normalized === "on" || normalized === "active" || normalized === "up to date") {
    return { 
      color: "bg-green-100 text-green-700 border-green-200", 
      label: status,
      icon: <ShieldCheck className="h-3 w-3 mr-1" />
    };
  }
  if (normalized === "disabled" || normalized === "off") {
    return { 
      color: "bg-red-100 text-red-700 border-red-200", 
      label: status,
      icon: <ShieldAlert className="h-3 w-3 mr-1" />
    };
  }
  return { 
    color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    label: status,
    icon: null
  };
}

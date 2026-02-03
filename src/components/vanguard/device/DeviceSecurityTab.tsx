import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Lock, Eye, EyeOff, Copy, Monitor, Flame, Bug, AlertTriangle, HardDrive, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// Helper to format dates
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

interface DeviceSecurityTabProps {
  agent: VanguardAgent;
}

export function DeviceSecurityTab({ agent }: DeviceSecurityTabProps) {
  const [showWindowsKey, setShowWindowsKey] = useState(false);
  const [showOfficeKey, setShowOfficeKey] = useState(false);
  
  // Extract OS and security info from agent config AND security_status (from Defender telemetry)
  const osInfo = agent.config?.os || {};
  const configSecurity = agent.config?.security || {};
  const bitlockerStatus = (agent.config as any)?.bitlocker || [];
  
  // Get security_status from agent (populated by security_telemetry endpoint)
  const securityStatus = (agent as any).security_status || {};
  
  // Merge security info: prefer live security_status over config
  const securityInfo = {
    antivirus_status: securityStatus.defender_enabled ? 'Enabled' : (configSecurity.antivirus_status || 'Disabled'),
    antivirus_name: configSecurity.antivirus_name || 'Windows Defender',
    antispyware_status: securityStatus.defender_enabled ? 'Enabled' : (configSecurity.antispyware_status || 'Disabled'),
    antispyware_name: configSecurity.antispyware_name || 'Windows Defender',
    firewall_status: securityStatus.real_time_protection ? 'Enabled' : (configSecurity.firewall_status || 'Disabled'),
    firewall_name: configSecurity.firewall_name || 'Windows Firewall',
    signature_version: securityStatus.signature_version || configSecurity.signature_version,
    signature_last_updated: securityStatus.signature_last_updated || configSecurity.signature_last_updated,
    last_quick_scan: securityStatus.last_quick_scan || configSecurity.last_quick_scan,
    last_full_scan: securityStatus.last_full_scan || configSecurity.last_full_scan,
    recent_threats_count: securityStatus.recent_threats_count || 0,
    quarantined_count: securityStatus.quarantined_count || 0,
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Uptime calculation
  const uptime = useMemo(() => {
    const bootTime = (agent.config as any)?.hardware?.boot_time || (agent.config as any)?.boot_time;
    if (!bootTime) return null;
    
    const bootDate = new Date(bootTime);
    const now = new Date();
    const diffMs = now.getTime() - bootDate.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, bootTime: bootDate.toLocaleString() };
  }, [agent.config]);

  // Check if any drive has BitLocker enabled
  const hasBitLockerEnabled = bitlockerStatus.some((drive: any) => 
    drive.protection_status === 'On' || drive.protection_status === 'Enabled'
  );

  // Calculate security score based on actual Defender status
  const securityChecks = [
    securityInfo.antivirus_status?.toLowerCase() === 'enabled',
    securityInfo.firewall_status?.toLowerCase() === 'enabled',
    securityInfo.antispyware_status?.toLowerCase() === 'enabled',
    osInfo.tls_compatible,
    hasBitLockerEnabled,
  ];
  const securityScore = Math.round((securityChecks.filter(Boolean).length / securityChecks.length) * 100);

  return (
    <div className="space-y-4">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className={cn(
              "relative w-24 h-24 rounded-full flex items-center justify-center",
              securityScore >= 75 ? "bg-green-500/20" : 
              securityScore >= 50 ? "bg-yellow-500/20" : 
              "bg-red-500/20"
            )}>
              <div className={cn(
                "absolute inset-1 rounded-full border-4",
                securityScore >= 75 ? "border-green-500" : 
                securityScore >= 50 ? "border-yellow-500" : 
                "border-red-500"
              )} style={{
                background: `conic-gradient(${securityScore >= 75 ? '#22c55e' : securityScore >= 50 ? '#eab308' : '#ef4444'} ${securityScore * 3.6}deg, transparent 0deg)`
              }} />
              <span className={cn(
                "text-2xl font-bold",
                securityScore >= 75 ? "text-green-400" : 
                securityScore >= 50 ? "text-yellow-400" : 
                "text-red-400"
              )}>
                {securityScore}%
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-3">Security Score</p>
            <Badge className={cn(
              "mt-2",
              securityScore >= 75 ? "bg-green-500/20 text-green-400 border-green-500/30" : 
              securityScore >= 50 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
              "bg-red-500/20 text-red-400 border-red-500/30"
            )}>
              {securityScore >= 75 ? "Protected" : securityScore >= 50 ? "At Risk" : "Critical"}
            </Badge>
          </CardContent>
        </Card>

        {/* Security Status Cards */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Windows Security Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SecurityStatusCard
                icon={ShieldCheck}
                label="Antivirus"
                name={securityInfo.antivirus_name || "Windows Defender"}
                status={securityInfo.antivirus_status}
              />
              <SecurityStatusCard
                icon={Bug}
                label="Anti-Spyware"
                name={securityInfo.antispyware_name || "Windows Defender"}
                status={securityInfo.antispyware_status}
              />
              <SecurityStatusCard
                icon={Flame}
                label="Firewall"
                name={securityInfo.firewall_name || "Windows Firewall"}
                status={securityInfo.firewall_status}
              />
            </div>
            
            {/* Additional Security Details */}
            {(securityInfo.signature_version || securityInfo.last_quick_scan || securityInfo.last_full_scan) && (
              <div className="mt-4 pt-4 border-t border-cyan-500/10 grid grid-cols-2 md:grid-cols-4 gap-3">
                {securityInfo.signature_version && (
                  <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-500">Signature Version</p>
                    <p className="text-sm text-slate-300 font-mono truncate">{securityInfo.signature_version}</p>
                  </div>
                )}
                {securityInfo.signature_last_updated && (
                  <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-500">Signatures Updated</p>
                    <p className="text-sm text-slate-300">{formatDate(securityInfo.signature_last_updated)}</p>
                  </div>
                )}
                {securityInfo.last_quick_scan && (
                  <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-500">Last Quick Scan</p>
                    <p className="text-sm text-slate-300">{formatDate(securityInfo.last_quick_scan)}</p>
                  </div>
                )}
                {securityInfo.last_full_scan && (
                  <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-500">Last Full Scan</p>
                    <p className="text-sm text-slate-300">{formatDate(securityInfo.last_full_scan)}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Threat Summary */}
            {(securityInfo.recent_threats_count > 0 || securityInfo.quarantined_count > 0) && (
              <div className="mt-4 pt-4 border-t border-cyan-500/10 flex gap-4">
                {securityInfo.recent_threats_count > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {securityInfo.recent_threats_count} Recent Threat{securityInfo.recent_threats_count > 1 ? 's' : ''}
                  </Badge>
                )}
                {securityInfo.quarantined_count > 0 && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
                    <Shield className="h-3 w-3" />
                    {securityInfo.quarantined_count} Quarantined
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operating System */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Operating System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <InfoCard label="OS Edition" value={agent.os_info || osInfo.edition || "Unknown"} />
            <InfoCard label="OS Version" value={osInfo.version || "—"} />
            <InfoCard label="OS Build" value={osInfo.build || "—"} />
            <InfoCard 
              label="TLS 1.2" 
              value={osInfo.tls_compatible ? "Compatible" : "Not Compatible"} 
              highlight={osInfo.tls_compatible}
            />
          </div>
          
          {/* License Keys */}
          <div className="space-y-3 pt-4 border-t border-cyan-500/10">
            {osInfo.windows_key && (
              <div className="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg border border-cyan-500/10">
                <span className="text-sm text-slate-400 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  Windows Serial Key
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 font-mono">
                    {showWindowsKey ? osInfo.windows_key : "•••••-•••••-•••••-•••••-•••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                    onClick={() => setShowWindowsKey(!showWindowsKey)}
                  >
                    {showWindowsKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                    onClick={() => copyToClipboard(osInfo.windows_key, "Windows key")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            
            {osInfo.office_key && (
              <div className="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg border border-cyan-500/10">
                <span className="text-sm text-slate-400 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-400" />
                  Office Serial Key
                  {osInfo.office_version && (
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                      {osInfo.office_version}
                    </Badge>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 font-mono">
                    {showOfficeKey ? osInfo.office_key : "•••••-•••••-•••••-•••••-•••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                    onClick={() => setShowOfficeKey(!showOfficeKey)}
                  >
                    {showOfficeKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
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

      {/* BitLocker / Encryption Status */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Drive Encryption (BitLocker)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bitlockerStatus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bitlockerStatus.map((drive: any, index: number) => {
                const isProtected = drive.protection_status === 'On' || drive.protection_status === 'Enabled';
                return (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border flex items-center gap-3",
                      isProtected 
                        ? "bg-green-500/10 border-green-500/20" 
                        : "bg-red-500/10 border-red-500/20"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      isProtected ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      <HardDrive className={cn("h-5 w-5", isProtected ? "text-green-400" : "text-red-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{drive.drive_letter || drive.mount_point || `Drive ${index + 1}`}</p>
                      <p className="text-xs text-slate-400">{drive.volume_type || 'Volume'}</p>
                    </div>
                    <Badge className={cn(
                      isProtected 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    )}>
                      {isProtected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Protected
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Protected
                        </>
                      )}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Lock className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">BitLocker status not available</p>
              <p className="text-xs text-slate-500 mt-1">
                Encryption data will be collected during next telemetry sync
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Uptime */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            System Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uptime ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {uptime.days}d {uptime.hours}h {uptime.minutes}m
                  </p>
                  <p className="text-xs text-slate-500">Since {uptime.bootTime}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Uptime data not available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityStatusCard({ 
  icon: Icon, 
  label, 
  name, 
  status 
}: { 
  icon: any; 
  label: string; 
  name: string; 
  status?: string;
}) {
  const normalizedStatus = status?.toLowerCase();
  const isEnabled = normalizedStatus === 'enabled' || normalizedStatus === 'on' || normalizedStatus === 'active';
  const isUnknown = !status || normalizedStatus === 'unknown';
  
  const bgClass = isUnknown 
    ? "bg-slate-500/10 border-slate-500/20" 
    : isEnabled 
      ? "bg-green-500/10 border-green-500/20" 
      : "bg-red-500/10 border-red-500/20";
  
  const iconBgClass = isUnknown
    ? "bg-slate-500/20"
    : isEnabled ? "bg-green-500/20" : "bg-red-500/20";
  
  const iconClass = isUnknown
    ? "text-slate-400"
    : isEnabled ? "text-green-400" : "text-red-400";
  
  const badgeClass = isUnknown
    ? "bg-slate-500/20 text-slate-400 border-slate-500/30"
    : isEnabled 
      ? "bg-green-500/20 text-green-400 border-green-500/30" 
      : "bg-red-500/20 text-red-400 border-red-500/30";
  
  const statusText = isUnknown ? "Unknown" : isEnabled ? "Active" : "Disabled";
  
  return (
    <div className={cn("p-4 rounded-lg border", bgClass)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", iconBgClass)}>
          <Icon className={cn("h-5 w-5", iconClass)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
        </div>
        <Badge className={badgeClass}>
          {statusText}
        </Badge>
      </div>
    </div>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-500/10">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn(
        "text-sm font-medium mt-1",
        highlight ? "text-green-400" : "text-slate-200"
      )}>
        {value}
      </p>
    </div>
  );
}

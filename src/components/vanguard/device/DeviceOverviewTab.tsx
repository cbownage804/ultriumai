import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Building2, Folder, User, Mail, Globe, Clock, Server, MapPin, Network, Wifi } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DeviceOverviewTabProps {
  agent: VanguardAgent;
  clientName: string;
  clientId: string | null;
  availabilityMonitoring: boolean;
  onAvailabilityChange: (checked: boolean) => void;
}

export function DeviceOverviewTab({
  agent,
  clientName,
  clientId,
  availabilityMonitoring,
  onAvailabilityChange,
}: DeviceOverviewTabProps) {
  // Extract additional device info from config
  const deviceConfig = agent.config || {};
  const domain = deviceConfig.domain || "—";
  const lastLogin = deviceConfig.last_login || null;
  const lastReboot = deviceConfig.last_reboot || null;
  const timezone = deviceConfig.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const contactName = deviceConfig.contact_name || "—";
  const contactEmail = deviceConfig.contact_email || null;
  const customerName = deviceConfig.customer_name || clientName;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Device Info */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Server className="h-4 w-4" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-cyan-500/10">
            <span className="text-sm text-slate-400">Availability monitoring</span>
            <Switch
              checked={availabilityMonitoring}
              onCheckedChange={onAvailabilityChange}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>
          <InfoRow label="Device name" value={agent.name} highlight />
          <InfoRow label="Agent version" value={agent.agent_version || "Unknown"} />
          <InfoRow label="Domain" value={domain} icon={<Globe className="h-3.5 w-3.5" />} />
          <InfoRow label="Public IP" value={agent.ip_address || "—"} icon={<Network className="h-3.5 w-3.5" />} />
          <InfoRow label="Private IP" value={agent.vpn_ip || "—"} icon={<Wifi className="h-3.5 w-3.5" />} />
          <InfoRow
            label="Last login"
            value={lastLogin ? format(new Date(lastLogin), "MMM d, yyyy h:mm a") : "—"}
          />
          <InfoRow
            label="Last seen"
            value={
              agent.last_heartbeat
                ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                : "Never"
            }
            valueClass={agent.status === 'online' ? 'text-green-400' : 'text-yellow-400'}
          />
          <InfoRow
            label="Last reboot"
            value={lastReboot ? format(new Date(lastReboot), "MMM d, yyyy h:mm a") : "—"}
          />
          <InfoRow label="Time zone" value={timezone} icon={<Clock className="h-3.5 w-3.5" />} />
          <InfoRow
            label="Date added"
            value={format(new Date(agent.created_at), "MMM d, yyyy h:mm a")}
          />
        </CardContent>
      </Card>

      {/* Owner Info */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Owner Information
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-cyan-500/20 hover:text-cyan-400"
          >
            <Edit className="h-4 w-4 text-slate-400" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-cyan-500/10">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Site
            </span>
            {clientId ? (
              <Link 
                to={`/vanguard/customers/${clientId}`} 
                className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                {clientName}
              </Link>
            ) : (
              <span className="text-sm text-slate-300">{clientName}</span>
            )}
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cyan-500/10">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Customer
            </span>
            {clientId ? (
              <Link 
                to={`/vanguard/customers/${clientId}`} 
                className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                {customerName}
              </Link>
            ) : (
              <span className="text-sm text-slate-300">{customerName}</span>
            )}
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cyan-500/10">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Folder className="h-4 w-4 text-cyan-400" />
              Folder
            </span>
            <span className="text-sm text-slate-300">{deviceConfig.folder || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cyan-500/10">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              Assigned User
            </span>
            <span className="text-sm text-slate-300">{deviceConfig.assigned_user || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              Contact
            </span>
            {contactEmail ? (
              <a 
                href={`mailto:${contactEmail}`}
                className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                {contactName}
              </a>
            ) : (
              <span className="text-sm text-slate-300">{contactName}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  icon,
  highlight,
  valueClass 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-cyan-500/10 last:border-0">
      <span className="text-sm text-slate-400 flex items-center gap-2">
        {icon && <span className="text-cyan-400">{icon}</span>}
        {label}
      </span>
      <span className={cn(
        "text-sm",
        highlight ? "text-slate-100 font-medium" : "text-slate-300",
        valueClass
      )}>
        {value}
      </span>
    </div>
  );
}

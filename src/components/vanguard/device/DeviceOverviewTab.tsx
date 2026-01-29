import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Building2, Folder, User, Mail, Globe, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { Link } from "react-router-dom";

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
    <div className="grid grid-cols-2 gap-4">
      {/* Device Info */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-900">Device info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Availability monitoring</span>
            <Switch
              checked={availabilityMonitoring}
              onCheckedChange={onAvailabilityChange}
            />
          </div>
          <InfoRow label="Device name" value={agent.name} />
          <InfoRow label="Agent version" value={agent.agent_version || "Unknown"} />
          <InfoRow label="Domain" value={domain} />
          <InfoRow label="Public IP" value={agent.ip_address || "—"} />
          <InfoRow label="Private IP" value={agent.vpn_ip || "—"} />
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
          />
          <InfoRow
            label="Last reboot"
            value={lastReboot ? format(new Date(lastReboot), "MMM d, yyyy h:mm a") : "—"}
          />
          <InfoRow label="Time zone" value={timezone} />
          <InfoRow
            label="Date added"
            value={format(new Date(agent.created_at), "MMM d, yyyy h:mm a")}
          />
        </CardContent>
      </Card>

      {/* Owner Info */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-900">Owner info</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4 text-gray-400" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Site
            </span>
            {clientId ? (
              <Link 
                to={`/vanguard/customers/${clientId}`} 
                className="text-sm text-teal-600 hover:underline"
              >
                {clientName}
              </Link>
            ) : (
              <span className="text-sm text-gray-700">{clientName}</span>
            )}
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Customer
            </span>
            {clientId ? (
              <Link 
                to={`/vanguard/customers/${clientId}`} 
                className="text-sm text-teal-600 hover:underline"
              >
                {customerName}
              </Link>
            ) : (
              <span className="text-sm text-gray-700">{customerName}</span>
            )}
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Folder
            </span>
            <span className="text-sm text-gray-700">{deviceConfig.folder || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <User className="h-4 w-4" />
              User
            </span>
            <span className="text-sm text-gray-700">{deviceConfig.assigned_user || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact
            </span>
            {contactEmail ? (
              <a 
                href={`mailto:${contactEmail}`}
                className="text-sm text-teal-600 hover:underline"
              >
                {contactName}
              </a>
            ) : (
              <span className="text-sm text-gray-700">{contactName}</span>
            )}
          </div>
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

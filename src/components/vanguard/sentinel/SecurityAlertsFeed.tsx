import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Shield, MapPin, Clock, User, Monitor,
  ChevronRight, Search, Filter, Brain, Ticket, CheckCircle,
  XCircle, Eye, Globe, Smartphone, Laptop
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SecurityAlert {
  id: string;
  eventType: 'risky_signin' | 'conditional_access' | 'mfa_failure' | 'mailbox_rule';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: string;
  affectedUser: string;
  affectedUserEmail: string;
  tenantName: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  aiAnalysis?: {
    riskScore: number;
    recommendation: string;
    threatCategory: string;
  };
}

const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    eventType: 'risky_signin',
    title: 'Impossible Travel Detected',
    description: 'User signed in from New York, then Tokyo within 30 minutes',
    severity: 'critical',
    riskLevel: 'high',
    affectedUser: 'John Smith',
    affectedUserEmail: 'john.smith@acmecorp.com',
    tenantName: 'Acme Corp',
    ipAddress: '203.45.67.89',
    location: 'Tokyo, Japan',
    deviceInfo: 'Windows 11 / Chrome',
    timestamp: '5 minutes ago',
    status: 'new',
    aiAnalysis: {
      riskScore: 92,
      recommendation: 'Block user and require password reset',
      threatCategory: 'Credential Theft'
    }
  },
  {
    id: '2',
    eventType: 'mfa_failure',
    title: 'Multiple MFA Failures',
    description: '15 failed MFA attempts in the last hour',
    severity: 'high',
    riskLevel: 'medium',
    affectedUser: 'Sarah Johnson',
    affectedUserEmail: 'sarah.j@techstart.com',
    tenantName: 'TechStart Inc',
    ipAddress: '156.23.45.67',
    location: 'Moscow, Russia',
    deviceInfo: 'Unknown Device',
    timestamp: '12 minutes ago',
    status: 'investigating',
    aiAnalysis: {
      riskScore: 78,
      recommendation: 'Investigate - possible brute force attempt',
      threatCategory: 'Brute Force Attack'
    }
  },
  {
    id: '3',
    eventType: 'mailbox_rule',
    title: 'Suspicious Inbox Rule Created',
    description: 'Auto-forward rule to external email detected',
    severity: 'high',
    riskLevel: 'high',
    affectedUser: 'Mike Chen',
    affectedUserEmail: 'mchen@globalfinance.com',
    tenantName: 'Global Finance',
    ipAddress: '45.67.89.123',
    location: 'Lagos, Nigeria',
    deviceInfo: 'Outlook Web App',
    timestamp: '25 minutes ago',
    status: 'new',
    aiAnalysis: {
      riskScore: 85,
      recommendation: 'Remove rule and investigate compromised account',
      threatCategory: 'Data Exfiltration'
    }
  },
  {
    id: '4',
    eventType: 'conditional_access',
    title: 'Conditional Access Policy Blocked',
    description: 'Sign-in blocked due to non-compliant device',
    severity: 'medium',
    riskLevel: 'low',
    affectedUser: 'Emily Davis',
    affectedUserEmail: 'emily@acmecorp.com',
    tenantName: 'Acme Corp',
    ipAddress: '192.168.1.45',
    location: 'Chicago, USA',
    deviceInfo: 'Personal iPhone',
    timestamp: '1 hour ago',
    status: 'resolved',
    aiAnalysis: {
      riskScore: 25,
      recommendation: 'No action needed - policy working as intended',
      threatCategory: 'Policy Enforcement'
    }
  },
  {
    id: '5',
    eventType: 'risky_signin',
    title: 'Anonymous IP Address',
    description: 'Sign-in from TOR exit node detected',
    severity: 'high',
    riskLevel: 'high',
    affectedUser: 'Alex Wong',
    affectedUserEmail: 'awong@techstart.com',
    tenantName: 'TechStart Inc',
    ipAddress: '185.220.101.45',
    location: 'Unknown (TOR)',
    deviceInfo: 'Linux / Firefox',
    timestamp: '2 hours ago',
    status: 'dismissed'
  }
];

export function SecurityAlertsFeed() {
  const [alerts] = useState<SecurityAlert[]>(mockAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getEventTypeIcon = (type: SecurityAlert['eventType']) => {
    switch (type) {
      case 'risky_signin': return <AlertTriangle className="h-4 w-4" />;
      case 'conditional_access': return <Shield className="h-4 w-4" />;
      case 'mfa_failure': return <XCircle className="h-4 w-4" />;
      case 'mailbox_rule': return <Globe className="h-4 w-4" />;
    }
  };

  const getEventTypeBadge = (type: SecurityAlert['eventType']) => {
    const config = {
      risky_signin: { label: 'Risky Sign-In', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      conditional_access: { label: 'Conditional Access', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      mfa_failure: { label: 'MFA Failure', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      mailbox_rule: { label: 'Mailbox Rule', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
    };
    const { label, color } = config[type];
    return <Badge className={color}>{getEventTypeIcon(type)}<span className="ml-1">{label}</span></Badge>;
  };

  const getSeverityBadge = (severity: SecurityAlert['severity']) => {
    const colors = {
      critical: 'bg-red-600/30 text-red-300 border-red-500/50',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return <Badge className={colors[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: SecurityAlert['status']) => {
    const config = {
      new: { icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      investigating: { icon: <Eye className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      resolved: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      dismissed: { icon: <XCircle className="h-3 w-3" />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    };
    const { icon, color } = config[status];
    return <Badge className={color}>{icon}<span className="ml-1 capitalize">{status}</span></Badge>;
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.affectedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/40 border-cyan-500/30 text-white"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-cyan-500/30 text-white">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-cyan-500/30">
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-cyan-500/30 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-cyan-500/30">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`bg-black/60 border-l-4 ${
              alert.severity === 'critical' ? 'border-l-red-500' :
              alert.severity === 'high' ? 'border-l-orange-500' :
              alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-slate-500'
            } border-cyan-500/20 hover:border-cyan-500/40 transition-colors cursor-pointer`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getEventTypeBadge(alert.eventType)}
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-white font-medium mb-1">{alert.title}</h3>
                    <p className="text-slate-400 text-sm mb-3">{alert.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <User className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="truncate">{alert.affectedUser}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-purple-400" />
                        <span className="truncate">{alert.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Laptop className="h-3.5 w-3.5 text-green-400" />
                        <span className="truncate">{alert.deviceInfo}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    {alert.aiAnalysis && (
                      <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Brain className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-purple-400 text-xs font-medium">Cortex AI Analysis</span>
                          <Badge className="ml-auto bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0">
                            Risk Score: {alert.aiAnalysis.riskScore}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-xs">{alert.aiAnalysis.recommendation}</p>
                        <Badge variant="outline" className="mt-1.5 text-[10px] border-purple-500/30 text-purple-400">
                          {alert.aiAnalysis.threatCategory}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    {alert.status === 'new' && (
                      <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600">
                        <Ticket className="h-3.5 w-3.5 mr-1" />
                        Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Vanguard Demo Mock Data - Extracted for maintainability

export interface RMMDevice {
  id: number;
  name: string;
  customer: string;
  os: string;
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  patches: 'current' | 'pending' | 'outdated' | 'unknown';
}

export interface Ticket {
  id: string;
  title: string;
  customer: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  assignee: string | null;
  created: string;
}

export interface SOCAlert {
  id: number;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  device: string;
  source: string;
  time: string;
  status: 'new' | 'investigating' | 'resolved';
  mitre: string;
}

export interface ComplianceFramework {
  framework: string;
  score: number;
  status: 'compliant' | 'at_risk' | 'non_compliant';
  lastAudit: string;
}

export interface MSPClient {
  name: string;
  devices: number;
  tickets: number;
  threats: number;
  status: 'healthy' | 'warning' | 'critical';
}

export const mockRMMDevices: RMMDevice[] = [
  { id: 1, name: "PROD-WEB-01", customer: "Acme Corp", os: "Ubuntu 22.04", status: "online", cpu: 45, memory: 62, patches: "current" },
  { id: 2, name: "DC-PRIMARY", customer: "TechStart Inc", os: "Windows Server 2022", status: "online", cpu: 28, memory: 71, patches: "pending" },
  { id: 3, name: "EXEC-LAPTOP-01", customer: "Acme Corp", os: "Windows 11", status: "online", cpu: 12, memory: 45, patches: "current" },
  { id: 4, name: "DEV-MAC-03", customer: "Design Studio", os: "macOS Sonoma", status: "offline", cpu: 0, memory: 0, patches: "unknown" },
  { id: 5, name: "FILE-SERVER-01", customer: "TechStart Inc", os: "Windows Server 2019", status: "online", cpu: 55, memory: 78, patches: "outdated" },
];

export const mockTickets: Ticket[] = [
  { id: "TKT-1042", title: "VPN connection failing from home office", customer: "Acme Corp", priority: "high", status: "open", assignee: "John D.", created: "2h ago" },
  { id: "TKT-1041", title: "Email sync issues on mobile device", customer: "TechStart Inc", priority: "medium", status: "in_progress", assignee: "Sarah M.", created: "4h ago" },
  { id: "TKT-1040", title: "Request for new software installation", customer: "Design Studio", priority: "low", status: "open", assignee: null, created: "6h ago" },
  { id: "TKT-1039", title: "Printer not connecting to network", customer: "Acme Corp", priority: "medium", status: "resolved", assignee: "John D.", created: "1d ago" },
];

export const mockSOCAlerts: SOCAlert[] = [
  { id: 1, title: "Suspicious PowerShell Execution", severity: "critical", device: "DC-PRIMARY", source: "EDR", time: "5m ago", status: "investigating", mitre: "T1059.001" },
  { id: 2, title: "Brute Force Login Attempts Detected", severity: "high", device: "PROD-WEB-01", source: "SIEM", time: "12m ago", status: "new", mitre: "T1110" },
  { id: 3, title: "Unusual Outbound Traffic Pattern", severity: "medium", device: "FILE-SERVER-01", source: "Network", time: "45m ago", status: "investigating", mitre: "T1041" },
  { id: 4, title: "Failed MFA Attempts - Executive Account", severity: "high", device: "EXEC-LAPTOP-01", source: "Identity", time: "1h ago", status: "resolved", mitre: "T1078" },
];

export const mockCompliance: ComplianceFramework[] = [
  { framework: "SOC 2 Type II", score: 94, status: "compliant", lastAudit: "2024-01-15" },
  { framework: "HIPAA", score: 88, status: "at_risk", lastAudit: "2024-01-10" },
  { framework: "PCI-DSS", score: 96, status: "compliant", lastAudit: "2024-01-20" },
  { framework: "NIST CSF", score: 91, status: "compliant", lastAudit: "2024-01-18" },
];

export const mockMSPClients: MSPClient[] = [
  { name: "Acme Corp", devices: 45, tickets: 3, threats: 1, status: "healthy" },
  { name: "TechStart Inc", devices: 28, tickets: 5, threats: 2, status: "warning" },
  { name: "Design Studio", devices: 12, tickets: 1, threats: 0, status: "healthy" },
  { name: "Legal Partners LLP", devices: 32, tickets: 2, threats: 0, status: "healthy" },
];

export const platformModules = [
  { icon: 'Monitor', title: "RMM", desc: "Remote monitoring", color: "from-cyan-500 to-cyan-600" },
  { icon: 'Ticket', title: "Helpdesk", desc: "IT service desk", color: "from-purple-500 to-purple-600" },
  { icon: 'Eye', title: "SOC", desc: "Security operations", color: "from-red-500 to-red-600" },
  { icon: 'Target', title: "Threat Detection", desc: "AI-powered", color: "from-orange-500 to-orange-600" },
  { icon: 'FileCheck', title: "Compliance", desc: "Multi-framework", color: "from-green-500 to-green-600" },
  { icon: 'Shield', title: "Pen Testing", desc: "Automated scans", color: "from-rose-500 to-rose-600" },
  { icon: 'Globe', title: "Dark Web", desc: "Credential monitoring", color: "from-slate-600 to-slate-700" },
  { icon: 'Database', title: "SIEM", desc: "Log aggregation", color: "from-blue-500 to-blue-600" },
  { icon: 'Network', title: "Network Map", desc: "Topology view", color: "from-indigo-500 to-indigo-600" },
  { icon: 'Lock', title: "Vault", desc: "Credential mgmt", color: "from-amber-500 to-amber-600" },
  { icon: 'Bot', title: "Vanguard Cortex", desc: "AI operations", color: "from-violet-500 to-violet-600" },
  { icon: 'Layers', title: "Multi-Tenant", desc: "MSP management", color: "from-teal-500 to-teal-600" },
];

export const liveActivityFeed = [
  { icon: 'Shield', text: "Threat blocked on DC-PRIMARY", time: "2m ago", color: "text-red-400" },
  { icon: 'CheckCircle', text: "Ticket TKT-1038 resolved", time: "5m ago", color: "text-green-400" },
  { icon: 'Monitor', text: "Agent deployed to LAPTOP-042", time: "8m ago", color: "text-cyan-400" },
  { icon: 'FileCheck', text: "SOC 2 compliance scan completed", time: "12m ago", color: "text-emerald-400" },
];

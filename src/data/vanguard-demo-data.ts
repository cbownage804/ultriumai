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

export interface VanguardModule {
  id: string;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
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
  { id: 1, title: "Suspicious PowerShell Execution", severity: "critical", device: "DC-PRIMARY", source: "Pursuit EDR", time: "5m ago", status: "investigating", mitre: "T1059.001" },
  { id: 2, title: "Brute Force Login Attempts Detected", severity: "high", device: "PROD-WEB-01", source: "Cortex SIEM", time: "12m ago", status: "new", mitre: "T1110" },
  { id: 3, title: "Unusual Outbound Traffic Pattern", severity: "medium", device: "FILE-SERVER-01", source: "Recon", time: "45m ago", status: "investigating", mitre: "T1041" },
  { id: 4, title: "Failed MFA Attempts - Executive Account", severity: "high", device: "EXEC-LAPTOP-01", source: "Sentinel", time: "1h ago", status: "resolved", mitre: "T1078" },
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

// Official Vanguard Module Definitions
export const vanguardModules: VanguardModule[] = [
  {
    id: 'horizon',
    name: 'Horizon',
    fullName: 'Vanguard Horizon',
    description: 'RMM & Health Monitoring',
    icon: 'Monitor',
    color: 'cyan',
    gradient: 'from-cyan-400 via-blue-500 to-purple-600'
  },
  {
    id: 'pursuit',
    name: 'Pursuit',
    fullName: 'Vanguard Pursuit',
    description: 'Threat Detection & Security',
    icon: 'Target',
    color: 'red',
    gradient: 'from-red-500 to-orange-600'
  },
  {
    id: 'response',
    name: 'Response',
    fullName: 'Vanguard Response',
    description: 'Incident Management & Helpdesk',
    icon: 'Ticket',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600'
  },
  {
    id: 'recon',
    name: 'Recon',
    fullName: 'Vanguard Recon',
    description: 'Network Discovery & Assets',
    icon: 'Network',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'atlas',
    name: 'Atlas',
    fullName: 'Vanguard Atlas',
    description: 'Knowledge Base & Documentation',
    icon: 'FileText',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'ledger',
    name: 'Ledger',
    fullName: 'Vanguard Ledger',
    description: 'Compliance & Audit Trails',
    icon: 'ClipboardCheck',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600'
  },
  {
    id: 'cortex',
    name: 'Cortex',
    fullName: 'Vanguard Cortex',
    description: 'AI-Assisted Operations',
    icon: 'Bot',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600'
  }
];

// Platform module cards for overview
export const platformModules = [
  { icon: 'Monitor', title: "Horizon", desc: "RMM & Monitoring", color: "from-cyan-500 to-cyan-600", module: "horizon" },
  { icon: 'Target', title: "Pursuit", desc: "Threat Detection", color: "from-red-500 to-red-600", module: "pursuit" },
  { icon: 'Ticket', title: "Response", desc: "Service Desk", color: "from-purple-500 to-purple-600", module: "response" },
  { icon: 'Network', title: "Recon", desc: "Asset Discovery", color: "from-blue-500 to-indigo-600", module: "recon" },
  { icon: 'FileText', title: "Atlas", desc: "Knowledge Base", color: "from-amber-500 to-orange-600", module: "atlas" },
  { icon: 'ClipboardCheck', title: "Ledger", desc: "Compliance", color: "from-emerald-500 to-green-600", module: "ledger" },
  { icon: 'Bot', title: "Cortex", desc: "AI Operations", color: "from-violet-500 to-purple-600", module: "cortex" },
  { icon: 'Shield', title: "Sentinel", desc: "M365 Security", color: "from-rose-500 to-rose-600", module: "sentinel" },
];

export const liveActivityFeed = [
  { icon: 'Shield', text: "Pursuit blocked threat on DC-PRIMARY", time: "2m ago", color: "text-red-400" },
  { icon: 'CheckCircle', text: "Response ticket TKT-1038 resolved", time: "5m ago", color: "text-green-400" },
  { icon: 'Monitor', text: "Horizon agent deployed to LAPTOP-042", time: "8m ago", color: "text-cyan-400" },
  { icon: 'FileCheck', text: "Ledger: SOC 2 compliance scan completed", time: "12m ago", color: "text-emerald-400" },
];

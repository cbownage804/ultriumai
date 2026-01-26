import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Sparkles,
  Copy,
  Mail,
  Plus,
  Wand2,
  FileCheck,
  Scale,
  Shield,
  Wrench,
  Code,
  Database
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  variant?: "default" | "outline" | "secondary";
}

interface QuickActionToolbarProps {
  category?: string;
  templateId?: string;
  onAction: (prompt: string) => void;
  disabled?: boolean;
}

// Category-specific quick actions
const categoryActions: Record<string, QuickAction[]> = {
  "Financial Services": [
    { id: "new-dispute", label: "New Dispute", icon: <Plus className="h-4 w-4" />, prompt: "Help me write a new credit dispute letter for a different account" },
    { id: "follow-up", label: "Follow-up Letter", icon: <RefreshCw className="h-4 w-4" />, prompt: "Write a follow-up letter for a dispute that wasn't resolved after 30 days" },
    { id: "identity-theft", label: "Identity Theft", icon: <Shield className="h-4 w-4" />, prompt: "Create an identity theft dispute letter with police report reference" },
    { id: "609-letter", label: "609 Letter", icon: <FileCheck className="h-4 w-4" />, prompt: "Write a 609 verification letter requesting proof of debt" }
  ],
  "Professional Services": [
    { id: "executive-summary", label: "Executive Summary", icon: <FileText className="h-4 w-4" />, prompt: "Write the executive summary section for my grant proposal" },
    { id: "needs-statement", label: "Needs Statement", icon: <Sparkles className="h-4 w-4" />, prompt: "Help me write a compelling needs statement with data" },
    { id: "budget", label: "Budget Narrative", icon: <Database className="h-4 w-4" />, prompt: "Create a detailed budget narrative with line-item justifications" },
    { id: "objectives", label: "SMART Objectives", icon: <Wand2 className="h-4 w-4" />, prompt: "Write 3-5 SMART objectives for my program" }
  ],
  "Legal": [
    { id: "nda", label: "NDA", icon: <Scale className="h-4 w-4" />, prompt: "Draft a mutual non-disclosure agreement" },
    { id: "contractor", label: "Contractor Agreement", icon: <FileText className="h-4 w-4" />, prompt: "Create an independent contractor agreement" },
    { id: "terms", label: "Terms of Service", icon: <FileCheck className="h-4 w-4" />, prompt: "Write terms of service for my SaaS application" },
    { id: "privacy", label: "Privacy Policy", icon: <Shield className="h-4 w-4" />, prompt: "Draft a GDPR-compliant privacy policy" }
  ],
  "IT Support": [
    { id: "troubleshoot", label: "Troubleshoot", icon: <Wrench className="h-4 w-4" />, prompt: "Help me diagnose a new technical issue" },
    { id: "script", label: "Create Script", icon: <Code className="h-4 w-4" />, prompt: "Write a PowerShell or Bash script to automate this task" },
    { id: "document", label: "Document Fix", icon: <FileText className="h-4 w-4" />, prompt: "Create documentation for the solution we just discussed" },
    { id: "prevention", label: "Prevention Tips", icon: <Shield className="h-4 w-4" />, prompt: "What preventive measures can avoid this issue in the future?" }
  ],
  "Security": [
    { id: "analyze", label: "Analyze Threat", icon: <Shield className="h-4 w-4" />, prompt: "Analyze new suspicious content for threats" },
    { id: "incident", label: "Incident Response", icon: <RefreshCw className="h-4 w-4" />, prompt: "Help me create an incident response plan" },
    { id: "policy", label: "Security Policy", icon: <FileText className="h-4 w-4" />, prompt: "Draft a security policy document" },
    { id: "training", label: "Training Material", icon: <Sparkles className="h-4 w-4" />, prompt: "Create security awareness training content" }
  ],
  "Development": [
    { id: "cicd", label: "CI/CD Pipeline", icon: <Code className="h-4 w-4" />, prompt: "Create a complete CI/CD pipeline configuration" },
    { id: "terraform", label: "Terraform", icon: <Database className="h-4 w-4" />, prompt: "Write Terraform infrastructure as code" },
    { id: "kubernetes", label: "Kubernetes", icon: <Wrench className="h-4 w-4" />, prompt: "Create Kubernetes deployment manifests" },
    { id: "docker", label: "Docker Setup", icon: <Code className="h-4 w-4" />, prompt: "Write a production-ready Dockerfile and docker-compose" }
  ],
  "Infrastructure": [
    { id: "network-config", label: "Network Config", icon: <Database className="h-4 w-4" />, prompt: "Create a network configuration with VLANs and routing" },
    { id: "firewall", label: "Firewall Rules", icon: <Shield className="h-4 w-4" />, prompt: "Write firewall rules and ACL configurations" },
    { id: "vpn", label: "VPN Setup", icon: <Wrench className="h-4 w-4" />, prompt: "Configure a site-to-site or client VPN" },
    { id: "troubleshoot-net", label: "Troubleshoot", icon: <RefreshCw className="h-4 w-4" />, prompt: "Diagnose network connectivity issues" }
  ],
  "Cloud": [
    { id: "architecture", label: "Architecture", icon: <Database className="h-4 w-4" />, prompt: "Design a cloud architecture with cost estimates" },
    { id: "migration", label: "Migration Plan", icon: <RefreshCw className="h-4 w-4" />, prompt: "Create a cloud migration strategy" },
    { id: "cost-optimize", label: "Cost Optimize", icon: <Sparkles className="h-4 w-4" />, prompt: "Analyze and optimize cloud costs" },
    { id: "multi-region", label: "Multi-Region", icon: <Shield className="h-4 w-4" />, prompt: "Design a multi-region disaster recovery solution" }
  ],
  "Database": [
    { id: "query-optimize", label: "Optimize Query", icon: <Sparkles className="h-4 w-4" />, prompt: "Optimize this SQL query with execution plan analysis" },
    { id: "schema", label: "Design Schema", icon: <Database className="h-4 w-4" />, prompt: "Design a database schema for my application" },
    { id: "backup", label: "Backup Strategy", icon: <Shield className="h-4 w-4" />, prompt: "Create a database backup and recovery plan" },
    { id: "replication", label: "Replication", icon: <RefreshCw className="h-4 w-4" />, prompt: "Set up database replication for high availability" }
  ],
  "Insurance": [
    { id: "appeal", label: "New Appeal", icon: <FileText className="h-4 w-4" />, prompt: "Write a new insurance claim appeal letter" },
    { id: "medical-necessity", label: "Medical Necessity", icon: <FileCheck className="h-4 w-4" />, prompt: "Draft a medical necessity letter with clinical justifications" },
    { id: "second-appeal", label: "Second Appeal", icon: <RefreshCw className="h-4 w-4" />, prompt: "Write a second-level appeal after initial denial" },
    { id: "external-review", label: "External Review", icon: <Scale className="h-4 w-4" />, prompt: "Create an external review request for my state's insurance department" }
  ],
  "Documentation": [
    { id: "sop", label: "New SOP", icon: <FileText className="h-4 w-4" />, prompt: "Create a new standard operating procedure document" },
    { id: "kb-article", label: "KB Article", icon: <FileCheck className="h-4 w-4" />, prompt: "Write a knowledge base troubleshooting article" },
    { id: "runbook", label: "Runbook", icon: <Code className="h-4 w-4" />, prompt: "Create an operational runbook with step-by-step procedures" },
    { id: "network-doc", label: "Network Doc", icon: <Database className="h-4 w-4" />, prompt: "Document our network infrastructure with IP schemes" }
  ],
  "MSP Operations": [
    { id: "sla", label: "SLA Template", icon: <FileCheck className="h-4 w-4" />, prompt: "Create a service level agreement template for clients" },
    { id: "escalation", label: "Escalation Plan", icon: <RefreshCw className="h-4 w-4" />, prompt: "Design ticket escalation procedures" },
    { id: "communication", label: "Client Comms", icon: <Mail className="h-4 w-4" />, prompt: "Write client communication templates for common scenarios" },
    { id: "metrics", label: "Metrics Dashboard", icon: <Database className="h-4 w-4" />, prompt: "Create a service desk metrics dashboard structure" }
  ],
  "Compliance": [
    { id: "gap-analysis", label: "Gap Analysis", icon: <Sparkles className="h-4 w-4" />, prompt: "Create a compliance gap analysis for our organization" },
    { id: "policy", label: "Policy Document", icon: <FileText className="h-4 w-4" />, prompt: "Write a compliance policy document" },
    { id: "audit-prep", label: "Audit Prep", icon: <FileCheck className="h-4 w-4" />, prompt: "Help me prepare evidence for our compliance audit" },
    { id: "checklist", label: "Checklist", icon: <Shield className="h-4 w-4" />, prompt: "Develop a compliance checklist for our systems" }
  ],
  "Asset Management": [
    { id: "inventory", label: "Asset Inventory", icon: <Database className="h-4 w-4" />, prompt: "Create an asset tracking template for hardware inventory" },
    { id: "license-audit", label: "License Audit", icon: <FileCheck className="h-4 w-4" />, prompt: "Audit our software license usage and compliance" },
    { id: "refresh-plan", label: "Refresh Plan", icon: <RefreshCw className="h-4 w-4" />, prompt: "Develop a hardware refresh plan with budget projections" },
    { id: "procurement", label: "Procurement", icon: <Sparkles className="h-4 w-4" />, prompt: "Create an IT procurement approval workflow" }
  ],
  "Business Continuity": [
    { id: "backup-strategy", label: "Backup Strategy", icon: <Shield className="h-4 w-4" />, prompt: "Design a comprehensive 3-2-1 backup strategy" },
    { id: "dr-plan", label: "DR Plan", icon: <Database className="h-4 w-4" />, prompt: "Create a disaster recovery plan with RTOs and RPOs" },
    { id: "runbook", label: "DR Runbook", icon: <FileText className="h-4 w-4" />, prompt: "Write a DR runbook for critical systems" },
    { id: "test-plan", label: "Test Exercise", icon: <RefreshCw className="h-4 w-4" />, prompt: "Plan a disaster recovery test exercise" }
  ],
  "Management": [
    { id: "project-plan", label: "Project Plan", icon: <FileText className="h-4 w-4" />, prompt: "Create a complete IT project plan with timeline" },
    { id: "risk-assessment", label: "Risk Assessment", icon: <Shield className="h-4 w-4" />, prompt: "Build a project risk assessment matrix" },
    { id: "resource-plan", label: "Resources", icon: <Database className="h-4 w-4" />, prompt: "Create a resource and staffing plan" },
    { id: "stakeholder", label: "Communication", icon: <Mail className="h-4 w-4" />, prompt: "Create a stakeholder communication plan" }
  ],
  "Real Estate": [
    { id: "listing", label: "Listing", icon: <FileText className="h-4 w-4" />, prompt: "Write a compelling property listing description" },
    { id: "offer-letter", label: "Offer Letter", icon: <Mail className="h-4 w-4" />, prompt: "Draft a buyer's offer letter that stands out" },
    { id: "market-analysis", label: "Market Analysis", icon: <Database className="h-4 w-4" />, prompt: "Create a market analysis summary for a consultation" },
    { id: "follow-up", label: "Follow-up", icon: <RefreshCw className="h-4 w-4" />, prompt: "Write a follow-up email sequence for leads" }
  ],
  "Human Resources": [
    { id: "job-desc", label: "Job Description", icon: <FileText className="h-4 w-4" />, prompt: "Write a complete job description for a new position" },
    { id: "interview", label: "Interview Guide", icon: <Sparkles className="h-4 w-4" />, prompt: "Create interview questions for this role" },
    { id: "policy", label: "HR Policy", icon: <FileCheck className="h-4 w-4" />, prompt: "Draft an HR policy document" },
    { id: "onboarding", label: "Onboarding", icon: <RefreshCw className="h-4 w-4" />, prompt: "Create a 30-60-90 day onboarding plan" }
  ],
  "Marketing": [
    { id: "landing-page", label: "Landing Page", icon: <FileText className="h-4 w-4" />, prompt: "Write high-converting landing page copy" },
    { id: "email-sequence", label: "Email Sequence", icon: <Mail className="h-4 w-4" />, prompt: "Create a multi-email welcome or nurture sequence" },
    { id: "ad-copy", label: "Ad Copy", icon: <Sparkles className="h-4 w-4" />, prompt: "Write compelling ad copy for social or search" },
    { id: "value-prop", label: "Value Prop", icon: <Wand2 className="h-4 w-4" />, prompt: "Craft a compelling value proposition" }
  ],
  "Customer Success": [
    { id: "onboarding", label: "Onboarding", icon: <RefreshCw className="h-4 w-4" />, prompt: "Create a customer onboarding playbook" },
    { id: "health-score", label: "Health Score", icon: <Database className="h-4 w-4" />, prompt: "Design a customer health score framework" },
    { id: "qbr", label: "QBR Template", icon: <FileText className="h-4 w-4" />, prompt: "Write a quarterly business review template" },
    { id: "at-risk", label: "At-Risk Outreach", icon: <Mail className="h-4 w-4" />, prompt: "Create email templates for at-risk customer outreach" }
  ]
};

const defaultActions: QuickAction[] = [
  { id: "elaborate", label: "Elaborate", icon: <Sparkles className="h-4 w-4" />, prompt: "Can you elaborate on that with more detail?" },
  { id: "simplify", label: "Simplify", icon: <Wand2 className="h-4 w-4" />, prompt: "Can you simplify that explanation?" },
  { id: "example", label: "Example", icon: <FileText className="h-4 w-4" />, prompt: "Can you give me a specific example?" },
  { id: "next-steps", label: "Next Steps", icon: <RefreshCw className="h-4 w-4" />, prompt: "What are the next steps I should take?" }
];

export const QuickActionToolbar = ({
  category,
  templateId,
  onAction,
  disabled = false
}: QuickActionToolbarProps) => {
  const actions = category && categoryActions[category] ? categoryActions[category] : defaultActions;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 p-2 border-t bg-muted/30">
        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction(action.prompt)}
                disabled={disabled}
                className="h-8 text-xs gap-1.5 hover:bg-primary/10 hover:border-primary/50"
              >
                {action.icon}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{action.prompt}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

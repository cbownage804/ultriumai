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

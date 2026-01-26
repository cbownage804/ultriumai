import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FileText, 
  Download, 
  Globe, 
  Lock, 
  Sparkles, 
  Code,
  Scale,
  Shield,
  Database,
  Zap
} from "lucide-react";

interface TemplateFeatureBadgesProps {
  features?: string[];
  enableWebSearch?: boolean;
  category?: string;
  compact?: boolean;
}

// Map features to icons
const featureIcons: Record<string, React.ReactNode> = {
  "Complete Letters": <FileText className="h-3 w-3" />,
  "Complete Documents": <FileText className="h-3 w-3" />,
  "Complete Contracts": <Scale className="h-3 w-3" />,
  "Complete Proposals": <FileText className="h-3 w-3" />,
  "Complete Code Solutions": <Code className="h-3 w-3" />,
  "FCRA Citations": <Scale className="h-3 w-3" />,
  "Legal Citations": <Scale className="h-3 w-3" />,
  "All 3 Bureaus": <Database className="h-3 w-3" />,
  "Identity Theft Letters": <Shield className="h-3 w-3" />,
  "Step-by-Step Guides": <Zap className="h-3 w-3" />,
  "Hardware Support": <Zap className="h-3 w-3" />,
  "Software Troubleshooting": <Code className="h-3 w-3" />,
  "Network Issues": <Globe className="h-3 w-3" />,
  "Threat Analysis": <Shield className="h-3 w-3" />,
  "Incident Response": <Shield className="h-3 w-3" />,
  "Security Policies": <Lock className="h-3 w-3" />,
  "CI/CD Pipelines": <Code className="h-3 w-3" />,
  "Infrastructure as Code": <Database className="h-3 w-3" />,
  "Container Orchestration": <Code className="h-3 w-3" />,
  "Automation Scripts": <Code className="h-3 w-3" />,
  "SOP Templates": <FileText className="h-3 w-3" />,
  "Knowledge Base Articles": <FileText className="h-3 w-3" />,
  "NDA Templates": <Scale className="h-3 w-3" />,
  "Terms of Service": <Scale className="h-3 w-3" />,
  "Budget Narratives": <Database className="h-3 w-3" />,
  "SMART Objectives": <Sparkles className="h-3 w-3" />,
};

const featureDescriptions: Record<string, string> = {
  "Complete Letters": "Generates complete, ready-to-send letters with all required sections",
  "Complete Documents": "Produces full documents, not just outlines",
  "Complete Contracts": "Drafts complete legal agreements with all standard clauses",
  "FCRA Citations": "Includes proper Fair Credit Reporting Act legal references",
  "All 3 Bureaus": "Supports disputes to Experian, Equifax, and TransUnion",
  "Identity Theft Letters": "Specialized templates for identity theft disputes",
  "Step-by-Step Guides": "Provides numbered, actionable instructions",
  "Threat Analysis": "Analyzes security threats using MITRE ATT&CK framework",
  "Budget Narratives": "Creates detailed budget justifications for grants",
  "SMART Objectives": "Writes Specific, Measurable, Achievable, Relevant, Time-bound goals",
};

export const TemplateFeatureBadges = ({
  features = [],
  enableWebSearch = false,
  category,
  compact = false
}: TemplateFeatureBadgesProps) => {
  const displayFeatures = compact ? features.slice(0, 3) : features;
  
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {enableWebSearch && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
                <Globe className="h-3 w-3" />
                {!compact && "Web Search"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Can search the web for current information</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {displayFeatures.map((feature) => (
          <Tooltip key={feature}>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-[10px] h-5 gap-1"
              >
                {featureIcons[feature] || <Sparkles className="h-3 w-3" />}
                {!compact && feature}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{featureDescriptions[feature] || feature}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {compact && features.length > 3 && (
          <Badge variant="outline" className="text-[10px] h-5">
            +{features.length - 3} more
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};

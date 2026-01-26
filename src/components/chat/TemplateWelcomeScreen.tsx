import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  FileText, 
  Download, 
  Copy,
  ArrowRight,
  Lightbulb,
  Target,
  CheckCircle2,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface TemplateWelcomeScreenProps {
  gptName: string;
  description?: string;
  features?: string[];
  starterQuestions?: string[];
  themeColor?: string;
  category?: string;
  onQuestionSelect: (question: string) => void;
}

// Map categories to helpful tips and capabilities
const categoryCapabilities: Record<string, { icon: React.ReactNode; tips: string[]; capabilities: string[] }> = {
  "Financial Services": {
    icon: <FileText className="h-5 w-5" />,
    tips: [
      "Provide specific account numbers and creditor names for detailed letters",
      "Include dates and amounts for maximum accuracy",
      "Download letters as PDF for certified mail"
    ],
    capabilities: ["Complete dispute letters", "FCRA legal citations", "All 3 bureau addresses"]
  },
  "Professional Services": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Share your organization's mission for tailored content",
      "Include budget requirements for detailed narratives",
      "Specify the funder or grant type for targeted language"
    ],
    capabilities: ["Complete proposal sections", "SMART objectives", "Budget narratives"]
  },
  "Legal": {
    icon: <FileText className="h-5 w-5" />,
    tips: [
      "Provide party names and addresses for complete documents",
      "Specify jurisdiction for applicable laws",
      "Review with attorney before signing"
    ],
    capabilities: ["Complete contracts", "All standard clauses", "Ready-to-sign format"]
  },
  "IT Support": {
    icon: <Zap className="h-5 w-5" />,
    tips: [
      "Include error messages or screenshots for faster diagnosis",
      "Mention OS version and when the issue started",
      "Follow steps in order for best results"
    ],
    capabilities: ["Step-by-step troubleshooting", "Multiple solutions", "Prevention tips"]
  },
  "Security": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Share suspicious content for analysis",
      "Include timeline of events for incidents",
      "Note affected systems and scope"
    ],
    capabilities: ["Threat analysis", "Incident response", "Security recommendations"]
  },
  "Development": {
    icon: <Zap className="h-5 w-5" />,
    tips: [
      "Specify cloud provider and requirements",
      "Include scale and budget constraints",
      "Request complete, deployable code"
    ],
    capabilities: ["Production-ready code", "Best practices", "Complete configurations"]
  },
  "Infrastructure": {
    icon: <Zap className="h-5 w-5" />,
    tips: [
      "Specify device vendors (Cisco, Juniper, etc.)",
      "Include network size and topology requirements",
      "Request verification commands for configs"
    ],
    capabilities: ["Complete configurations", "Troubleshooting guides", "Security best practices"]
  },
  "Cloud": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Specify cloud provider (AWS, Azure, GCP)",
      "Include budget and compliance requirements",
      "Request cost estimates with architecture"
    ],
    capabilities: ["Architecture designs", "Cost optimization", "Migration planning"]
  },
  "Database": {
    icon: <Zap className="h-5 w-5" />,
    tips: [
      "Share your query or schema for analysis",
      "Include database type and version",
      "Specify performance requirements"
    ],
    capabilities: ["Query optimization", "Schema design", "Backup strategies"]
  },
  "Insurance": {
    icon: <FileText className="h-5 w-5" />,
    tips: [
      "Include claim numbers and denial reasons",
      "Provide policy details if available",
      "Attach medical documentation references"
    ],
    capabilities: ["Complete appeal letters", "Legal citations", "Medical necessity arguments"]
  },
  "Documentation": {
    icon: <FileText className="h-5 w-5" />,
    tips: [
      "Specify your documentation standard (ITGlue, etc.)",
      "Include system details for accuracy",
      "Request specific formats as needed"
    ],
    capabilities: ["SOPs", "Knowledge base articles", "Runbooks"]
  },
  "MSP Operations": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Specify your PSA/RMM tools",
      "Include SLA requirements",
      "Describe your escalation needs"
    ],
    capabilities: ["SLA templates", "Escalation procedures", "Client communications"]
  },
  "Compliance": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Specify the framework (SOC2, HIPAA, PCI-DSS)",
      "Include your current control status",
      "Note any audit deadlines"
    ],
    capabilities: ["Gap analysis", "Policy documents", "Audit preparation"]
  },
  "Asset Management": {
    icon: <Zap className="h-5 w-5" />,
    tips: [
      "Include asset categories and quantities",
      "Specify lifecycle requirements",
      "Note any compliance needs"
    ],
    capabilities: ["Inventory tracking", "License management", "Budget projections"]
  },
  "Business Continuity": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Identify critical systems and data",
      "Specify RTO/RPO requirements",
      "Include compliance requirements"
    ],
    capabilities: ["Backup strategies", "DR runbooks", "Test procedures"]
  },
  "Management": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Describe project scope and timeline",
      "Include stakeholder information",
      "Specify any constraints or risks"
    ],
    capabilities: ["Project planning", "Risk assessment", "Resource planning"]
  },
  "Real Estate": {
    icon: <FileText className="h-5 w-5" />,
    tips: [
      "Include property details and unique features",
      "Specify target buyer/seller profile",
      "Note local market conditions"
    ],
    capabilities: ["Listing descriptions", "Offer letters", "Market analysis"]
  },
  "Human Resources": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Specify role level and department",
      "Include company culture details",
      "Note any compliance requirements"
    ],
    capabilities: ["Job descriptions", "Interview guides", "HR policies"]
  },
  "Marketing": {
    icon: <Zap className="h-5 w-5" />,
    tips: [
      "Describe your target audience",
      "Include brand voice and tone",
      "Specify conversion goals"
    ],
    capabilities: ["Landing pages", "Email sequences", "Ad copy"]
  },
  "Customer Success": {
    icon: <Target className="h-5 w-5" />,
    tips: [
      "Describe your product and customer base",
      "Include key metrics and goals",
      "Specify touchpoint cadence"
    ],
    capabilities: ["Onboarding playbooks", "Health scoring", "QBR templates"]
  }
};

const defaultCapabilities = {
  icon: <Sparkles className="h-5 w-5" />,
  tips: [
    "Be specific about your requirements",
    "Ask follow-up questions for refinement",
    "Export your results as PDF"
  ],
  capabilities: ["Professional output", "Expert guidance", "Actionable results"]
};

export const TemplateWelcomeScreen = ({
  gptName,
  description,
  features = [],
  starterQuestions = [],
  themeColor = "#3b82f6",
  category,
  onQuestionSelect
}: TemplateWelcomeScreenProps) => {
  const categoryInfo = category ? categoryCapabilities[category] || defaultCapabilities : defaultCapabilities;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-6 space-y-6 max-w-3xl mx-auto"
    >
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          style={{ backgroundColor: themeColor }}
        >
          {gptName.charAt(0)}
        </motion.div>
        <h2 className="text-2xl font-bold">{gptName}</h2>
        {description && (
          <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        )}
        {category && (
          <Badge variant="secondary" className="mt-2">
            {category}
          </Badge>
        )}
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {categoryInfo.capabilities.map((capability, index) => (
          <motion.div
            key={capability}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-dashed hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{capability}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Start Section */}
      {starterQuestions.length > 0 && (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            <span>Try asking:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {starterQuestions.slice(0, 4).map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-3 px-4 text-left justify-start gap-3 hover:border-primary/50 hover:bg-primary/5 group"
                  onClick={() => onQuestionSelect(question)}
                >
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  <span className="text-sm line-clamp-2">{question}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tips */}
      <Card className="w-full bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pro Tips for Best Results</span>
          </div>
          <ul className="space-y-2">
            {categoryInfo.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Features */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      )}

      {/* Export reminder */}
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Download className="h-3 w-3" />
        All responses can be exported as PDF, copied, or emailed
      </p>
    </motion.div>
  );
};

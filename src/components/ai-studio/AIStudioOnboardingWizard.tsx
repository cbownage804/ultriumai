import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Code2, Zap, ArrowRight, ArrowLeft, CheckCircle,
  MessageSquare, Database, Workflow, FileText, Globe, Sparkles
} from "lucide-react";

const TEMPLATES = [
  { id: "support", icon: MessageSquare, label: "Customer Support Bot", desc: "AI trained on your KB to handle tier-1 tickets", category: "GPT" },
  { id: "knowledge", icon: Database, label: "Knowledge Base Q&A", desc: "Query internal docs in natural language", category: "GPT" },
  { id: "lead", icon: Globe, label: "Website Lead Bot", desc: "Qualify visitors and capture leads 24/7", category: "GPT" },
  { id: "workflow", icon: Workflow, label: "Ticket Router Agent", desc: "Auto-triage and route support tickets", category: "Agent" },
  { id: "docs", icon: FileText, label: "Doc Analyzer", desc: "Upload and analyze contracts and proposals", category: "GPT" },
  { id: "app", icon: Code2, label: "Dashboard App", desc: "Build a full-stack admin dashboard", category: "App" },
];

const STEPS = ["Choose Template", "Configure", "Deploy"];

interface Props {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export const AIStudioOnboardingWizard = ({ onComplete, onDismiss }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleContinue = () => {
    if (step === 0 && selectedTemplate) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Navigate to the appropriate builder
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (template?.category === "App") {
        navigate("/ai-studio/app-builder");
      } else if (template?.category === "Agent") {
        navigate("/ai-studio/agents/builder");
      } else {
        navigate("/dashboard/gpt/build");
      }
      onComplete?.();
    }
  };

  const selected = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-background overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h3 className="font-semibold">Get Started with AI Studio</h3>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs text-muted-foreground">
              Skip
            </Button>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                i < step ? "bg-emerald-500/20 text-emerald-400" :
                i === step ? "bg-violet-500/20 text-violet-300" :
                "bg-muted/50 text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  selectedTemplate === t.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-border/50 bg-card/50 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <t.icon className={`h-5 w-5 mt-0.5 ${selectedTemplate === t.id ? "text-violet-400" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0">{t.category}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <selected.icon className="h-6 w-6 text-violet-400" />
              <div>
                <p className="font-medium">{selected.label}</p>
                <p className="text-sm text-muted-foreground">{selected.desc}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Your {selected.category.toLowerCase()} will be pre-configured with:</p>
              <ul className="space-y-2">
                {[
                  "Optimized system prompt for this use case",
                  "Recommended model selection (Gemini 3 Flash)",
                  "Sample knowledge base structure",
                  "Pre-built action templates",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Ready to Build!</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You'll be taken to the {selected?.category === "App" ? "App Builder IDE" : selected?.category === "Agent" ? "Agent Builder" : "GPT Builder"} with your template pre-loaded.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(step - 1) : onDismiss?.()}
            disabled={step === 0 && !onDismiss}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            size="sm"
            onClick={handleContinue}
            disabled={step === 0 && !selectedTemplate}
            className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400"
          >
            {step === 2 ? "Launch Builder" : "Continue"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

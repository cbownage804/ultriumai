import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tag, FileText, Search, Shield, Monitor, AlertTriangle,
  Users, CheckCircle, Brain, Database, Sparkles
} from 'lucide-react';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  targetTable: string;
  triggerType: string;
  model: string;
  systemPrompt: string;
  outputMapping: Record<string, string>;
  conditions?: Record<string, any>;
  icon: string;
  category: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'ticket-auto-tagger',
    name: 'Ticket Auto-Tagger',
    description: 'Automatically categorize and prioritize support tickets based on content',
    targetTable: 'tickets',
    triggerType: 'on_create',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Analyze the ticket title and description. Assign a category (hardware, software, network, security, account, other) and suggest a priority (low, medium, high, critical). Return JSON with fields: category, priority, tags (array of relevant tags).',
    outputMapping: { category: 'category', priority: 'priority' },
    icon: '🎫',
    category: 'Helpdesk',
  },
  {
    id: 'lead-enrichment',
    name: 'Lead Enrichment',
    description: 'Enrich contact records with inferred department, role, and notes',
    targetTable: 'atlas_contacts',
    triggerType: 'on_create',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Given a contact with name, email, and organization, infer their likely department, role level, and generate a brief professional note. Return JSON with fields: department, title_suggestion, notes.',
    outputMapping: { department: 'department', title: 'title' },
    icon: '👤',
    category: 'Atlas',
  },
  {
    id: 'document-summarizer',
    name: 'Document Summarizer',
    description: 'Auto-generate summaries for new documentation entries',
    targetTable: 'atlas_documents',
    triggerType: 'on_create',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Summarize the document content in 2-3 sentences. Also suggest 3-5 relevant tags. Return JSON with fields: summary, tags (array).',
    outputMapping: { summary: 'description', tags: 'tags' },
    icon: '📄',
    category: 'Atlas',
  },
  {
    id: 'alert-classifier',
    name: 'Alert Classifier',
    description: 'Classify security alerts by threat type and recommend response actions',
    targetTable: 'realtime_alerts',
    triggerType: 'on_create',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Analyze this security alert. Classify the threat type (malware, phishing, brute_force, data_exfil, policy_violation, anomaly). Assess true positive likelihood (0-100). Recommend immediate action. Return JSON with: threat_type, confidence, recommended_action.',
    outputMapping: { threat_type: 'category', confidence: 'confidence_score' },
    icon: '🚨',
    category: 'Security',
  },
  {
    id: 'device-health-reporter',
    name: 'Device Health Reporter',
    description: 'Analyze device metrics and generate health assessments',
    targetTable: 'vanguard_agents',
    triggerType: 'manual',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Analyze the device information (OS, last seen, status). Generate a health assessment. Flag any concerns (outdated OS, offline too long, etc). Return JSON with: health_score (0-100), concerns (array), recommendations (array).',
    outputMapping: { health_score: 'health_score' },
    icon: '💻',
    category: 'Fleet',
  },
  {
    id: 'compliance-gap-finder',
    name: 'Compliance Gap Finder',
    description: 'Identify gaps and missing evidence in compliance frameworks',
    targetTable: 'compliance_frameworks',
    triggerType: 'manual',
    model: 'google/gemini-2.5-pro',
    systemPrompt: 'Review the compliance framework data including completion percentage and requirements. Identify the top gaps, missing evidence items, and priority remediation steps. Return JSON with: gaps (array), missing_evidence (array), remediation_priority (array).',
    outputMapping: {},
    icon: '✅',
    category: 'Compliance',
  },
  {
    id: 'sla-risk-predictor',
    name: 'SLA Risk Predictor',
    description: 'Predict tickets at risk of SLA breach based on age and priority',
    targetTable: 'tickets',
    triggerType: 'schedule',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Analyze open tickets. For each, assess SLA breach risk based on priority, age, and current status. Flag tickets likely to breach within 4 hours. Return JSON with: at_risk_tickets (array of {id, risk_level, hours_remaining, recommendation}).',
    outputMapping: {},
    icon: '⏰',
    category: 'Helpdesk',
  },
  {
    id: 'password-audit',
    name: 'Password Audit',
    description: 'Flag password entries that may need rotation based on age',
    targetTable: 'atlas_passwords',
    triggerType: 'schedule',
    model: 'google/gemini-2.5-flash-lite',
    systemPrompt: 'Review password entries and their last rotation dates. Flag any that are older than 90 days. Categorize risk level. Return JSON with: needs_rotation (array of {name, days_old, risk_level}), summary.',
    outputMapping: {},
    icon: '🔐',
    category: 'Security',
  },
  {
    id: 'kb-gap-detector',
    name: 'Knowledge Base Gap Detector',
    description: 'Analyze tickets to find frequently asked topics missing from KB',
    targetTable: 'knowledge_sources',
    triggerType: 'manual',
    model: 'google/gemini-2.5-flash',
    systemPrompt: 'Compare recent ticket topics with existing knowledge base articles. Identify topics that are frequently asked about but have no KB coverage. Return JSON with: gaps (array of {topic, frequency, suggested_article_title}), coverage_score (0-100).',
    outputMapping: {},
    icon: '📚',
    category: 'Atlas',
  },
  {
    id: 'asset-categorizer',
    name: 'Asset Auto-Categorizer',
    description: 'Automatically categorize and tag new assets based on their details',
    targetTable: 'assets',
    triggerType: 'on_create',
    model: 'google/gemini-2.5-flash-lite',
    systemPrompt: 'Analyze the asset name, manufacturer, model, and description. Assign a category (laptop, desktop, server, network, printer, mobile, other). Suggest lifecycle stage (new, active, aging, eol). Return JSON with: category, lifecycle_stage, tags (array).',
    outputMapping: { category: 'category' },
    icon: '📦',
    category: 'Assets',
  },
];

interface AIAgentTemplatesProps {
  onCreateFromTemplate: (templateId: string) => void;
}

export function AIAgentTemplates({ onCreateFromTemplate }: AIAgentTemplatesProps) {
  const categories = [...new Set(AGENT_TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          Agent Templates
        </h3>
        <p className="text-sm text-muted-foreground">
          Pre-built agents ready to deploy. Click "Use Template" to create an agent from any template.
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENT_TEMPLATES.filter(t => t.category === category).map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold">{template.name}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">{template.targetTable}</Badge>
                        <Badge variant="secondary" className="text-xs">{template.triggerType}</Badge>
                        <Badge variant="secondary" className="text-xs">{template.model.split('/').pop()}</Badge>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => onCreateFromTemplate(template.id)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

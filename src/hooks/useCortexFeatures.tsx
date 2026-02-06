/**
 * Centralized Cortex AI Feature Registry
 * Organizes all AI features by their parent module with activation controls.
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CortexFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  autoExecute: boolean;
  confidenceThreshold: number;
  notifications: boolean;
}

export interface CortexModule {
  id: string;
  name: string;
  description: string;
  color: string; // tailwind color prefix e.g. 'cyan', 'purple'
  features: CortexFeature[];
}

interface CortexFeaturesContextType {
  modules: CortexModule[];
  isFeatureEnabled: (featureId: string) => boolean;
  toggleFeature: (featureId: string) => void;
  updateFeature: (featureId: string, updates: Partial<CortexFeature>) => void;
  toggleAllInModule: (moduleId: string, enabled: boolean) => void;
  getModuleFeatures: (moduleId: string) => CortexFeature[];
  enabledCount: number;
  totalCount: number;
}

const DEFAULT_MODULES: CortexModule[] = [
  {
    id: 'helpdesk',
    name: 'Helpdesk / PSA',
    description: 'Ticket intelligence, routing, responses, and SLA management',
    color: 'indigo',
    features: [
      { id: 'ticket-router', name: 'AI Ticket Router', description: 'Auto-route tickets to the best technician based on skills and workload', enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: true },
      { id: 'ticket-summarizer', name: 'Ticket Summarizer', description: 'Auto-summarize ticket threads with key points and actions', enabled: true, autoExecute: true, confidenceThreshold: 80, notifications: false },
      { id: 'sentiment-analyzer', name: 'Sentiment Analyzer', description: 'Detect customer sentiment and flag frustrated or at-risk tickets', enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: true },
      { id: 'response-draft', name: 'Response Draft Generator', description: 'Generate professional ticket responses with appropriate tone', enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: false },
      { id: 'sla-predictor', name: 'SLA Predictor', description: 'Predict SLA breaches before they happen and recommend action', enabled: true, autoExecute: true, confidenceThreshold: 80, notifications: true },
      { id: 'escalation-engine', name: 'Escalation Engine', description: 'AI-driven escalation rules and automatic tier routing', enabled: true, autoExecute: false, confidenceThreshold: 90, notifications: true },
      { id: 'root-cause', name: 'Root Cause Analyzer', description: 'Identify root causes of recurring issues across ticket history', enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: true },
      { id: 'customer-health', name: 'Customer Health Score', description: 'Calculate customer health based on ticket patterns and CSAT', enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: true },
      { id: 'email-parser', name: 'Email-to-Ticket Parser', description: 'Parse inbound emails into structured tickets with categorization', enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: false },
      { id: 'voice-to-ticket', name: 'Voice-to-Ticket', description: 'Convert voice recordings/transcriptions into formatted tickets', enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: false },
      { id: 'workload-optimizer', name: 'Workload Optimizer', description: 'Balance ticket assignments across technicians optimally', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
      { id: 'smart-scheduler', name: 'Smart Scheduler', description: 'AI-optimized scheduling for tasks and on-site visits', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
    ],
  },
  {
    id: 'atlas',
    name: 'Atlas (Documentation)',
    description: 'IT documentation AI search, generation, and relationship mapping',
    color: 'cyan',
    features: [
      { id: 'atlas-ai-search', name: 'AI Search & Q&A', description: 'Natural language search across all documentation with AI answers', enabled: true, autoExecute: true, confidenceThreshold: 80, notifications: false },
      { id: 'atlas-doc-generator', name: 'AI Doc Generator', description: 'Auto-generate SOPs, policies, and runbooks from templates', enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: false },
      { id: 'atlas-relationship-mapper', name: 'AI Relationship Mapping', description: 'Auto-suggest related items and detect documentation gaps', enabled: true, autoExecute: false, confidenceThreshold: 75, notifications: true },
      { id: 'atlas-runbook-assistant', name: 'AI Runbook Assistant', description: 'Step-by-step guided runbooks with AI troubleshooting', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
      { id: 'kb-generator', name: 'KB Article Generator', description: 'Generate knowledge base articles from ticket resolutions', enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: true },
      { id: 'knowledge-search', name: 'Knowledge Search', description: 'AI-powered search across KB articles, tickets, and runbooks', enabled: true, autoExecute: true, confidenceThreshold: 80, notifications: false },
    ],
  },
  {
    id: 'pursuit',
    name: 'Pursuit (XDR / Security)',
    description: 'Threat detection, security analysis, and incident response AI',
    color: 'red',
    features: [
      { id: 'security-report', name: 'Security Report Generator', description: 'Generate compliance-ready security reports from scan results', enabled: true, autoExecute: false, confidenceThreshold: 90, notifications: true },
      { id: 'anomaly-detection', name: 'Anomaly Detection', description: 'Detect anomalous patterns in metrics, security events, and network traffic', enabled: true, autoExecute: true, confidenceThreshold: 90, notifications: true },
      { id: 'edr-timeline-ai', name: 'EDR AI Timeline', description: 'AI-powered attack chain reconstruction and "Tell the Full Story" narration', enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: true },
      { id: 'threat-report', name: 'Threat Report Generator', description: 'Generate formal threat reports with executive summaries and risk scores', enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: true },
    ],
  },
  {
    id: 'rmm',
    name: 'RMM / Operations',
    description: 'Device management, scripting, and predictive maintenance AI',
    color: 'emerald',
    features: [
      { id: 'asset-analyzer', name: 'Asset Analyzer', description: 'Analyze device screenshots and images for inventory and issues', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
      { id: 'script-generator', name: 'Script Generator', description: 'Generate PowerShell, Bash, and Python scripts for automation', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
      { id: 'predictive-maintenance', name: 'Predictive Maintenance', description: 'Predict device failures based on health metrics and age', enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: true },
      { id: 'screen-to-docs', name: 'Screen Recording to Docs', description: 'Convert screen recordings into step-by-step documentation', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
    ],
  },
  {
    id: 'sentinel',
    name: 'Sentinel (SaaS Security)',
    description: 'SaaS monitoring AI triage and automated response',
    color: 'amber',
    features: [
      { id: 'sentinel-ai-triage', name: 'AI Alert Triage', description: 'Auto-triage M365/Google Workspace alerts with risk scoring', enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: true },
      { id: 'sentinel-auto-ticket', name: 'Auto-Ticketing', description: 'Create security tickets from AI-triaged alerts automatically', enabled: true, autoExecute: true, confidenceThreshold: 90, notifications: true },
    ],
  },
  {
    id: 'general',
    name: 'General / Platform',
    description: 'Cross-module AI capabilities and the AI copilot',
    color: 'purple',
    features: [
      { id: 'technician-copilot', name: 'AI Technician Copilot', description: 'General-purpose AI assistant for troubleshooting and guidance', enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
      { id: 'pattern-detection', name: 'Pattern Detection Engine', description: 'Detect recurring patterns across all modules', enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: true },
      { id: 'live-chat-ai', name: 'AI Live Chat Widget', description: 'Customer-facing AI chatbot for self-service support', enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: false },
    ],
  },
];

const CortexFeaturesContext = createContext<CortexFeaturesContextType | null>(null);

export function CortexFeaturesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<CortexModule[]>(DEFAULT_MODULES);

  const isFeatureEnabled = useCallback((featureId: string) => {
    for (const mod of modules) {
      const feature = mod.features.find(f => f.id === featureId);
      if (feature) return feature.enabled;
    }
    return false;
  }, [modules]);

  const toggleFeature = useCallback((featureId: string) => {
    setModules(prev => prev.map(mod => ({
      ...mod,
      features: mod.features.map(f =>
        f.id === featureId ? { ...f, enabled: !f.enabled } : f
      ),
    })));
  }, []);

  const updateFeature = useCallback((featureId: string, updates: Partial<CortexFeature>) => {
    setModules(prev => prev.map(mod => ({
      ...mod,
      features: mod.features.map(f =>
        f.id === featureId ? { ...f, ...updates } : f
      ),
    })));
  }, []);

  const toggleAllInModule = useCallback((moduleId: string, enabled: boolean) => {
    setModules(prev => prev.map(mod =>
      mod.id === moduleId
        ? { ...mod, features: mod.features.map(f => ({ ...f, enabled })) }
        : mod
    ));
  }, []);

  const getModuleFeatures = useCallback((moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.features ?? [];
  }, [modules]);

  const totalCount = modules.reduce((sum, m) => sum + m.features.length, 0);
  const enabledCount = modules.reduce((sum, m) => sum + m.features.filter(f => f.enabled).length, 0);

  return (
    <CortexFeaturesContext.Provider value={{
      modules, isFeatureEnabled, toggleFeature, updateFeature,
      toggleAllInModule, getModuleFeatures, enabledCount, totalCount,
    }}>
      {children}
    </CortexFeaturesContext.Provider>
  );
}

export function useCortexFeatures() {
  const ctx = useContext(CortexFeaturesContext);
  if (!ctx) throw new Error('useCortexFeatures must be used within CortexFeaturesProvider');
  return ctx;
}

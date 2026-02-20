// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useAICodeTranslator } from '@/hooks/useAICodeTranslator';
import { useSmartScaffolding } from '@/hooks/useSmartScaffolding';
import { useNLWorkflowAutomation } from '@/hooks/useNLWorkflowAutomation';
import { useAIPerformanceOptimizer } from '@/hooks/useAIPerformanceOptimizer';
import { useAISecurityAuditor } from '@/hooks/useAISecurityAuditor';
import {
  CodeTranslatorPanel, SmartScaffoldingPanel, WorkflowAutomationPanel,
  PerfOptimizerPanel, SecurityAuditorPanel,
} from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showCodeTranslator: boolean; setShowCodeTranslator: (v: boolean) => void;
  showSmartScaffold: boolean; setShowSmartScaffold: (v: boolean) => void;
  showWorkflowAutomation: boolean; setShowWorkflowAutomation: (v: boolean) => void;
  showPerfOptimizer: boolean; setShowPerfOptimizer: (v: boolean) => void;
  showSecurityAuditor: boolean; setShowSecurityAuditor: (v: boolean) => void;
}

export function AIAutomationPanelGroup(props: Props) {
  const codeTranslator = useAICodeTranslator();
  const smartScaffolding = useSmartScaffolding();
  const workflowAutomation = useNLWorkflowAutomation();
  const perfOptimizer = useAIPerformanceOptimizer();
  const securityAuditor = useAISecurityAuditor();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showCodeTranslator} name="Code Translator">
        <CodeTranslatorPanel open={props.showCodeTranslator} onClose={() => props.setShowCodeTranslator(false)} sourceLanguage={codeTranslator.sourceLanguage} targetLanguage={codeTranslator.targetLanguage} onSetSource={codeTranslator.setSourceLanguage} onSetTarget={codeTranslator.setTargetLanguage} translatedCode={codeTranslator.translatedCode} isTranslating={codeTranslator.isTranslating} onTranslate={(code: string) => codeTranslator.translate(code)} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showSmartScaffold} name="Smart Scaffolding">
        <SmartScaffoldingPanel open={props.showSmartScaffold} onClose={() => props.setShowSmartScaffold(false)} templates={smartScaffolding.templates} onGenerate={(template: string) => { const files = smartScaffolding.generate(template); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showWorkflowAutomation} name="Workflow Automation">
        <WorkflowAutomationPanel open={props.showWorkflowAutomation} onClose={() => props.setShowWorkflowAutomation(false)} workflows={workflowAutomation.workflows} onAdd={workflowAutomation.addWorkflow} onRemove={workflowAutomation.removeWorkflow} onGenerate={(id: string) => { const code = workflowAutomation.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showPerfOptimizer} name="Performance Optimizer">
        <PerfOptimizerPanel open={props.showPerfOptimizer} onClose={() => props.setShowPerfOptimizer(false)} suggestions={perfOptimizer.suggestions} isAnalyzing={perfOptimizer.isAnalyzing} onAnalyze={() => perfOptimizer.analyze(props.project.files)} onApply={(id: string) => { const result = perfOptimizer.applySuggestion(id, props.project.files); if (result) result.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showSecurityAuditor} name="Security Auditor">
        <SecurityAuditorPanel open={props.showSecurityAuditor} onClose={() => props.setShowSecurityAuditor(false)} findings={securityAuditor.findings} isAuditing={securityAuditor.isAuditing} onAudit={() => securityAuditor.audit(props.project.files)} onDismiss={securityAuditor.dismissFinding} />
      </SafePanel>
    </>
  );
}

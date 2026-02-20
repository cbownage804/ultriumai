// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useKPIDashboardBuilder } from '@/hooks/useKPIDashboardBuilder';
import { useAlertingRulesEngine } from '@/hooks/useAlertingRulesEngine';
import { useAuditTrailGenerator } from '@/hooks/useAuditTrailGenerator';
import { useClickHeatmap } from '@/hooks/useClickHeatmap';
import { useBudgetCostMonitor } from '@/hooks/useBudgetCostMonitor';
import { KPIDashboardPanel, AlertingRulesPanel, AuditTrailPanel, ClickHeatmapPanel, BudgetMonitorPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showKPIDashboard: boolean; setShowKPIDashboard: (v: boolean) => void;
  showAlertingRules: boolean; setShowAlertingRules: (v: boolean) => void;
  showAuditTrail: boolean; setShowAuditTrail: (v: boolean) => void;
  showClickHeatmap: boolean; setShowClickHeatmap: (v: boolean) => void;
  showBudgetMonitor: boolean; setShowBudgetMonitor: (v: boolean) => void;
}

export function MonitoringPanelGroup(props: Props) {
  const kpiDashboard = useKPIDashboardBuilder();
  const alertingRules = useAlertingRulesEngine();
  const auditTrail = useAuditTrailGenerator();
  const clickHeatmap = useClickHeatmap();
  const budgetMonitor = useBudgetCostMonitor();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showKPIDashboard} name="KPI Dashboard">
        <KPIDashboardPanel open={props.showKPIDashboard} onClose={() => props.setShowKPIDashboard(false)} widgets={kpiDashboard.widgets} onAdd={kpiDashboard.addWidget} onRemove={kpiDashboard.removeWidget} onGenerateCode={kpiDashboard.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAlertingRules} name="Alerting Rules">
        <AlertingRulesPanel open={props.showAlertingRules} onClose={() => props.setShowAlertingRules(false)} rules={alertingRules.rules} onAdd={alertingRules.addRule} onRemove={alertingRules.removeRule} onToggle={alertingRules.toggleRule} onGenerateCode={alertingRules.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAuditTrail} name="Audit Trail">
        <AuditTrailPanel open={props.showAuditTrail} onClose={() => props.setShowAuditTrail(false)} config={auditTrail.config} onUpdateConfig={auditTrail.updateConfig} onGenerateCode={auditTrail.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showClickHeatmap} name="Click Heatmap">
        <ClickHeatmapPanel open={props.showClickHeatmap} onClose={() => props.setShowClickHeatmap(false)} isRecording={clickHeatmap.isRecording} clicks={clickHeatmap.clicks} onStartRecording={clickHeatmap.startRecording} onStopRecording={clickHeatmap.stopRecording} onClear={clickHeatmap.clearClicks} onGenerateCode={clickHeatmap.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showBudgetMonitor} name="Budget Monitor">
        <BudgetMonitorPanel open={props.showBudgetMonitor} onClose={() => props.setShowBudgetMonitor(false)} budget={budgetMonitor.budget} spending={budgetMonitor.spending} alerts={budgetMonitor.alerts} onUpdateBudget={budgetMonitor.updateBudget} onAddAlert={budgetMonitor.addAlert} onRemoveAlert={budgetMonitor.removeAlert} />
      </SafePanel>
    </>
  );
}

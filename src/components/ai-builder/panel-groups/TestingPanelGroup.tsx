// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useVisualRegressionTesting } from '@/hooks/useVisualRegressionTesting';
import { useAccessibilityScoring } from '@/hooks/useAccessibilityScoring';
import { useCodeCoverageVisualizer } from '@/hooks/useCodeCoverageVisualizer';
import { useMutationTesting } from '@/hooks/useMutationTesting';
import { useLoadTesting } from '@/hooks/useLoadTesting';
import { VisualRegressionPanel, AccessibilityPanel, CodeCoveragePanel, MutationTestingPanel, LoadTestingPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showVisualRegression: boolean; setShowVisualRegression: (v: boolean) => void;
  showA11yScore: boolean; setShowA11yScore: (v: boolean) => void;
  showCoverage: boolean; setShowCoverage: (v: boolean) => void;
  showMutationTest: boolean; setShowMutationTest: (v: boolean) => void;
  showLoadTest: boolean; setShowLoadTest: (v: boolean) => void;
}

export function TestingPanelGroup(props: Props) {
  const visualRegression = useVisualRegressionTesting();
  const a11yScoring = useAccessibilityScoring();
  const codeCoverage = useCodeCoverageVisualizer();
  const mutationTesting = useMutationTesting();
  const loadTesting = useLoadTesting();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showVisualRegression} name="Visual Regression">
        <VisualRegressionPanel open={props.showVisualRegression} onClose={() => props.setShowVisualRegression(false)} snapshots={visualRegression.snapshots} isRunning={visualRegression.isRunning} onCapture={() => visualRegression.captureBaseline(props.project.files)} onCompare={visualRegression.compareSnapshots} onClear={visualRegression.clearSnapshots} />
      </SafePanel>
      <SafePanel show={props.showA11yScore} name="Accessibility">
        <AccessibilityPanel open={props.showA11yScore} onClose={() => props.setShowA11yScore(false)} score={a11yScoring.score} issues={a11yScoring.issues} isAuditing={a11yScoring.isAuditing} onAudit={() => a11yScoring.audit(props.project.files)} onDismiss={a11yScoring.dismissIssue} />
      </SafePanel>
      <SafePanel show={props.showCoverage} name="Code Coverage">
        <CodeCoveragePanel open={props.showCoverage} onClose={() => props.setShowCoverage(false)} coverage={codeCoverage.coverage} totalCoverage={codeCoverage.totalCoverage} onAnalyze={() => codeCoverage.analyze(props.project.files)} />
      </SafePanel>
      <SafePanel show={props.showMutationTest} name="Mutation Testing">
        <MutationTestingPanel open={props.showMutationTest} onClose={() => props.setShowMutationTest(false)} mutants={mutationTesting.mutants} score={mutationTesting.score} isRunning={mutationTesting.isRunning} onRun={() => mutationTesting.runMutationTests(props.project.files)} />
      </SafePanel>
      <SafePanel show={props.showLoadTest} name="Load Testing">
        <LoadTestingPanel open={props.showLoadTest} onClose={() => props.setShowLoadTest(false)} config={loadTesting.config} results={loadTesting.results} isRunning={loadTesting.isRunning} onUpdateConfig={loadTesting.updateConfig} onRun={loadTesting.runTest} onInsertCode={insertCode} publishedUrl={props.publishedUrl} />
      </SafePanel>
    </>
  );
}

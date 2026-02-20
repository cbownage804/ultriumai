// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useTutorialCreator } from '@/hooks/useTutorialCreator';
import { useCodePlayground } from '@/hooks/useCodePlayground';
import { useCustomLinting } from '@/hooks/useCustomLinting';
import { useDependencyGraph } from '@/hooks/useDependencyGraph';
import { useGitBlameTimeline } from '@/hooks/useGitBlameTimeline';
import { TutorialCreatorPanel, CodePlaygroundPanel, CustomLintingPanel, DependencyGraphPanel, GitBlameTimelinePanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showTutorialCreator: boolean; setShowTutorialCreator: (v: boolean) => void;
  showCodePlayground: boolean; setShowCodePlayground: (v: boolean) => void;
  showCustomLinting: boolean; setShowCustomLinting: (v: boolean) => void;
  showDepGraph: boolean; setShowDepGraph: (v: boolean) => void;
  showGitBlame: boolean; setShowGitBlame: (v: boolean) => void;
}

export function DevExperiencePanelGroup(props: Props) {
  const tutorialCreator = useTutorialCreator();
  const codePlayground = useCodePlayground();
  const customLinting = useCustomLinting();
  const dependencyGraph = useDependencyGraph();
  const gitBlame = useGitBlameTimeline();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showTutorialCreator} name="Tutorial Creator">
        <TutorialCreatorPanel open={props.showTutorialCreator} onClose={() => props.setShowTutorialCreator(false)} steps={tutorialCreator.steps} onAdd={tutorialCreator.addStep} onRemove={tutorialCreator.removeStep} onReorder={tutorialCreator.reorderSteps} onGenerateCode={tutorialCreator.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCodePlayground} name="Code Playground">
        <CodePlaygroundPanel open={props.showCodePlayground} onClose={() => props.setShowCodePlayground(false)} code={codePlayground.code} output={codePlayground.output} onCodeChange={codePlayground.setCode} onRun={codePlayground.run} />
      </SafePanel>
      <SafePanel show={props.showCustomLinting} name="Custom Linting">
        <CustomLintingPanel open={props.showCustomLinting} onClose={() => props.setShowCustomLinting(false)} rules={customLinting.rules} onAdd={customLinting.addRule} onRemove={customLinting.removeRule} onToggle={customLinting.toggleRule} onRun={() => customLinting.lint(props.project.files)} results={customLinting.results} />
      </SafePanel>
      <SafePanel show={props.showDepGraph} name="Dependency Graph">
        <DependencyGraphPanel open={props.showDepGraph} onClose={() => props.setShowDepGraph(false)} graph={dependencyGraph.graph} onAnalyze={() => dependencyGraph.analyze(props.project.files)} onSelectNode={(path: string) => { props.setActiveFile(path); props.setRightTab('code'); }} />
      </SafePanel>
      <SafePanel show={props.showGitBlame} name="Git Blame">
        <GitBlameTimelinePanel open={props.showGitBlame} onClose={() => props.setShowGitBlame(false)} entries={gitBlame.entries} onAnalyze={() => gitBlame.analyze(props.project.files)} />
      </SafePanel>
    </>
  );
}

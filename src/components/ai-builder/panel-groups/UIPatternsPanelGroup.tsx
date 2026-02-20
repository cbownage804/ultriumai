// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useStepperWizardBuilder } from '@/hooks/useStepperWizardBuilder';
import { useCommandMenuBuilder } from '@/hooks/useCommandMenuBuilder';
import { useBreadcrumbGenerator } from '@/hooks/useBreadcrumbGenerator';
import { useMegaMenuBuilder } from '@/hooks/useMegaMenuBuilder';
import { useContextMenuDesigner } from '@/hooks/useContextMenuDesigner';
import { StepperWizardPanel, CommandMenuPanel, BreadcrumbPanel, MegaMenuPanel, ContextMenuPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showStepperWizard: boolean; setShowStepperWizard: (v: boolean) => void;
  showCommandMenuBuilder: boolean; setShowCommandMenuBuilder: (v: boolean) => void;
  showBreadcrumbGen: boolean; setShowBreadcrumbGen: (v: boolean) => void;
  showMegaMenu: boolean; setShowMegaMenu: (v: boolean) => void;
  showContextMenu: boolean; setShowContextMenu: (v: boolean) => void;
}

export function UIPatternsPanelGroup(props: Props) {
  const stepperWizard = useStepperWizardBuilder();
  const commandMenuBuilder = useCommandMenuBuilder();
  const breadcrumbGen = useBreadcrumbGenerator();
  const megaMenu = useMegaMenuBuilder();
  const contextMenuDesigner = useContextMenuDesigner();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showStepperWizard} name="Stepper Wizard">
        <StepperWizardPanel open={props.showStepperWizard} onClose={() => props.setShowStepperWizard(false)} steps={stepperWizard.steps} onAdd={stepperWizard.addStep} onRemove={stepperWizard.removeStep} onReorder={stepperWizard.reorderSteps} onGenerateCode={stepperWizard.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCommandMenuBuilder} name="Command Menu">
        <CommandMenuPanel open={props.showCommandMenuBuilder} onClose={() => props.setShowCommandMenuBuilder(false)} items={commandMenuBuilder.items} onAdd={commandMenuBuilder.addItem} onRemove={commandMenuBuilder.removeItem} onGenerateCode={commandMenuBuilder.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showBreadcrumbGen} name="Breadcrumb Generator">
        <BreadcrumbPanel open={props.showBreadcrumbGen} onClose={() => props.setShowBreadcrumbGen(false)} config={breadcrumbGen.config} onUpdateConfig={breadcrumbGen.updateConfig} onGenerateCode={breadcrumbGen.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showMegaMenu} name="Mega Menu">
        <MegaMenuPanel open={props.showMegaMenu} onClose={() => props.setShowMegaMenu(false)} sections={megaMenu.sections} onAdd={megaMenu.addSection} onRemove={megaMenu.removeSection} onGenerateCode={megaMenu.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showContextMenu} name="Context Menu">
        <ContextMenuPanel open={props.showContextMenu} onClose={() => props.setShowContextMenu(false)} items={contextMenuDesigner.items} onAdd={contextMenuDesigner.addItem} onRemove={contextMenuDesigner.removeItem} onGenerateCode={contextMenuDesigner.generateCode} onInsertCode={insertCode} />
      </SafePanel>
    </>
  );
}

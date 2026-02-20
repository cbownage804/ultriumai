// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useChangelogAutoGenerator } from '@/hooks/useChangelogAutoGenerator';
import { useREADMEGenerator } from '@/hooks/useREADMEGenerator';
import { useLicensePicker } from '@/hooks/useLicensePicker';
import { useOpenAPISpecGenerator } from '@/hooks/useOpenAPISpecGenerator';
import { useProjectHealthScore } from '@/hooks/useProjectHealthScore';
import { ChangelogAutoPanel, READMEGeneratorPanel, LicensePickerPanel, OpenAPISpecPanel } from '../lazyPanels';
import { ProjectHealthPanel } from '../ProjectHealthPanel';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showChangelogAuto: boolean; setShowChangelogAuto: (v: boolean) => void;
  showREADMEGen: boolean; setShowREADMEGen: (v: boolean) => void;
  showLicensePicker: boolean; setShowLicensePicker: (v: boolean) => void;
  showOpenAPISpec: boolean; setShowOpenAPISpec: (v: boolean) => void;
  showProjectHealth: boolean; setShowProjectHealth: (v: boolean) => void;
}

export function FinalPolishPanelGroup(props: Props) {
  const changelogAutoGen = useChangelogAutoGenerator();
  const readmeGen = useREADMEGenerator();
  const licensePicker = useLicensePicker();
  const openAPISpec = useOpenAPISpecGenerator();
  const projectHealth = useProjectHealthScore();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showChangelogAuto} name="Changelog Auto">
        <ChangelogAutoPanel open={props.showChangelogAuto} onClose={() => props.setShowChangelogAuto(false)} entries={changelogAutoGen.entries} onGenerate={() => changelogAutoGen.generate(props.project.files)} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showREADMEGen} name="README Generator">
        <READMEGeneratorPanel open={props.showREADMEGen} onClose={() => props.setShowREADMEGen(false)} content={readmeGen.content} onGenerate={() => readmeGen.generate(props.project.name, props.project.files)} onInsertCode={insertCode} onSaveToProject={() => props.upsertFile('README.md', readmeGen.content)} />
      </SafePanel>
      <SafePanel show={props.showLicensePicker} name="License Picker">
        <LicensePickerPanel open={props.showLicensePicker} onClose={() => props.setShowLicensePicker(false)} licenses={licensePicker.licenses} selectedLicense={licensePicker.selectedLicense} onSelect={licensePicker.selectLicense} onApply={() => { const text = licensePicker.generateLicenseText(props.project.name); if (text) props.upsertFile('LICENSE', text); }} />
      </SafePanel>
      <SafePanel show={props.showOpenAPISpec} name="OpenAPI Spec">
        <OpenAPISpecPanel open={props.showOpenAPISpec} onClose={() => props.setShowOpenAPISpec(false)} spec={openAPISpec.spec} onGenerate={() => openAPISpec.generate(props.project.files)} onInsertCode={insertCode} onSaveToProject={() => props.upsertFile('openapi.yaml', openAPISpec.spec)} />
      </SafePanel>
      <SafePanel show={props.showProjectHealth} name="Project Health">
        <ProjectHealthPanel open={props.showProjectHealth} onClose={() => props.setShowProjectHealth(false)} score={projectHealth.score} checks={projectHealth.checks} onRefresh={() => projectHealth.analyze(props.project.files)} />
      </SafePanel>
    </>
  );
}

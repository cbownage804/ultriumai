// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useMultiRegionDeploy } from '@/hooks/useMultiRegionDeploy';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useCanaryDeploy } from '@/hooks/useCanaryDeploy';
import { useStaticSiteGenerator } from '@/hooks/useStaticSiteGenerator';
import { useDockerExport } from '@/hooks/useDockerExport';
import { MultiRegionPanel, FeatureFlagsPanel, CanaryDeployPanel, SSGPanel, DockerExportPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showMultiRegion: boolean; setShowMultiRegion: (v: boolean) => void;
  showFeatureFlags: boolean; setShowFeatureFlags: (v: boolean) => void;
  showCanaryDeploy: boolean; setShowCanaryDeploy: (v: boolean) => void;
  showSSG: boolean; setShowSSG: (v: boolean) => void;
  showDockerExport: boolean; setShowDockerExport: (v: boolean) => void;
}

export function DeploymentPanelGroup(props: Props) {
  const multiRegionDeploy = useMultiRegionDeploy();
  const featureFlags = useFeatureFlags();
  const canaryDeploy = useCanaryDeploy();
  const ssgGenerator = useStaticSiteGenerator();
  const dockerExport = useDockerExport();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showMultiRegion} name="Multi-Region Deploy">
        <MultiRegionPanel open={props.showMultiRegion} onClose={() => props.setShowMultiRegion(false)} regions={multiRegionDeploy.regions} onToggle={multiRegionDeploy.toggleRegion} onDeploy={multiRegionDeploy.deploy} status={multiRegionDeploy.status} />
      </SafePanel>
      <SafePanel show={props.showFeatureFlags} name="Feature Flags">
        <FeatureFlagsPanel open={props.showFeatureFlags} onClose={() => props.setShowFeatureFlags(false)} flags={featureFlags.flags} onAdd={featureFlags.addFlag} onRemove={featureFlags.removeFlag} onToggle={featureFlags.toggleFlag} onGenerateCode={featureFlags.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCanaryDeploy} name="Canary Deploy">
        <CanaryDeployPanel open={props.showCanaryDeploy} onClose={() => props.setShowCanaryDeploy(false)} config={canaryDeploy.config} onUpdateConfig={canaryDeploy.updateConfig} status={canaryDeploy.status} onStart={canaryDeploy.startCanary} onPromote={canaryDeploy.promote} onRollback={canaryDeploy.rollback} />
      </SafePanel>
      <SafePanel show={props.showSSG} name="Static Site Generator">
        <SSGPanel open={props.showSSG} onClose={() => props.setShowSSG(false)} config={ssgGenerator.config} onUpdateConfig={ssgGenerator.updateConfig} onGenerate={() => { const files = ssgGenerator.generate(props.project.files); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showDockerExport} name="Docker Export">
        <DockerExportPanel open={props.showDockerExport} onClose={() => props.setShowDockerExport(false)} config={dockerExport.config} onUpdateConfig={dockerExport.updateConfig} onGenerate={() => { const files = dockerExport.generate(props.project.files); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
    </>
  );
}

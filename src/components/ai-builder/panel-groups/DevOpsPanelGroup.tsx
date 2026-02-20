// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useDockerComposeGenerator } from '@/hooks/useDockerComposeGenerator';
import { useKubernetesGenerator } from '@/hooks/useKubernetesGenerator';
import { useCICDPipelineDesigner } from '@/hooks/useCICDPipelineDesigner';
import { useStructuredLogger } from '@/hooks/useStructuredLogger';
import { useHealthCheckGenerator } from '@/hooks/useHealthCheckGenerator';
import { DockerComposePanel, KubernetesPanel, CICDPipelinePanel, StructuredLoggerPanel, HealthCheckPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showDockerCompose: boolean; setShowDockerCompose: (v: boolean) => void;
  showK8s: boolean; setShowK8s: (v: boolean) => void;
  showCICDPipeline: boolean; setShowCICDPipeline: (v: boolean) => void;
  showStructuredLogger: boolean; setShowStructuredLogger: (v: boolean) => void;
  showHealthCheck: boolean; setShowHealthCheck: (v: boolean) => void;
}

export function DevOpsPanelGroup(props: Props) {
  const dockerCompose = useDockerComposeGenerator();
  const k8sGenerator = useKubernetesGenerator();
  const cicdPipeline = useCICDPipelineDesigner();
  const structuredLogger = useStructuredLogger();
  const healthCheck = useHealthCheckGenerator();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showDockerCompose} name="Docker Compose">
        <DockerComposePanel open={props.showDockerCompose} onClose={() => props.setShowDockerCompose(false)} services={dockerCompose.services} onAdd={dockerCompose.addService} onRemove={dockerCompose.removeService} onGenerate={dockerCompose.generateCompose} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showK8s} name="Kubernetes">
        <KubernetesPanel open={props.showK8s} onClose={() => props.setShowK8s(false)} resources={k8sGenerator.resources} onAdd={k8sGenerator.addResource} onRemove={k8sGenerator.removeResource} onGenerate={k8sGenerator.generateManifests} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCICDPipeline} name="CI/CD Pipeline">
        <CICDPipelinePanel open={props.showCICDPipeline} onClose={() => props.setShowCICDPipeline(false)} pipeline={cicdPipeline.pipeline} onUpdatePipeline={cicdPipeline.updatePipeline} onGenerate={cicdPipeline.generateConfig} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showStructuredLogger} name="Structured Logger">
        <StructuredLoggerPanel open={props.showStructuredLogger} onClose={() => props.setShowStructuredLogger(false)} config={structuredLogger.config} onUpdateConfig={structuredLogger.updateConfig} onGenerateCode={structuredLogger.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showHealthCheck} name="Health Check">
        <HealthCheckPanel open={props.showHealthCheck} onClose={() => props.setShowHealthCheck(false)} checks={healthCheck.checks} onAdd={healthCheck.addCheck} onRemove={healthCheck.removeCheck} onGenerateCode={healthCheck.generateCode} onInsertCode={insertCode} />
      </SafePanel>
    </>
  );
}

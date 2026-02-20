// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useOAuthProviderSetup } from '@/hooks/useOAuthProviderSetup';
import { useMFAFlowGenerator } from '@/hooks/useMFAFlowGenerator';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useAPIKeyManagement } from '@/hooks/useAPIKeyManagement';
import { usePermissionMatrixBuilder } from '@/hooks/usePermissionMatrixBuilder';
import { OAuthSetupPanel, MFAFlowPanel, SessionManagerPanel, APIKeyPanel, PermissionMatrixPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showOAuthSetup: boolean; setShowOAuthSetup: (v: boolean) => void;
  showMFAFlow: boolean; setShowMFAFlow: (v: boolean) => void;
  showSessionMgr: boolean; setShowSessionMgr: (v: boolean) => void;
  showAPIKeyMgmt: boolean; setShowAPIKeyMgmt: (v: boolean) => void;
  showPermMatrix: boolean; setShowPermMatrix: (v: boolean) => void;
}

export function AuthSecurityPanelGroup(props: Props) {
  const oauthSetup = useOAuthProviderSetup();
  const mfaFlow = useMFAFlowGenerator();
  const sessionMgr = useSessionManager();
  const apiKeyMgmt = useAPIKeyManagement();
  const permMatrix = usePermissionMatrixBuilder();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showOAuthSetup} name="OAuth Setup">
        <OAuthSetupPanel open={props.showOAuthSetup} onClose={() => props.setShowOAuthSetup(false)} providers={oauthSetup.providers} onToggle={oauthSetup.toggleProvider} onUpdateConfig={oauthSetup.updateProviderConfig} onGenerateCode={oauthSetup.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showMFAFlow} name="MFA Flow">
        <MFAFlowPanel open={props.showMFAFlow} onClose={() => props.setShowMFAFlow(false)} config={mfaFlow.config} onUpdateConfig={mfaFlow.updateConfig} onGenerateCode={mfaFlow.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showSessionMgr} name="Session Manager">
        <SessionManagerPanel open={props.showSessionMgr} onClose={() => props.setShowSessionMgr(false)} config={sessionMgr.config} onUpdateConfig={sessionMgr.updateConfig} onGenerateCode={sessionMgr.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAPIKeyMgmt} name="API Key Management">
        <APIKeyPanel open={props.showAPIKeyMgmt} onClose={() => props.setShowAPIKeyMgmt(false)} keys={apiKeyMgmt.keys} onAdd={apiKeyMgmt.addKey} onRevoke={apiKeyMgmt.revokeKey} onGenerateCode={apiKeyMgmt.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showPermMatrix} name="Permission Matrix">
        <PermissionMatrixPanel open={props.showPermMatrix} onClose={() => props.setShowPermMatrix(false)} roles={permMatrix.roles} permissions={permMatrix.permissions} matrix={permMatrix.matrix} onToggle={permMatrix.togglePermission} onAddRole={permMatrix.addRole} onAddPermission={permMatrix.addPermission} onGenerateCode={permMatrix.generateCode} onInsertCode={insertCode} />
      </SafePanel>
    </>
  );
}

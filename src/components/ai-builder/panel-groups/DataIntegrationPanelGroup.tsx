// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useGraphQLBuilder } from '@/hooks/useGraphQLBuilder';
import { useWebSocketManager } from '@/hooks/useWebSocketManager';
import { useFileUploadManager } from '@/hooks/useFileUploadManager';
import { usePaymentIntegration } from '@/hooks/usePaymentIntegration';
import { useEmailTemplateBuilder } from '@/hooks/useEmailTemplateBuilder';
import { GraphQLBuilderPanel, WebSocketPanel, FileUploadPanel, PaymentPanel, EmailTemplatePanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showGraphQL: boolean; setShowGraphQL: (v: boolean) => void;
  showWSManager: boolean; setShowWSManager: (v: boolean) => void;
  showFileUpload: boolean; setShowFileUpload: (v: boolean) => void;
  showPayments: boolean; setShowPayments: (v: boolean) => void;
  showEmailTemplates: boolean; setShowEmailTemplates: (v: boolean) => void;
}

export function DataIntegrationPanelGroup(props: Props) {
  const graphqlBuilder = useGraphQLBuilder();
  const wsManager = useWebSocketManager();
  const fileUploadMgr = useFileUploadManager();
  const paymentIntegration = usePaymentIntegration();
  const emailTemplates = useEmailTemplateBuilder();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showGraphQL} name="GraphQL Builder">
        <GraphQLBuilderPanel open={props.showGraphQL} onClose={() => props.setShowGraphQL(false)} schema={graphqlBuilder.schema} resolvers={graphqlBuilder.resolvers} onUpdateSchema={graphqlBuilder.updateSchema} onAddResolver={graphqlBuilder.addResolver} onRemoveResolver={graphqlBuilder.removeResolver} onGenerateCode={graphqlBuilder.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showWSManager} name="WebSocket Manager">
        <WebSocketPanel open={props.showWSManager} onClose={() => props.setShowWSManager(false)} connections={wsManager.connections} onAdd={wsManager.addConnection} onRemove={wsManager.removeConnection} onGenerateCode={wsManager.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showFileUpload} name="File Upload">
        <FileUploadPanel open={props.showFileUpload} onClose={() => props.setShowFileUpload(false)} config={fileUploadMgr.config} onUpdateConfig={fileUploadMgr.updateConfig} onGenerateCode={fileUploadMgr.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showPayments} name="Payment Integration">
        <PaymentPanel open={props.showPayments} onClose={() => props.setShowPayments(false)} config={paymentIntegration.config} onUpdateConfig={paymentIntegration.updateConfig} onGenerateCode={paymentIntegration.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showEmailTemplates} name="Email Templates">
        <EmailTemplatePanel open={props.showEmailTemplates} onClose={() => props.setShowEmailTemplates(false)} templates={emailTemplates.templates} onAdd={emailTemplates.addTemplate} onRemove={emailTemplates.removeTemplate} onGenerateCode={(id: string) => { const code = emailTemplates.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
    </>
  );
}

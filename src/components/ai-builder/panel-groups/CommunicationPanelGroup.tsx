// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useToastDesigner } from '@/hooks/useToastDesigner';
import { useNotificationCenterGenerator } from '@/hooks/useNotificationCenterGenerator';
import { useChatWidgetBuilder } from '@/hooks/useChatWidgetBuilder';
import { useEmailSequenceBuilder } from '@/hooks/useEmailSequenceBuilder';
import { useSMSTemplateManager } from '@/hooks/useSMSTemplateManager';
import { ToastDesignerPanel, NotificationCenterPanel, ChatWidgetPanel, EmailSequencePanel, SMSTemplatePanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showToastDesigner: boolean; setShowToastDesigner: (v: boolean) => void;
  showNotifCenter: boolean; setShowNotifCenter: (v: boolean) => void;
  showChatWidget: boolean; setShowChatWidget: (v: boolean) => void;
  showEmailSequence: boolean; setShowEmailSequence: (v: boolean) => void;
  showSMSTemplate: boolean; setShowSMSTemplate: (v: boolean) => void;
}

export function CommunicationPanelGroup(props: Props) {
  const toastDesigner = useToastDesigner();
  const notifCenter = useNotificationCenterGenerator();
  const chatWidget = useChatWidgetBuilder();
  const emailSequence = useEmailSequenceBuilder();
  const smsTemplate = useSMSTemplateManager();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showToastDesigner} name="Toast Designer">
        <ToastDesignerPanel open={props.showToastDesigner} onClose={() => props.setShowToastDesigner(false)} toasts={toastDesigner.toasts} onAdd={toastDesigner.addToast} onRemove={toastDesigner.removeToast} onGenerateCode={toastDesigner.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showNotifCenter} name="Notification Center">
        <NotificationCenterPanel open={props.showNotifCenter} onClose={() => props.setShowNotifCenter(false)} config={notifCenter.config} onUpdateConfig={notifCenter.updateConfig} onGenerateCode={notifCenter.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showChatWidget} name="Chat Widget">
        <ChatWidgetPanel open={props.showChatWidget} onClose={() => props.setShowChatWidget(false)} config={chatWidget.config} onUpdateConfig={chatWidget.updateConfig} onGenerateCode={chatWidget.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showEmailSequence} name="Email Sequence">
        <EmailSequencePanel open={props.showEmailSequence} onClose={() => props.setShowEmailSequence(false)} sequences={emailSequence.sequences} onAdd={emailSequence.addSequence} onRemove={emailSequence.removeSequence} onGenerateCode={(id: string) => { const code = emailSequence.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showSMSTemplate} name="SMS Templates">
        <SMSTemplatePanel open={props.showSMSTemplate} onClose={() => props.setShowSMSTemplate(false)} templates={smsTemplate.templates} onAdd={smsTemplate.addTemplate} onRemove={smsTemplate.removeTemplate} onGenerateCode={(id: string) => { const code = smsTemplate.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
    </>
  );
}

// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useRealTimeCoEditing } from '@/hooks/useRealTimeCoEditing';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useCodeReactions } from '@/hooks/useCodeReactions';
import { useCollaborativeWhiteboard } from '@/hooks/useCollaborativeWhiteboard';
import { CoEditingPanel, VoiceChatPanel, ScreenSharePanel, CodeReactionsPanel, WhiteboardPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';

interface Props extends PanelGroupSharedProps {
  showCoEditing: boolean; setShowCoEditing: (v: boolean) => void;
  showVoiceChat: boolean; setShowVoiceChat: (v: boolean) => void;
  showScreenShare: boolean; setShowScreenShare: (v: boolean) => void;
  showCodeReactions: boolean; setShowCodeReactions: (v: boolean) => void;
  showWhiteboard: boolean; setShowWhiteboard: (v: boolean) => void;
}

export function CollabPanelGroup(props: Props) {
  const coEditing = useRealTimeCoEditing();
  const voiceChat = useVoiceChat();
  const screenShare = useScreenShare();
  const codeReactions = useCodeReactions();
  const whiteboard = useCollaborativeWhiteboard();

  return (
    <>
      <SafePanel show={props.showCoEditing} name="Co-Editing">
        <CoEditingPanel open={props.showCoEditing} onClose={() => props.setShowCoEditing(false)} isActive={coEditing.isActive} participants={coEditing.participants} onStart={coEditing.startSession} onStop={coEditing.stopSession} />
      </SafePanel>
      <SafePanel show={props.showVoiceChat} name="Voice Chat">
        <VoiceChatPanel open={props.showVoiceChat} onClose={() => props.setShowVoiceChat(false)} isConnected={voiceChat.isConnected} isMuted={voiceChat.isMuted} participants={voiceChat.participants} onConnect={voiceChat.connect} onDisconnect={voiceChat.disconnect} onToggleMute={voiceChat.toggleMute} />
      </SafePanel>
      <SafePanel show={props.showScreenShare} name="Screen Share">
        <ScreenSharePanel open={props.showScreenShare} onClose={() => props.setShowScreenShare(false)} isSharing={screenShare.isSharing} onStartSharing={screenShare.startSharing} onStopSharing={screenShare.stopSharing} />
      </SafePanel>
      <SafePanel show={props.showCodeReactions} name="Code Reactions">
        <CodeReactionsPanel open={props.showCodeReactions} onClose={() => props.setShowCodeReactions(false)} reactions={codeReactions.reactions} onAdd={codeReactions.addReaction} onRemove={codeReactions.removeReaction} />
      </SafePanel>
      <SafePanel show={props.showWhiteboard} name="Whiteboard">
        <WhiteboardPanel open={props.showWhiteboard} onClose={() => props.setShowWhiteboard(false)} elements={whiteboard.elements} onAddElement={whiteboard.addElement} onRemoveElement={whiteboard.removeElement} onClear={whiteboard.clear} />
      </SafePanel>
    </>
  );
}

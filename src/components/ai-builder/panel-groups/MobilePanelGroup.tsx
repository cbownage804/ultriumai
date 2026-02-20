// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useCapacitorExport } from '@/hooks/useCapacitorExport';
import { usePushNotificationDesigner } from '@/hooks/usePushNotificationDesigner';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';
import { useGestureBuilder } from '@/hooks/useGestureBuilder';
import { useAppStoreAssets } from '@/hooks/useAppStoreAssets';
import {
  CapacitorExportPanel, PushNotificationPanel, OfflineFirstPanel,
  GestureBuilderPanel, AppStoreAssetsPanel,
} from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showCapacitor: boolean; setShowCapacitor: (v: boolean) => void;
  showPushNotifications: boolean; setShowPushNotifications: (v: boolean) => void;
  showOfflineFirst: boolean; setShowOfflineFirst: (v: boolean) => void;
  showGestureBuilder: boolean; setShowGestureBuilder: (v: boolean) => void;
  showAppStoreAssets: boolean; setShowAppStoreAssets: (v: boolean) => void;
}

export function MobilePanelGroup(props: Props) {
  const capacitorExport = useCapacitorExport();
  const pushNotifications = usePushNotificationDesigner();
  const offlineFirst = useOfflineFirst();
  const gestureBuilder = useGestureBuilder();
  const appStoreAssets = useAppStoreAssets();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showCapacitor} name="Capacitor Export">
        <CapacitorExportPanel open={props.showCapacitor} onClose={() => props.setShowCapacitor(false)} config={capacitorExport.config} onUpdateConfig={capacitorExport.updateConfig} platforms={capacitorExport.platforms} onTogglePlatform={capacitorExport.togglePlatform} onExport={() => capacitorExport.exportProject(props.project.files)} onInsertCode={insertCode} generatedFiles={capacitorExport.generatedFiles} />
      </SafePanel>
      <SafePanel show={props.showPushNotifications} name="Push Notifications">
        <PushNotificationPanel open={props.showPushNotifications} onClose={() => props.setShowPushNotifications(false)} notifications={pushNotifications.notifications} segments={pushNotifications.segments} onAdd={pushNotifications.addNotification} onUpdate={pushNotifications.updateNotification} onRemove={pushNotifications.removeNotification} onAddSegment={pushNotifications.addSegment} onGenerateCode={pushNotifications.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showOfflineFirst} name="Offline First">
        <OfflineFirstPanel open={props.showOfflineFirst} onClose={() => props.setShowOfflineFirst(false)} config={offlineFirst.config} onUpdateConfig={offlineFirst.updateConfig} onGenerateServiceWorker={() => offlineFirst.generateServiceWorker()} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showGestureBuilder} name="Gesture Builder">
        <GestureBuilderPanel open={props.showGestureBuilder} onClose={() => props.setShowGestureBuilder(false)} gestures={gestureBuilder.gestures} onAdd={gestureBuilder.addGesture} onRemove={gestureBuilder.removeGesture} onGenerateCode={gestureBuilder.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAppStoreAssets} name="App Store Assets">
        <AppStoreAssetsPanel open={props.showAppStoreAssets} onClose={() => props.setShowAppStoreAssets(false)} assets={appStoreAssets.assets} onGenerate={appStoreAssets.generateAssets} onUpdateField={appStoreAssets.updateField} />
      </SafePanel>
    </>
  );
}

// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useStateMachineDesigner } from '@/hooks/useStateMachineDesigner';
import { useDataValidationStudio } from '@/hooks/useDataValidationStudio';
import { useCacheStrategyManager } from '@/hooks/useCacheStrategyManager';
import { useReactiveStoreBuilder } from '@/hooks/useReactiveStoreBuilder';
import { useDataMigrationWizard } from '@/hooks/useDataMigrationWizard';
import { StateMachinePanel, DataValidationPanel, CacheStrategyPanel, ReactiveStorePanel, DataMigrationPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showStateMachine: boolean; setShowStateMachine: (v: boolean) => void;
  showDataValidation: boolean; setShowDataValidation: (v: boolean) => void;
  showCacheStrategy: boolean; setShowCacheStrategy: (v: boolean) => void;
  showReactiveStore: boolean; setShowReactiveStore: (v: boolean) => void;
  showDataMigration: boolean; setShowDataMigration: (v: boolean) => void;
}

export function DataStatePanelGroup(props: Props) {
  const stateMachine = useStateMachineDesigner();
  const dataValidation = useDataValidationStudio();
  const cacheStrategy = useCacheStrategyManager();
  const reactiveStore = useReactiveStoreBuilder();
  const dataMigration = useDataMigrationWizard();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showStateMachine} name="State Machine">
        <StateMachinePanel open={props.showStateMachine} onClose={() => props.setShowStateMachine(false)} machines={stateMachine.machines} onAdd={stateMachine.addMachine} onRemove={stateMachine.removeMachine} onGenerateCode={(id: string) => { const code = stateMachine.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showDataValidation} name="Data Validation">
        <DataValidationPanel open={props.showDataValidation} onClose={() => props.setShowDataValidation(false)} schemas={dataValidation.schemas} onAdd={dataValidation.addSchema} onRemove={dataValidation.removeSchema} onGenerateCode={(id: string) => { const code = dataValidation.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showCacheStrategy} name="Cache Strategy">
        <CacheStrategyPanel open={props.showCacheStrategy} onClose={() => props.setShowCacheStrategy(false)} strategies={cacheStrategy.strategies} onAdd={cacheStrategy.addStrategy} onRemove={cacheStrategy.removeStrategy} onGenerateCode={(id: string) => { const code = cacheStrategy.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showReactiveStore} name="Reactive Store">
        <ReactiveStorePanel open={props.showReactiveStore} onClose={() => props.setShowReactiveStore(false)} stores={reactiveStore.stores} onAdd={reactiveStore.addStore} onRemove={reactiveStore.removeStore} onGenerateCode={(id: string) => { const code = reactiveStore.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showDataMigration} name="Data Migration">
        <DataMigrationPanel open={props.showDataMigration} onClose={() => props.setShowDataMigration(false)} migrations={dataMigration.migrations} onAdd={dataMigration.addMigration} onRemove={dataMigration.removeMigration} onGenerate={(id: string) => { const sql = dataMigration.generateSQL(id); if (sql) insertCode(sql); }} />
      </SafePanel>
    </>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Copy, ArrowUpDown, Table2 } from 'lucide-react';
import type { Migration, MigrationAction } from '@/hooks/useDataMigrationWizard';

interface Props {
  migrations: Migration[];
  activeMigrationId: string | null;
  onSetActiveMigrationId: (id: string | null) => void;
  onCreateMigration: (name: string) => void;
  onDeleteMigration: (id: string) => void;
  onAddAction: (migrationId: string, action: Omit<MigrationAction, 'id'>) => void;
  onRemoveAction: (migrationId: string, actionId: string) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

const ACTION_TYPES: { value: MigrationAction['type']; label: string }[] = [
  { value: 'create_table', label: 'Create Table' },
  { value: 'add_column', label: 'Add Column' },
  { value: 'drop_column', label: 'Drop Column' },
  { value: 'rename_column', label: 'Rename Column' },
  { value: 'add_index', label: 'Add Index' },
  { value: 'add_rls', label: 'Enable RLS' },
  { value: 'drop_table', label: 'Drop Table' },
  { value: 'custom', label: 'Custom SQL' },
];

export function DataMigrationPanel({ migrations, activeMigrationId, onSetActiveMigrationId, onCreateMigration, onDeleteMigration, onAddAction, onRemoveAction, onGenerateCode, onInsertCode, onClose }: Props) {
  const [newName, setNewName] = useState('');
  const [actionType, setActionType] = useState<MigrationAction['type']>('create_table');
  const [tableName, setTableName] = useState('');
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState('text');
  const [customSQL, setCustomSQL] = useState('');
  const [preview, setPreview] = useState('');

  const active = migrations.find(m => m.id === activeMigrationId);

  const handleAddAction = () => {
    if (!activeMigrationId || !tableName.trim()) return;
    const action: Omit<MigrationAction, 'id'> = { type: actionType, tableName: tableName.trim() };
    if (actionType === 'create_table') {
      action.columns = [
        { name: 'id', type: 'UUID NOT NULL DEFAULT gen_random_uuid()', nullable: false, isPrimaryKey: true, isUnique: false },
        { name: 'created_at', type: 'TIMESTAMPTZ NOT NULL DEFAULT now()', nullable: false, isPrimaryKey: false, isUnique: false },
      ];
      action.enableRLS = true;
    }
    if (['add_column', 'drop_column', 'rename_column'].includes(actionType)) {
      action.columnName = columnName;
      action.columnType = columnType;
    }
    if (actionType === 'add_index') action.indexColumns = [columnName];
    if (actionType === 'custom') action.customSQL = customSQL;
    onAddAction(activeMigrationId, action);
    setTableName('');
    setColumnName('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Data Migration Wizard</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Migration list */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Migrations</label>
            {migrations.map(m => (
              <div key={m.id} onClick={() => onSetActiveMigrationId(m.id)} className={`flex items-center gap-2 p-2 rounded cursor-pointer mb-1 ${m.id === activeMigrationId ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.05]'}`}>
                <Table2 className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-white font-mono flex-1 truncate">{m.name}</span>
                <Badge variant="outline" className="text-[9px] h-4">{m.actions.length} actions</Badge>
                <button onClick={e => { e.stopPropagation(); onDeleteMigration(m.id); }} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <div className="flex gap-1 mt-1">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="migration_name" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1 font-mono" />
              <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => { if (newName.trim()) { onCreateMigration(newName.trim()); setNewName(''); } }}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {/* Actions in active migration */}
          {active && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Actions — {active.name}</label>
              {active.actions.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.03] text-xs mb-1 group">
                  <Badge variant="outline" className="text-[9px] h-4 border-blue-500/30 text-blue-400">{a.type.replace('_', ' ')}</Badge>
                  <span className="text-white font-mono flex-1">{a.tableName}</span>
                  {a.columnName && <span className="text-white/30">.{a.columnName}</span>}
                  <button onClick={() => onRemoveAction(active.id, a.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}

              <div className="mt-2 p-2 rounded border border-dashed border-white/10 space-y-1">
                <select value={actionType} onChange={e => setActionType(e.target.value as any)} className="h-7 w-full text-xs bg-white/5 border border-white/10 text-white rounded px-1">
                  {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <Input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="table_name" className="h-7 text-xs bg-white/5 border-white/10 text-white font-mono" />
                {['add_column', 'drop_column', 'rename_column', 'add_index'].includes(actionType) && (
                  <div className="flex gap-1">
                    <Input value={columnName} onChange={e => setColumnName(e.target.value)} placeholder="column" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
                    <Input value={columnType} onChange={e => setColumnType(e.target.value)} placeholder="type" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
                  </div>
                )}
                {actionType === 'custom' && (
                  <textarea value={customSQL} onChange={e => setCustomSQL(e.target.value)} placeholder="SQL..." className="w-full h-16 text-xs bg-white/5 border border-white/10 text-white rounded p-1.5 font-mono resize-none" />
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 w-full" onClick={handleAddAction}><Plus className="h-3 w-3 mr-1" />Add Action</Button>
              </div>
            </div>
          )}

          {preview && <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(onGenerateCode())}>Preview SQL</Button>
        <Button size="sm" className="flex-1 text-xs bg-blue-600 hover:bg-blue-500" onClick={() => onInsertCode(onGenerateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}

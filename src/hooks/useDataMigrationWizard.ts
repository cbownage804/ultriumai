import { useState, useCallback } from 'react';

export interface MigrationColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  references?: { table: string; column: string };
}

export interface MigrationAction {
  id: string;
  type: 'create_table' | 'add_column' | 'drop_column' | 'rename_column' | 'alter_column' | 'add_index' | 'drop_table' | 'add_rls' | 'custom';
  tableName: string;
  columns?: MigrationColumn[];
  columnName?: string;
  newColumnName?: string;
  columnType?: string;
  indexColumns?: string[];
  indexUnique?: boolean;
  customSQL?: string;
  enableRLS?: boolean;
}

export interface Migration {
  id: string;
  name: string;
  timestamp: string;
  actions: MigrationAction[];
  status: 'draft' | 'previewed' | 'applied';
}

export function useDataMigrationWizard() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [activeMigrationId, setActiveMigrationId] = useState<string | null>(null);

  const getActiveMigration = useCallback(() => migrations.find(m => m.id === activeMigrationId) || null, [migrations, activeMigrationId]);

  const createMigration = useCallback((name: string) => {
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const migration: Migration = { id: crypto.randomUUID(), name: `${ts}_${name}`, timestamp: new Date().toISOString(), actions: [], status: 'draft' };
    setMigrations(prev => [...prev, migration]);
    setActiveMigrationId(migration.id);
  }, []);

  const deleteMigration = useCallback((id: string) => {
    setMigrations(prev => prev.filter(m => m.id !== id));
    if (activeMigrationId === id) setActiveMigrationId(null);
  }, [activeMigrationId]);

  const addAction = useCallback((migrationId: string, action: Omit<MigrationAction, 'id'>) => {
    setMigrations(prev => prev.map(m => m.id === migrationId ? { ...m, actions: [...m.actions, { ...action, id: crypto.randomUUID() }] } : m));
  }, []);

  const removeAction = useCallback((migrationId: string, actionId: string) => {
    setMigrations(prev => prev.map(m => m.id === migrationId ? { ...m, actions: m.actions.filter(a => a.id !== actionId) } : m));
  }, []);

  const generateUpSQL = useCallback((migration: Migration): string => {
    const lines: string[] = [`-- Migration: ${migration.name}`, `-- Created: ${migration.timestamp}`, ''];

    for (const action of migration.actions) {
      switch (action.type) {
        case 'create_table': {
          const cols = (action.columns || []).map(c => {
            let def = `  ${c.name} ${c.type}`;
            if (c.isPrimaryKey) def += ' PRIMARY KEY';
            if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL';
            if (c.isUnique) def += ' UNIQUE';
            if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`;
            if (c.references) def += ` REFERENCES ${c.references.table}(${c.references.column})`;
            return def;
          });
          lines.push(`CREATE TABLE IF NOT EXISTS public.${action.tableName} (`);
          lines.push(cols.join(',\n'));
          lines.push(');');
          if (action.enableRLS) {
            lines.push('', `ALTER TABLE public.${action.tableName} ENABLE ROW LEVEL SECURITY;`);
          }
          break;
        }
        case 'add_column':
          lines.push(`ALTER TABLE public.${action.tableName} ADD COLUMN ${action.columnName} ${action.columnType}${action.columns?.[0]?.nullable === false ? ' NOT NULL' : ''}${action.columns?.[0]?.defaultValue ? ` DEFAULT ${action.columns[0].defaultValue}` : ''};`);
          break;
        case 'drop_column':
          lines.push(`ALTER TABLE public.${action.tableName} DROP COLUMN IF EXISTS ${action.columnName};`);
          break;
        case 'rename_column':
          lines.push(`ALTER TABLE public.${action.tableName} RENAME COLUMN ${action.columnName} TO ${action.newColumnName};`);
          break;
        case 'alter_column':
          lines.push(`ALTER TABLE public.${action.tableName} ALTER COLUMN ${action.columnName} TYPE ${action.columnType};`);
          break;
        case 'add_index':
          lines.push(`CREATE ${action.indexUnique ? 'UNIQUE ' : ''}INDEX idx_${action.tableName}_${(action.indexColumns || []).join('_')} ON public.${action.tableName} (${(action.indexColumns || []).join(', ')});`);
          break;
        case 'drop_table':
          lines.push(`DROP TABLE IF EXISTS public.${action.tableName} CASCADE;`);
          break;
        case 'add_rls':
          lines.push(`ALTER TABLE public.${action.tableName} ENABLE ROW LEVEL SECURITY;`);
          lines.push(`CREATE POLICY "Users manage own rows" ON public.${action.tableName} FOR ALL USING (auth.uid() = user_id);`);
          break;
        case 'custom':
          lines.push(action.customSQL || '-- custom SQL');
          break;
      }
      lines.push('');
    }

    return lines.join('\n');
  }, []);

  const generateDownSQL = useCallback((migration: Migration): string => {
    const lines: string[] = [`-- Rollback: ${migration.name}`, ''];

    for (const action of [...migration.actions].reverse()) {
      switch (action.type) {
        case 'create_table':
          lines.push(`DROP TABLE IF EXISTS public.${action.tableName} CASCADE;`);
          break;
        case 'add_column':
          lines.push(`ALTER TABLE public.${action.tableName} DROP COLUMN IF EXISTS ${action.columnName};`);
          break;
        case 'drop_column':
          lines.push(`-- Cannot reverse DROP COLUMN — manual restore needed for: ${action.tableName}.${action.columnName}`);
          break;
        case 'rename_column':
          lines.push(`ALTER TABLE public.${action.tableName} RENAME COLUMN ${action.newColumnName} TO ${action.columnName};`);
          break;
        case 'drop_table':
          lines.push(`-- Cannot reverse DROP TABLE — manual restore needed for: ${action.tableName}`);
          break;
        case 'add_index':
          lines.push(`DROP INDEX IF EXISTS idx_${action.tableName}_${(action.indexColumns || []).join('_')};`);
          break;
        case 'add_rls':
          lines.push(`DROP POLICY IF EXISTS "Users manage own rows" ON public.${action.tableName};`);
          break;
        default:
          lines.push(`-- Reverse not auto-generated for action type: ${action.type}`);
      }
    }

    return lines.join('\n');
  }, []);

  const generateCode = useCallback((): string => {
    const migration = getActiveMigration();
    if (!migration) return '-- No migration selected';
    const up = generateUpSQL(migration);
    const down = generateDownSQL(migration);
    return `-- ═══════════════════════════════════════\n-- UP Migration\n-- ═══════════════════════════════════════\n\n${up}\n\n-- ═══════════════════════════════════════\n-- DOWN (Rollback)\n-- ═══════════════════════════════════════\n\n${down}`;
  }, [getActiveMigration, generateUpSQL, generateDownSQL]);

  return {
    migrations, activeMigrationId, setActiveMigrationId,
    getActiveMigration, createMigration, deleteMigration,
    addAction, removeAction,
    generateUpSQL, generateDownSQL, generateCode,
  };
}

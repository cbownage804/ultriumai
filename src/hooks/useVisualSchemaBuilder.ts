import { useState, useCallback } from 'react';

export interface SchemaColumn {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  defaultValue?: string;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface SchemaTable {
  id: string;
  name: string;
  columns: SchemaColumn[];
  position: { x: number; y: number };
}

export interface SchemaRelation {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

const COLUMN_TYPES = ['uuid', 'text', 'varchar', 'integer', 'bigint', 'boolean', 'timestamp', 'timestamptz', 'date', 'jsonb', 'numeric', 'serial'];

export function useVisualSchemaBuilder() {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [relations, setRelations] = useState<SchemaRelation[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);

  const addTable = useCallback((name: string, x = 100, y = 100) => {
    const table: SchemaTable = {
      id: crypto.randomUUID(),
      name,
      columns: [
        { id: crypto.randomUUID(), name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, defaultValue: 'gen_random_uuid()' },
        { id: crypto.randomUUID(), name: 'created_at', type: 'timestamptz', isPrimaryKey: false, isForeignKey: false, isNullable: false, defaultValue: 'now()' },
      ],
      position: { x, y },
    };
    setTables(prev => [...prev, table]);
    setSelectedTable(table.id);
    return table;
  }, []);

  const removeTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setRelations(prev => prev.filter(r => r.sourceTableId !== id && r.targetTableId !== id));
    if (selectedTable === id) setSelectedTable(null);
  }, [selectedTable]);

  const updateTablePosition = useCallback((id: string, position: { x: number; y: number }) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, position } : t));
  }, []);

  const addColumn = useCallback((tableId: string, name: string, type: string) => {
    const col: SchemaColumn = { id: crypto.randomUUID(), name, type, isPrimaryKey: false, isForeignKey: false, isNullable: true };
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, columns: [...t.columns, col] } : t));
  }, []);

  const removeColumn = useCallback((tableId: string, columnId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, columns: t.columns.filter(c => c.id !== columnId) } : t));
    setRelations(prev => prev.filter(r => r.sourceColumnId !== columnId && r.targetColumnId !== columnId));
  }, []);

  const updateColumn = useCallback((tableId: string, columnId: string, updates: Partial<SchemaColumn>) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, columns: t.columns.map(c => c.id === columnId ? { ...c, ...updates } : c) } : t
    ));
  }, []);

  const addRelation = useCallback((sourceTableId: string, sourceColumnId: string, targetTableId: string, targetColumnId: string, type: SchemaRelation['type'] = 'one-to-many') => {
    const rel: SchemaRelation = { id: crypto.randomUUID(), sourceTableId, sourceColumnId, targetTableId, targetColumnId, type };
    setRelations(prev => [...prev, rel]);
    // Mark source column as FK
    setTables(prev => prev.map(t =>
      t.id === sourceTableId ? { ...t, columns: t.columns.map(c => c.id === sourceColumnId ? { ...c, isForeignKey: true, referencesTable: tables.find(tt => tt.id === targetTableId)?.name, referencesColumn: tables.find(tt => tt.id === targetTableId)?.columns.find(cc => cc.id === targetColumnId)?.name } : c) } : t
    ));
  }, [tables]);

  const removeRelation = useCallback((id: string) => {
    setRelations(prev => prev.filter(r => r.id !== id));
  }, []);

  const exportAsSQL = useCallback((): string => {
    const lines: string[] = [];
    for (const table of tables) {
      const colDefs = table.columns.map(c => {
        let def = `  ${c.name} ${c.type.toUpperCase()}`;
        if (!c.isNullable) def += ' NOT NULL';
        if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`;
        if (c.isPrimaryKey) def += ' PRIMARY KEY';
        return def;
      });
      // FK constraints
      const fkCols = table.columns.filter(c => c.isForeignKey && c.referencesTable);
      const fkDefs = fkCols.map(c => `  FOREIGN KEY (${c.name}) REFERENCES ${c.referencesTable}(${c.referencesColumn || 'id'})`);

      lines.push(`CREATE TABLE public.${table.name} (\n${[...colDefs, ...fkDefs].join(',\n')}\n);`);
      lines.push(`ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;`);
      lines.push('');
    }
    return lines.join('\n');
  }, [tables]);

  const importFromSQL = useCallback((sql: string) => {
    const tableRegex = /CREATE TABLE (?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
    let match;
    let x = 50;
    while ((match = tableRegex.exec(sql)) !== null) {
      const name = match[1];
      const existing = tables.find(t => t.name === name);
      if (existing) continue;
      addTable(name, x, 100);
      x += 300;
    }
  }, [tables, addTable]);

  return {
    tables, relations, selectedTable, setSelectedTable, selectedRelation, setSelectedRelation,
    addTable, removeTable, updateTablePosition, addColumn, removeColumn, updateColumn,
    addRelation, removeRelation, exportAsSQL, importFromSQL,
    columnTypes: COLUMN_TYPES,
  };
}

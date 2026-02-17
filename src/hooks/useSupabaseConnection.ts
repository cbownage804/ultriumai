import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
  projectName?: string;
}

export interface TableSchema {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount?: number;
  rlsEnabled?: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
  foreignColumn?: string;
}

export interface QueryResult {
  data: any[] | null;
  error: string | null;
  rowCount: number;
  executionTimeMs: number;
  columns: string[];
}

export interface ConnectionStatus {
  connected: boolean;
  testing: boolean;
  error: string | null;
  latencyMs?: number;
}

const STORAGE_KEY = 'app-builder-supabase-connections';

export function useSupabaseConnection() {
  const [config, setConfig] = useState<SupabaseConnectionConfig | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, testing: false, error: null });
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const clientRef = useRef<SupabaseClient | null>(null);

  // Load saved connection
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SupabaseConnectionConfig;
        if (parsed.url && parsed.anonKey) {
          setConfig(parsed);
        }
      }
    } catch {}
  }, []);

  // Create client when config changes
  useEffect(() => {
    if (!config?.url || !config?.anonKey) {
      clientRef.current = null;
      setStatus({ connected: false, testing: false, error: null });
      setTables([]);
      return;
    }

    try {
      clientRef.current = createClient(config.url, config.anonKey);
      testConnection();
    } catch (e: any) {
      setStatus({ connected: false, testing: false, error: e.message });
    }
  }, [config]);

  const testConnection = useCallback(async () => {
    if (!clientRef.current) return false;

    setStatus(prev => ({ ...prev, testing: true, error: null }));
    const start = performance.now();

    try {
      // Simple query to test connection
      const { error } = await clientRef.current.from('_supabase_test_ping').select('*').limit(1);
      const latency = Math.round(performance.now() - start);

      // Error is expected (table doesn't exist), but connection works if it's a 42P01 (relation not found)
      if (error && !error.message.includes('does not exist') && !error.message.includes('relation') && !error.code?.startsWith('42')) {
        // Check if it's an auth error or network error
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed')) {
          setStatus({ connected: false, testing: false, error: 'Cannot reach Supabase. Check your URL.' });
          return false;
        }
      }

      setStatus({ connected: true, testing: false, error: null, latencyMs: latency });
      return true;
    } catch (e: any) {
      setStatus({ connected: false, testing: false, error: e.message || 'Connection failed' });
      return false;
    }
  }, []);

  const connect = useCallback(async (newConfig: SupabaseConnectionConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  const disconnect = useCallback(() => {
    setConfig(null);
    clientRef.current = null;
    setStatus({ connected: false, testing: false, error: null });
    setTables([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchSchema = useCallback(async () => {
    if (!clientRef.current || !status.connected) return;

    setIsLoadingSchema(true);
    try {
      // Use the REST API to introspect schema
      const { data, error } = await clientRef.current.rpc('', {}).select('*');
      
      // Fallback: query information_schema via a known table
      // Since we can't run raw SQL via the client, we'll use the OpenAPI schema
      const response = await fetch(`${config!.url}/rest/v1/`, {
        headers: {
          'apikey': config!.anonKey,
          'Authorization': `Bearer ${config!.anonKey}`,
        },
      });

      if (response.ok) {
        const openApiSpec = await response.json();
        const definitions = openApiSpec?.definitions || {};

        const tableList: TableSchema[] = Object.entries(definitions).map(([name, def]: [string, any]) => {
          const properties = def?.properties || {};
          const required = def?.required || [];

          const columns: ColumnInfo[] = Object.entries(properties).map(([colName, colDef]: [string, any]) => ({
            name: colName,
            type: colDef?.format || colDef?.type || 'unknown',
            isNullable: !required.includes(colName),
            defaultValue: colDef?.default ?? null,
            isPrimaryKey: colDef?.description?.includes('Primary') || colName === 'id',
            isForeignKey: !!colDef?.description?.includes('Foreign'),
            foreignTable: colDef?.description?.match(/fk table='(\w+)'/)?.[1],
            foreignColumn: colDef?.description?.match(/fk column='(\w+)'/)?.[1],
          }));

          return {
            name,
            schema: 'public',
            columns,
          };
        });

        setTables(tableList.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (e: any) {
      console.error('Schema fetch failed:', e);
    } finally {
      setIsLoadingSchema(false);
    }
  }, [config, status.connected]);

  const executeQuery = useCallback(async (tableName: string, options?: {
    select?: string;
    filters?: { column: string; operator: string; value: string }[];
    limit?: number;
    orderBy?: { column: string; ascending: boolean };
  }): Promise<QueryResult> => {
    if (!clientRef.current) {
      return { data: null, error: 'Not connected', rowCount: 0, executionTimeMs: 0, columns: [] };
    }

    const start = performance.now();
    try {
      let query = clientRef.current.from(tableName).select(options?.select || '*');

      if (options?.filters) {
        for (const filter of options.filters) {
          switch (filter.operator) {
            case 'eq': query = query.eq(filter.column, filter.value); break;
            case 'neq': query = query.neq(filter.column, filter.value); break;
            case 'gt': query = query.gt(filter.column, filter.value); break;
            case 'lt': query = query.lt(filter.column, filter.value); break;
            case 'gte': query = query.gte(filter.column, filter.value); break;
            case 'lte': query = query.lte(filter.column, filter.value); break;
            case 'like': query = query.like(filter.column, filter.value); break;
            case 'ilike': query = query.ilike(filter.column, filter.value); break;
            case 'is': query = query.is(filter.column, filter.value === 'null' ? null : filter.value); break;
          }
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
      }

      query = query.limit(options?.limit || 100);

      const { data, error } = await query;
      const executionTimeMs = Math.round(performance.now() - start);

      if (error) {
        return { data: null, error: error.message, rowCount: 0, executionTimeMs, columns: [] };
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      return { data, error: null, rowCount: data?.length || 0, executionTimeMs, columns };
    } catch (e: any) {
      return { data: null, error: e.message, rowCount: 0, executionTimeMs: Math.round(performance.now() - start), columns: [] };
    }
  }, []);

  const insertRow = useCallback(async (tableName: string, row: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
    if (!clientRef.current) return { success: false, error: 'Not connected' };
    
    const { error } = await clientRef.current.from(tableName).insert(row);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const updateRow = useCallback(async (tableName: string, id: string, updates: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
    if (!clientRef.current) return { success: false, error: 'Not connected' };
    
    const { error } = await clientRef.current.from(tableName).update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const deleteRow = useCallback(async (tableName: string, id: string): Promise<{ success: boolean; error?: string }> => {
    if (!clientRef.current) return { success: false, error: 'Not connected' };
    
    const { error } = await clientRef.current.from(tableName).delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const getClient = useCallback(() => clientRef.current, []);

  // Auto-fetch schema on connection
  useEffect(() => {
    if (status.connected && tables.length === 0) {
      fetchSchema();
    }
  }, [status.connected]);

  return {
    config,
    status,
    tables,
    isLoadingSchema,
    connect,
    disconnect,
    testConnection,
    fetchSchema,
    executeQuery,
    insertRow,
    updateRow,
    deleteRow,
    getClient,
  };
}

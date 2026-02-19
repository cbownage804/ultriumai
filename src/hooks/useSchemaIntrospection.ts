import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from './useProjectFileSystem';

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable: string | null;
  foreignColumn: string | null;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rlsEnabled: boolean;
  policies: string[];
  rowCount: number | null;
}

export interface SchemaResult {
  tables: TableInfo[];
  enums: { name: string; values: string[] }[];
  functions: { name: string; args: string; returnType: string }[];
  generatedAt: string;
  typeScript: string;
  schemaSummary: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for introspecting a connected Supabase project's database schema.
 * Fetches table/column definitions, generates TypeScript types, and builds
 * a compact schema summary for AI prompt injection.
 */
export function useSchemaIntrospection() {
  const [schema, setSchema] = useState<SchemaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: SchemaResult; fetchedAt: number } | null>(null);

  /**
   * Fetch the schema from the connected Supabase project.
   * Results are cached for 5 minutes to avoid repeated queries.
   */
  const fetchSchema = useCallback(async (
    supabaseUrl: string,
    supabaseServiceKey: string,
    forceRefresh = false,
  ): Promise<SchemaResult | null> => {
    // Return cached if fresh
    if (!forceRefresh && cacheRef.current && Date.now() - cacheRef.current.fetchedAt < CACHE_TTL_MS) {
      setSchema(cacheRef.current.data);
      return cacheRef.current.data;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-builder-schema', {
        body: { supabaseUrl, supabaseServiceKey },
      });

      if (fnError) throw fnError;
      if (!data || data.error) throw new Error(data?.error || 'Schema introspection failed');

      const result = data as SchemaResult;
      cacheRef.current = { data: result, fetchedAt: Date.now() };
      setSchema(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Schema fetch failed';
      setError(msg);
      console.warn('[SchemaIntrospection] Error:', msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generate a types.ts ProjectFile from the current schema.
   */
  const generateTypesFile = useCallback((): ProjectFile | null => {
    if (!schema?.typeScript) return null;
    return {
      path: 'types.ts',
      content: schema.typeScript,
      language: 'typescript',
    };
  }, [schema]);

  /**
   * Get the compact schema summary string for AI prompt injection.
   */
  const getSchemaSummary = useCallback((): string | null => {
    return schema?.schemaSummary || null;
  }, [schema]);

  /**
   * Invalidate the cache so next fetch is fresh.
   */
  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
    setSchema(null);
  }, []);

  return {
    schema,
    isLoading,
    error,
    fetchSchema,
    generateTypesFile,
    getSchemaSummary,
    invalidateCache,
  };
}

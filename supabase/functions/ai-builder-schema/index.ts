import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

interface SchemaResult {
  tables: TableInfo[];
  enums: { name: string; values: string[] }[];
  functions: { name: string; args: string; returnType: string }[];
  generatedAt: string;
  typeScript: string;
  schemaSummary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { supabaseUrl, supabaseServiceKey } = await req.json();

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "supabaseUrl and supabaseServiceKey are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch all public tables with columns
    const { data: columns, error: colErr } = await client.rpc('', {}).maybeSingle();
    
    // Use direct SQL via the REST API instead
    const tablesQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        fk.foreign_table_name,
        fk.foreign_column_name
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
      ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
      LEFT JOIN (
        SELECT 
          kcu.table_name, kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `;

    // Use the PostgREST RPC endpoint to run raw SQL
    const schemaResp = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Fallback: query information_schema directly via PostgREST
    const colResp = await fetch(
      `${supabaseUrl}/rest/v1/information_schema.columns?table_schema=eq.public&select=table_name,column_name,data_type,udt_name,is_nullable,column_default&order=table_name,ordinal_position`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    // Since information_schema isn't exposed via PostgREST by default,
    // we'll use the Supabase client to query it via a simpler approach
    const { data: tableData, error: tableErr } = await client
      .from('information_schema.columns' as any)
      .select('table_name,column_name,data_type,udt_name,is_nullable,column_default')
      .eq('table_schema', 'public')
      .order('table_name')
      .order('ordinal_position');

    // If direct query fails, try an alternative approach using pg_catalog
    let rawColumns: any[] = [];
    
    if (tableErr || !tableData) {
      // Fallback: Use the Management API or try pg_catalog via RPC
      // Query pg_catalog directly which is always accessible
      const pgResp = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      });
      
      // Try fetching tables list from Supabase Management API
      // Extract project ref from URL
      const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
      
      // Use the simpler approach: query each known table's structure
      // by doing a HEAD request to get column info from PostgREST
      const tablesResp = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      });

      if (tablesResp.ok) {
        const openApiSpec = await tablesResp.json();
        // PostgREST root returns an OpenAPI spec with all table definitions
        const definitions = openApiSpec.definitions || {};
        
        for (const [tableName, tableDef] of Object.entries(definitions)) {
          const props = (tableDef as any).properties || {};
          const required = (tableDef as any).required || [];
          
          for (const [colName, colDef] of Object.entries(props)) {
            const def = colDef as any;
            rawColumns.push({
              table_name: tableName,
              column_name: colName,
              data_type: def.format || def.type || 'unknown',
              udt_name: def.format || def.type || 'unknown',
              is_nullable: required.includes(colName) ? 'NO' : 'YES',
              column_default: def.default || null,
              description: def.description || null,
              is_primary_key: def.description?.includes('<pk/>') || false,
              is_foreign_key: def.description?.includes('<fk') || false,
              foreign_table: def.description?.match(/<fk table='([^']+)'/)?.[1] || null,
              foreign_column: def.description?.match(/<fk .+column='([^']+)'/)?.[1] || null,
            });
          }
        }
      }
    } else {
      rawColumns = tableData;
    }

    // Group columns by table
    const tableMap = new Map<string, ColumnInfo[]>();
    for (const col of rawColumns) {
      const tableName = col.table_name;
      if (!tableMap.has(tableName)) tableMap.set(tableName, []);
      
      tableMap.get(tableName)!.push({
        name: col.column_name,
        type: mapPgType(col.data_type || col.udt_name),
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default || null,
        isPrimaryKey: col.is_primary_key || false,
        isForeignKey: col.is_foreign_key || false,
        foreignTable: col.foreign_table || null,
        foreignColumn: col.foreign_column || null,
      });
    }

    // Build table info
    const tables: TableInfo[] = [];
    for (const [name, cols] of tableMap) {
      tables.push({
        name,
        columns: cols,
        rlsEnabled: true, // Assume RLS is enabled (we can't easily check via REST)
        policies: [],
        rowCount: null,
      });
    }

    // Generate TypeScript interfaces
    const typeScript = generateTypeScript(tables);
    
    // Generate schema summary for AI prompt injection
    const schemaSummary = generateSchemaSummary(tables);

    const result: SchemaResult = {
      tables,
      enums: [],
      functions: [],
      generatedAt: new Date().toISOString(),
      typeScript,
      schemaSummary,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Schema introspection error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Map PostgreSQL types to TypeScript types */
function mapPgType(pgType: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'string',
    text: 'string',
    varchar: 'string',
    'character varying': 'string',
    char: 'string',
    character: 'string',
    int2: 'number',
    int4: 'number',
    int8: 'number',
    integer: 'number',
    smallint: 'number',
    bigint: 'number',
    float4: 'number',
    float8: 'number',
    real: 'number',
    'double precision': 'number',
    numeric: 'number',
    decimal: 'number',
    bool: 'boolean',
    boolean: 'boolean',
    json: 'Record<string, any>',
    jsonb: 'Record<string, any>',
    timestamp: 'string',
    timestamptz: 'string',
    'timestamp with time zone': 'string',
    'timestamp without time zone': 'string',
    date: 'string',
    time: 'string',
    timetz: 'string',
    inet: 'string',
    cidr: 'string',
    macaddr: 'string',
    bytea: 'string',
    interval: 'string',
    'ARRAY': 'any[]',
    'USER-DEFINED': 'string',
  };
  return typeMap[pgType] || 'any';
}

/** Generate TypeScript interfaces from table schema */
function generateTypeScript(tables: TableInfo[]): string {
  const lines: string[] = [
    '// Auto-generated TypeScript types from database schema',
    '// Generated at: ' + new Date().toISOString(),
    '',
  ];

  for (const table of tables) {
    const interfaceName = toPascalCase(table.name);
    lines.push(`export interface ${interfaceName} {`);
    
    for (const col of table.columns) {
      const optional = col.nullable || col.defaultValue ? '?' : '';
      const tsType = col.type;
      lines.push(`  ${col.name}${optional}: ${tsType};`);
    }
    
    lines.push('}');
    lines.push('');
  }

  // Generate a typed Supabase helper
  lines.push('// Typed query helpers');
  lines.push('// Usage: const { data } = await supabase.from(\'table_name\').select(\'*\')');
  lines.push('');

  return lines.join('\n');
}

/** Generate a compact schema summary for AI prompt context */
function generateSchemaSummary(tables: TableInfo[]): string {
  const lines: string[] = ['[DATABASE SCHEMA]'];
  
  for (const table of tables) {
    const colDefs = table.columns.map(col => {
      let def = `${col.name}: ${col.type}`;
      if (col.isPrimaryKey) def += ' PK';
      if (col.isForeignKey && col.foreignTable) def += ` FK->${col.foreignTable}.${col.foreignColumn}`;
      if (!col.nullable && !col.isPrimaryKey) def += ' NOT NULL';
      return def;
    }).join(', ');
    
    lines.push(`Table: ${table.name} (${colDefs})`);
  }
  
  lines.push('[/DATABASE SCHEMA]');
  return lines.join('\n');
}

/** Convert snake_case to PascalCase */
function toPascalCase(str: string): string {
  return str
    .split(/[_-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

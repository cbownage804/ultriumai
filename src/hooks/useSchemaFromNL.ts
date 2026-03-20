import { useState, useCallback } from 'react';

/**
 * Wave 16: Natural Language → Supabase Schema Generator
 * Detects data model descriptions and generates SQL migrations,
 * TypeScript types, and RLS policies from plain English.
 */

export interface SchemaEntity {
  tableName: string;
  columns: SchemaColumn[];
  rlsEnabled: boolean;
  ownerColumn: string | null;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable: string | null;
  foreignColumn: string | null;
  isUnique: boolean;
}

export interface GeneratedSchema {
  entities: SchemaEntity[];
  migrationSQL: string;
  typescriptTypes: string;
  rlsPolicies: string;
  summary: string;
}

// ── NL patterns for common data model concepts ──
const ENTITY_PATTERNS = [
  /(?:i need|create|build|add|set up|make)\s+(?:a\s+)?(?:table|model|entity|schema)\s+(?:for|called|named)\s+["']?(\w+)["']?/gi,
  /(?:with|has|have)\s+(users?|posts?|comments?|products?|orders?|categories?|tags?|profiles?|messages?|notifications?|invoices?|tasks?|projects?|teams?|articles?|blogs?|reviews?|payments?|subscriptions?|events?|bookings?|tickets?)/gi,
  /(?:i need|create|build)\s+(?:a\s+)?(\w+)\s+(?:system|module|feature|app)/gi,
];

const TYPE_INFERENCE: Record<string, string> = {
  name: 'TEXT NOT NULL',
  title: 'TEXT NOT NULL',
  description: 'TEXT',
  content: 'TEXT',
  body: 'TEXT',
  email: 'TEXT NOT NULL',
  url: 'TEXT',
  image: 'TEXT',
  avatar: 'TEXT',
  logo: 'TEXT',
  price: 'DECIMAL(10,2)',
  amount: 'DECIMAL(10,2)',
  total: 'DECIMAL(10,2)',
  cost: 'DECIMAL(10,2)',
  quantity: 'INTEGER DEFAULT 0',
  count: 'INTEGER DEFAULT 0',
  views: 'INTEGER DEFAULT 0',
  likes: 'INTEGER DEFAULT 0',
  rating: 'DECIMAL(3,2)',
  score: 'INTEGER DEFAULT 0',
  status: "TEXT DEFAULT 'active'",
  type: 'TEXT',
  category: 'TEXT',
  priority: "TEXT DEFAULT 'medium'",
  is_active: 'BOOLEAN DEFAULT true',
  is_public: 'BOOLEAN DEFAULT false',
  is_published: 'BOOLEAN DEFAULT false',
  is_featured: 'BOOLEAN DEFAULT false',
  published: 'BOOLEAN DEFAULT false',
  featured: 'BOOLEAN DEFAULT false',
  date: 'DATE',
  start_date: 'TIMESTAMPTZ',
  end_date: 'TIMESTAMPTZ',
  due_date: 'TIMESTAMPTZ',
  phone: 'TEXT',
  address: 'TEXT',
  city: 'TEXT',
  country: 'TEXT',
  zip: 'TEXT',
  slug: 'TEXT UNIQUE',
  metadata: 'JSONB DEFAULT \'{}\'::jsonb',
  settings: 'JSONB DEFAULT \'{}\'::jsonb',
  tags: 'TEXT[]',
  color: 'TEXT',
  order: 'INTEGER DEFAULT 0',
  sort_order: 'INTEGER DEFAULT 0',
  position: 'INTEGER DEFAULT 0',
};

// ── Common domain models ──
const DOMAIN_TEMPLATES: Record<string, SchemaEntity> = {
  blog: {
    tableName: 'posts',
    rlsEnabled: true,
    ownerColumn: 'user_id',
    columns: [
      { name: 'id', type: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()', nullable: false, defaultValue: 'gen_random_uuid()', isPrimaryKey: true, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
      { name: 'user_id', type: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: true, foreignTable: 'auth.users', foreignColumn: 'id', isUnique: false },
      { name: 'title', type: 'TEXT NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'slug', type: 'TEXT UNIQUE', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
      { name: 'content', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'excerpt', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'featured_image', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'is_published', type: 'BOOLEAN DEFAULT false', nullable: false, defaultValue: 'false', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'published_at', type: 'TIMESTAMPTZ', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'tags', type: 'TEXT[]', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    ],
  },
  ecommerce: {
    tableName: 'products',
    rlsEnabled: true,
    ownerColumn: 'user_id',
    columns: [
      { name: 'id', type: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()', nullable: false, defaultValue: 'gen_random_uuid()', isPrimaryKey: true, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
      { name: 'user_id', type: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: true, foreignTable: 'auth.users', foreignColumn: 'id', isUnique: false },
      { name: 'name', type: 'TEXT NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'description', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'price', type: 'DECIMAL(10,2) NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'image_url', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'category', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'stock_quantity', type: 'INTEGER DEFAULT 0', nullable: false, defaultValue: '0', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true', nullable: false, defaultValue: 'true', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    ],
  },
};

export function useSchemaFromNL() {
  const [generatedSchema, setGeneratedSchema] = useState<GeneratedSchema | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Detect if user input contains a data model description.
   * Returns a prompt directive if schema generation is warranted.
   */
  const detectSchemaIntent = useCallback((input: string): boolean => {
    const lower = input.toLowerCase();
    const hasModelKeyword = /\b(database|schema|table|data model|backend|supabase|crud|api)\b/.test(lower);
    const hasEntityKeyword = /\b(users?|posts?|comments?|products?|orders?|categories?|tasks?|projects?|invoices?|tickets?|teams?)\b/.test(lower);
    const hasCreateVerb = /\b(create|build|set up|add|need|want|make|generate|scaffold)\b/.test(lower);

    return hasCreateVerb && (hasModelKeyword || (hasEntityKeyword && /\b(with|and|that has|including|containing)\b/.test(lower)));
  }, []);

  /**
   * Build a schema generation directive for injection into the AI prompt.
   */
  const buildSchemaDirective = useCallback((input: string): string => {
    const lower = input.toLowerCase();

    // Detect domain template
    let domainHint = '';
    if (/\b(blog|article|post|cms)\b/.test(lower)) {
      domainHint = '\n[DOMAIN TEMPLATE: Blog/CMS — include posts, categories, comments tables]';
    } else if (/\b(shop|store|ecommerce|product|cart|order)\b/.test(lower)) {
      domainHint = '\n[DOMAIN TEMPLATE: E-commerce — include products, orders, order_items, cart tables]';
    } else if (/\b(task|project|kanban|todo)\b/.test(lower)) {
      domainHint = '\n[DOMAIN TEMPLATE: Project Management — include projects, tasks, task_assignments tables]';
    } else if (/\b(chat|message|conversation)\b/.test(lower)) {
      domainHint = '\n[DOMAIN TEMPLATE: Messaging — include conversations, messages, participants tables]';
    } else if (/\b(booking|appointment|calendar|event)\b/.test(lower)) {
      domainHint = '\n[DOMAIN TEMPLATE: Booking — include events, bookings, availability tables]';
    }

    return `
[SCHEMA GENERATION DIRECTIVE]
The user is describing a data model. Generate Supabase SQL migrations using ===MIGRATION: name=== delimiters.
Requirements:
- Use UUID primary keys with gen_random_uuid()
- Include user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE for user-owned data
- Add created_at TIMESTAMPTZ DEFAULT now() and updated_at TIMESTAMPTZ DEFAULT now()
- Enable RLS on all tables: ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
- Create ownership-based RLS policies for authenticated users
- Include proper indexes for foreign keys and commonly queried columns
- Generate TypeScript interfaces in a ===FILE: src/types/database.ts=== block
- Use snake_case for SQL, camelCase for TypeScript${domainHint}`;
  }, []);

  /**
   * Generate a complete schema from detected entities in user input.
   * This produces the SQL, types, and RLS policies locally (no AI call needed).
   */
  const generateSchemaFromEntities = useCallback((entities: string[]): GeneratedSchema => {
    setIsAnalyzing(true);

    const schemaEntities: SchemaEntity[] = entities.map(entity => {
      const tableName = entity.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;

      // Check domain template
      const template = Object.values(DOMAIN_TEMPLATES).find(t => t.tableName === tableName);
      if (template) return template;

      // Generate basic entity
      const columns: SchemaColumn[] = [
        { name: 'id', type: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()', nullable: false, defaultValue: 'gen_random_uuid()', isPrimaryKey: true, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
        { name: 'user_id', type: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: true, foreignTable: 'auth.users', foreignColumn: 'id', isUnique: false },
        { name: 'name', type: 'TEXT NOT NULL', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
        { name: 'description', type: 'TEXT', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
        { name: 'status', type: "TEXT DEFAULT 'active'", nullable: false, defaultValue: "'active'", isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
        { name: 'metadata', type: "JSONB DEFAULT '{}'::jsonb", nullable: false, defaultValue: "'{}'::jsonb", isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
        { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
        { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
      ];

      return { tableName, columns, rlsEnabled: true, ownerColumn: 'user_id' };
    });

    // Build SQL migration
    const migrationParts: string[] = [];
    const rlsParts: string[] = [];
    const typeParts: string[] = [];

    for (const entity of schemaEntities) {
      const cols = entity.columns.map(c => `  ${c.name} ${c.type}`).join(',\n');
      migrationParts.push(`CREATE TABLE IF NOT EXISTS public.${entity.tableName} (\n${cols}\n);`);

      if (entity.rlsEnabled) {
        rlsParts.push(`ALTER TABLE public.${entity.tableName} ENABLE ROW LEVEL SECURITY;`);
        rlsParts.push(`CREATE POLICY "${entity.tableName}_select_own" ON public.${entity.tableName} FOR SELECT TO authenticated USING (${entity.ownerColumn} = auth.uid());`);
        rlsParts.push(`CREATE POLICY "${entity.tableName}_insert_own" ON public.${entity.tableName} FOR INSERT TO authenticated WITH CHECK (${entity.ownerColumn} = auth.uid());`);
        rlsParts.push(`CREATE POLICY "${entity.tableName}_update_own" ON public.${entity.tableName} FOR UPDATE TO authenticated USING (${entity.ownerColumn} = auth.uid()) WITH CHECK (${entity.ownerColumn} = auth.uid());`);
        rlsParts.push(`CREATE POLICY "${entity.tableName}_delete_own" ON public.${entity.tableName} FOR DELETE TO authenticated USING (${entity.ownerColumn} = auth.uid());`);
      }

      // TypeScript interface
      const tsFields = entity.columns.map(c => {
        let tsType = 'string';
        if (c.type.includes('UUID')) tsType = 'string';
        else if (c.type.includes('INTEGER') || c.type.includes('DECIMAL')) tsType = 'number';
        else if (c.type.includes('BOOLEAN')) tsType = 'boolean';
        else if (c.type.includes('TIMESTAMPTZ') || c.type.includes('DATE')) tsType = 'string';
        else if (c.type.includes('JSONB')) tsType = 'Record<string, unknown>';
        else if (c.type.includes('TEXT[]')) tsType = 'string[]';
        return `  ${c.name.replace(/[-]/g, '_')}: ${tsType}${c.nullable ? ' | null' : ''};`;
      }).join('\n');

      const interfaceName = entity.tableName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      typeParts.push(`export interface ${interfaceName} {\n${tsFields}\n}`);
    }

    const migrationSQL = [...migrationParts, '', ...rlsParts].join('\n\n');
    const typescriptTypes = typeParts.join('\n\n');

    const result: GeneratedSchema = {
      entities: schemaEntities,
      migrationSQL,
      typescriptTypes,
      rlsPolicies: rlsParts.join('\n'),
      summary: `Generated ${schemaEntities.length} table(s): ${schemaEntities.map(e => e.tableName).join(', ')} with RLS policies and TypeScript types.`,
    };

    setGeneratedSchema(result);
    setIsAnalyzing(false);
    return result;
  }, []);

  const clearSchema = useCallback(() => setGeneratedSchema(null), []);

  return {
    generatedSchema,
    isAnalyzing,
    detectSchemaIntent,
    buildSchemaDirective,
    generateSchemaFromEntities,
    clearSchema,
  };
}

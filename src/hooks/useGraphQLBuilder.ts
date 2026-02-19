import { useState, useCallback } from 'react';

export interface GraphQLType {
  id: string;
  name: string;
  fields: { name: string; type: string; nullable: boolean; isList: boolean; description?: string }[];
}

export interface GraphQLQuery {
  id: string;
  name: string;
  type: 'query' | 'mutation' | 'subscription';
  args: { name: string; type: string; required: boolean }[];
  returnType: string;
  resolver: string;
}

export interface GraphQLSchema {
  id: string;
  name: string;
  types: GraphQLType[];
  queries: GraphQLQuery[];
  createdAt: Date;
}

export function useGraphQLBuilder() {
  const [schemas, setSchemas] = useState<GraphQLSchema[]>([]);
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);

  const SCALAR_TYPES = ['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime', 'JSON'];

  const createSchema = useCallback((name: string) => {
    const schema: GraphQLSchema = {
      id: crypto.randomUUID(),
      name,
      types: [{ id: crypto.randomUUID(), name: 'User', fields: [
        { name: 'id', type: 'ID', nullable: false, isList: false },
        { name: 'email', type: 'String', nullable: false, isList: false },
        { name: 'name', type: 'String', nullable: true, isList: false },
        { name: 'createdAt', type: 'DateTime', nullable: false, isList: false },
      ]}],
      queries: [],
      createdAt: new Date(),
    };
    setSchemas(prev => [...prev, schema]);
    setActiveSchemaId(schema.id);
    return schema;
  }, []);

  const addType = useCallback((schemaId: string, name: string) => {
    const type: GraphQLType = { id: crypto.randomUUID(), name, fields: [{ name: 'id', type: 'ID', nullable: false, isList: false }] };
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, types: [...s.types, type] } : s));
  }, []);

  const updateTypeField = useCallback((schemaId: string, typeId: string, fieldIndex: number, update: Partial<GraphQLType['fields'][0]>) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? {
      ...s, types: s.types.map(t => t.id === typeId ? {
        ...t, fields: t.fields.map((f, i) => i === fieldIndex ? { ...f, ...update } : f)
      } : t)
    } : s));
  }, []);

  const addField = useCallback((schemaId: string, typeId: string) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? {
      ...s, types: s.types.map(t => t.id === typeId ? {
        ...t, fields: [...t.fields, { name: 'newField', type: 'String', nullable: true, isList: false }]
      } : t)
    } : s));
  }, []);

  const removeField = useCallback((schemaId: string, typeId: string, fieldIndex: number) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? {
      ...s, types: s.types.map(t => t.id === typeId ? {
        ...t, fields: t.fields.filter((_, i) => i !== fieldIndex)
      } : t)
    } : s));
  }, []);

  const removeType = useCallback((schemaId: string, typeId: string) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, types: s.types.filter(t => t.id !== typeId) } : s));
  }, []);

  const addQuery = useCallback((schemaId: string, type: 'query' | 'mutation' | 'subscription') => {
    const query: GraphQLQuery = {
      id: crypto.randomUUID(), name: `new${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type, args: [], returnType: 'String', resolver: '// TODO: implement resolver',
    };
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, queries: [...s.queries, query] } : s));
  }, []);

  const removeQuery = useCallback((schemaId: string, queryId: string) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, queries: s.queries.filter(q => q.id !== queryId) } : s));
  }, []);

  const getActiveSchema = useCallback(() => schemas.find(s => s.id === activeSchemaId) || null, [schemas, activeSchemaId]);

  const generateSDL = useCallback((schemaId: string): string => {
    const schema = schemas.find(s => s.id === schemaId);
    if (!schema) return '';
    const typesDef = schema.types.map(t => {
      const fields = t.fields.map(f => `  ${f.name}: ${f.isList ? '[' : ''}${f.type}${f.isList ? ']' : ''}${f.nullable ? '' : '!'}`).join('\n');
      return `type ${t.name} {\n${fields}\n}`;
    }).join('\n\n');
    const queries = schema.queries.filter(q => q.type === 'query');
    const mutations = schema.queries.filter(q => q.type === 'mutation');
    const subs = schema.queries.filter(q => q.type === 'subscription');
    let sdl = typesDef;
    if (queries.length) sdl += `\n\ntype Query {\n${queries.map(q => `  ${q.name}(${q.args.map(a => `${a.name}: ${a.type}${a.required ? '!' : ''}`).join(', ')}): ${q.returnType}`).join('\n')}\n}`;
    if (mutations.length) sdl += `\n\ntype Mutation {\n${mutations.map(q => `  ${q.name}(${q.args.map(a => `${a.name}: ${a.type}${a.required ? '!' : ''}`).join(', ')}): ${q.returnType}`).join('\n')}\n}`;
    if (subs.length) sdl += `\n\ntype Subscription {\n${subs.map(q => `  ${q.name}: ${q.returnType}`).join('\n')}\n}`;
    return sdl;
  }, [schemas]);

  const generateResolvers = useCallback((schemaId: string): string => {
    const schema = schemas.find(s => s.id === schemaId);
    if (!schema) return '';
    const lines = ['const resolvers = {'];
    const queries = schema.queries.filter(q => q.type === 'query');
    const mutations = schema.queries.filter(q => q.type === 'mutation');
    if (queries.length) {
      lines.push('  Query: {');
      queries.forEach(q => lines.push(`    ${q.name}: async (_, args) => {\n      ${q.resolver}\n    },`));
      lines.push('  },');
    }
    if (mutations.length) {
      lines.push('  Mutation: {');
      mutations.forEach(q => lines.push(`    ${q.name}: async (_, args) => {\n      ${q.resolver}\n    },`));
      lines.push('  },');
    }
    lines.push('};', '', 'export default resolvers;');
    return lines.join('\n');
  }, [schemas]);

  return {
    schemas, activeSchemaId, setActiveSchemaId, getActiveSchema, SCALAR_TYPES,
    createSchema, addType, addField, updateTypeField, removeField, removeType,
    addQuery, removeQuery, generateSDL, generateResolvers,
  };
}

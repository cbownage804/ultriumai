import { useState, useCallback } from 'react';

export interface ValidationField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'uuid' | 'enum' | 'array' | 'object';
  required: boolean;
  constraints: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enumValues?: string[];
    default?: string;
  };
}

export interface ValidationSchema {
  id: string;
  name: string;
  fields: ValidationField[];
}

export function useDataValidationStudio() {
  const [schemas, setSchemas] = useState<ValidationSchema[]>([
    {
      id: '1',
      name: 'UserForm',
      fields: [
        { id: 'f1', name: 'email', type: 'email', required: true, constraints: {} },
        { id: 'f2', name: 'name', type: 'string', required: true, constraints: { minLength: 2, maxLength: 100 } },
        { id: 'f3', name: 'age', type: 'number', required: false, constraints: { min: 0, max: 150 } },
      ],
    },
  ]);
  const [activeSchemaId, setActiveSchemaId] = useState('1');

  const getActiveSchema = useCallback(() => schemas.find(s => s.id === activeSchemaId) || null, [schemas, activeSchemaId]);

  const createSchema = useCallback((name: string) => {
    const schema: ValidationSchema = { id: crypto.randomUUID(), name, fields: [] };
    setSchemas(prev => [...prev, schema]);
    setActiveSchemaId(schema.id);
  }, []);

  const deleteSchema = useCallback((id: string) => {
    setSchemas(prev => prev.filter(s => s.id !== id));
    setActiveSchemaId(prev => prev === id ? schemas[0]?.id || '' : prev);
  }, [schemas]);

  const addField = useCallback((schemaId: string, field: Omit<ValidationField, 'id'>) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, fields: [...s.fields, { ...field, id: crypto.randomUUID() }] } : s));
  }, []);

  const removeField = useCallback((schemaId: string, fieldId: string) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s));
  }, []);

  const updateField = useCallback((schemaId: string, fieldId: string, updates: Partial<ValidationField>) => {
    setSchemas(prev => prev.map(s => s.id === schemaId ? { ...s, fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) } : s));
  }, []);

  const generateZodCode = useCallback((schema: ValidationSchema): string => {
    const fieldLines = schema.fields.map(f => {
      let chain = '';
      switch (f.type) {
        case 'string': chain = 'z.string()'; break;
        case 'number': chain = 'z.number()'; break;
        case 'boolean': chain = 'z.boolean()'; break;
        case 'date': chain = 'z.date()'; break;
        case 'email': chain = 'z.string().email()'; break;
        case 'url': chain = 'z.string().url()'; break;
        case 'uuid': chain = 'z.string().uuid()'; break;
        case 'enum': chain = `z.enum([${(f.constraints.enumValues || []).map(v => `'${v}'`).join(', ')}])`; break;
        case 'array': chain = 'z.array(z.unknown())'; break;
        case 'object': chain = 'z.record(z.unknown())'; break;
      }
      if (f.type === 'string' || f.type === 'email' || f.type === 'url') {
        if (f.constraints.minLength) chain += `.min(${f.constraints.minLength})`;
        if (f.constraints.maxLength) chain += `.max(${f.constraints.maxLength})`;
        if (f.constraints.pattern) chain += `.regex(/${f.constraints.pattern}/)`;
      }
      if (f.type === 'number') {
        if (f.constraints.min !== undefined) chain += `.min(${f.constraints.min})`;
        if (f.constraints.max !== undefined) chain += `.max(${f.constraints.max})`;
      }
      if (!f.required) chain += '.optional()';
      if (f.constraints.default) chain += `.default(${f.type === 'string' || f.type === 'email' || f.type === 'url' ? `'${f.constraints.default}'` : f.constraints.default})`;
      return `  ${f.name}: ${chain},`;
    });

    return `import { z } from 'zod';

export const ${schema.name}Schema = z.object({
${fieldLines.join('\n')}
});

export type ${schema.name} = z.infer<typeof ${schema.name}Schema>;

// React Hook Form resolver
import { zodResolver } from '@hookform/resolvers/zod';

export const ${schema.name.charAt(0).toLowerCase() + schema.name.slice(1)}Resolver = zodResolver(${schema.name}Schema);

// Usage with React Hook Form:
// const form = useForm<${schema.name}>({ resolver: ${schema.name.charAt(0).toLowerCase() + schema.name.slice(1)}Resolver });
`;
  }, []);

  const generateCode = useCallback((): string => {
    const schema = getActiveSchema();
    if (!schema) return '// No schema selected';
    return generateZodCode(schema);
  }, [getActiveSchema, generateZodCode]);

  return {
    schemas, activeSchemaId, setActiveSchemaId,
    getActiveSchema, createSchema, deleteSchema,
    addField, removeField, updateField,
    generateCode, generateZodCode,
  };
}

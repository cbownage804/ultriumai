import { useState, useCallback } from 'react';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  required: boolean;
  validation?: string; // zod rule
  options?: string[]; // for select/radio
  conditionalOn?: string; // field id
  conditionalValue?: string;
  step?: number; // for multi-step
}

export interface FormConfig {
  id: string;
  name: string;
  fields: FormField[];
  steps: number;
  submitLabel: string;
  onSubmitAction: 'console' | 'api' | 'supabase';
}

const FIELD_DEFAULTS: Record<FormField['type'], Partial<FormField>> = {
  text: { placeholder: 'Enter text...' },
  email: { placeholder: 'email@example.com', validation: 'z.string().email()' },
  password: { placeholder: '••••••••', validation: 'z.string().min(8)' },
  number: { placeholder: '0', validation: 'z.number()' },
  textarea: { placeholder: 'Enter details...' },
  select: { options: ['Option 1', 'Option 2', 'Option 3'] },
  checkbox: {},
  radio: { options: ['Yes', 'No'] },
  date: {},
  file: {},
};

export function useFormBuilder() {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const createForm = useCallback((name: string) => {
    const form: FormConfig = { id: crypto.randomUUID(), name, fields: [], steps: 1, submitLabel: 'Submit', onSubmitAction: 'console' };
    setForms(prev => [...prev, form]);
    setActiveForm(form.id);
    return form;
  }, []);

  const addField = useCallback((formId: string, type: FormField['type']) => {
    const defaults = FIELD_DEFAULTS[type] || {};
    const field: FormField = {
      id: crypto.randomUUID(),
      name: `field_${Date.now()}`,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      required: false,
      step: 1,
      ...defaults,
    };
    setForms(prev => prev.map(f => f.id === formId ? { ...f, fields: [...f.fields, field] } : f));
  }, []);

  const updateField = useCallback((formId: string, fieldId: string, updates: Partial<FormField>) => {
    setForms(prev => prev.map(f => f.id === formId ? {
      ...f, fields: f.fields.map(fd => fd.id === fieldId ? { ...fd, ...updates } : fd)
    } : f));
  }, []);

  const removeField = useCallback((formId: string, fieldId: string) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, fields: f.fields.filter(fd => fd.id !== fieldId) } : f));
  }, []);

  const moveField = useCallback((formId: string, fieldId: string, direction: 'up' | 'down') => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const idx = f.fields.findIndex(fd => fd.id === fieldId);
      if (idx < 0) return f;
      const newIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(f.fields.length - 1, idx + 1);
      const fields = [...f.fields];
      [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
      return { ...f, fields };
    }));
  }, []);

  const updateForm = useCallback((formId: string, updates: Partial<FormConfig>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  }, []);

  const generateZodSchema = useCallback((formId: string): string => {
    const form = forms.find(f => f.id === formId);
    if (!form) return '';
    const fields = form.fields.map(f => {
      const rule = f.validation || (f.required ? 'z.string().min(1)' : 'z.string().optional()');
      return `  ${f.name}: ${rule},`;
    }).join('\n');
    return `import { z } from 'zod';\n\nexport const ${form.name.replace(/\s/g, '')}Schema = z.object({\n${fields}\n});\n\nexport type ${form.name.replace(/\s/g, '')}Data = z.infer<typeof ${form.name.replace(/\s/g, '')}Schema>;`;
  }, [forms]);

  const generateReactForm = useCallback((formId: string): string => {
    const form = forms.find(f => f.id === formId);
    if (!form) return '';
    const name = form.name.replace(/[^a-zA-Z0-9]/g, '');
    const fieldJSX = form.fields.map(f => {
      switch (f.type) {
        case 'textarea': return `      <div>\n        <label className="block text-sm font-medium mb-1">${f.label}</label>\n        <textarea {...register("${f.name}")} placeholder="${f.placeholder || ''}" rows={4} className="w-full border rounded-lg px-3 py-2" />\n      </div>`;
        case 'select': return `      <div>\n        <label className="block text-sm font-medium mb-1">${f.label}</label>\n        <select {...register("${f.name}")} className="w-full border rounded-lg px-3 py-2">\n          ${(f.options || []).map(o => `<option value="${o}">${o}</option>`).join('\n          ')}\n        </select>\n      </div>`;
        case 'checkbox': return `      <label className="flex items-center gap-2">\n        <input type="checkbox" {...register("${f.name}")} />\n        <span className="text-sm">${f.label}</span>\n      </label>`;
        default: return `      <div>\n        <label className="block text-sm font-medium mb-1">${f.label}</label>\n        <input type="${f.type}" {...register("${f.name}")} placeholder="${f.placeholder || ''}" className="w-full border rounded-lg px-3 py-2" />\n      </div>`;
      }
    }).join('\n');

    return `import { useForm } from 'react-hook-form';\n\nexport function ${name}Form() {\n  const { register, handleSubmit } = useForm();\n  const onSubmit = (data) => console.log(data);\n\n  return (\n    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto p-6">\n${fieldJSX}\n      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">${form.submitLabel}</button>\n    </form>\n  );\n}`;
  }, [forms]);

  const getActiveForm = useCallback(() => forms.find(f => f.id === activeForm) || null, [forms, activeForm]);

  return {
    forms, activeForm, setActiveForm, createForm, addField, updateField, removeField,
    moveField, updateForm, generateZodSchema, generateReactForm, getActiveForm,
    fieldTypes: Object.keys(FIELD_DEFAULTS) as FormField['type'][],
  };
}

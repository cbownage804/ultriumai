import { useState } from 'react';

export interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  charCount: number;
}

export function useSMSTemplateManager() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([
    { id: '1', name: 'Welcome', body: 'Welcome {{name}}! Your account is ready.', variables: ['name'], charCount: 42 },
    { id: '2', name: 'Verification', body: 'Your code is {{code}}. Expires in 10 min.', variables: ['code'], charCount: 42 },
  ]);
  const [activeTemplateId, setActiveTemplateId] = useState('1');
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  const getActiveTemplate = () => templates.find(t => t.id === activeTemplateId) || null;

  const extractVars = (body: string): string[] => {
    const matches = body.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  };

  const createTemplate = (name: string) => {
    const t: SMSTemplate = { id: crypto.randomUUID(), name, body: '', variables: [], charCount: 0 };
    setTemplates(prev => [...prev, t]);
    setActiveTemplateId(t.id);
  };

  const updateTemplate = (id: string, body: string) => {
    const variables = extractVars(body);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, body, variables, charCount: body.length } : t));
  };

  const removeTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (activeTemplateId === id) setActiveTemplateId(templates[0]?.id || '');
  };

  const getPreview = (template: SMSTemplate): string => {
    let result = template.body;
    template.variables.forEach(v => {
      result = result.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), previewVars[v] || `[${v}]`);
    });
    return result;
  };

  const generateCode = (): string => {
    const tmpl = getActiveTemplate();
    if (!tmpl) return '// No template selected';

    return `import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER")!;

// Template: ${tmpl.name}
const template = \`${tmpl.body}\`;

function interpolate(tmpl: string, vars: Record<string, string>): string {
  return tmpl.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) => vars[key] || '');
}

serve(async (req) => {
  const { to, ${tmpl.variables.join(', ')} } = await req.json();
  const body = interpolate(template, { ${tmpl.variables.join(', ')} });

  const resp = await fetch(\`https://api.twilio.com/2010-04-01/Accounts/\${TWILIO_SID}/Messages.json\`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(\`\${TWILIO_SID}:\${TWILIO_TOKEN}\`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });

  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status: resp.ok ? 200 : 500,
  });
});`;
  };

  return {
    templates, activeTemplateId, setActiveTemplateId, getActiveTemplate,
    previewVars, setPreviewVars, createTemplate, updateTemplate, removeTemplate,
    getPreview, generateCode,
  };
}

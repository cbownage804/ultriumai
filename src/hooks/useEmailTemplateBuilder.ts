import { useState, useCallback } from 'react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'notification' | 'onboarding';
  variables: string[];
  htmlContent: string;
  textContent: string;
  createdAt: Date;
}

export function useEmailTemplateBuilder() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const TEMPLATE_PRESETS: Record<string, Partial<EmailTemplate>> = {
    welcome: {
      name: 'Welcome Email', subject: 'Welcome to {{appName}}!', category: 'onboarding',
      variables: ['appName', 'userName', 'loginUrl'],
      htmlContent: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:2rem;">
  <h1 style="color:#6366f1;">Welcome, {{userName}}! 🎉</h1>
  <p>Thanks for joining <strong>{{appName}}</strong>.</p>
  <a href="{{loginUrl}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;margin-top:1rem;">Get Started</a>
</div>`,
      textContent: 'Welcome, {{userName}}! Thanks for joining {{appName}}. Get started: {{loginUrl}}',
    },
    passwordReset: {
      name: 'Password Reset', subject: 'Reset your password', category: 'transactional',
      variables: ['userName', 'resetUrl', 'expiresIn'],
      htmlContent: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:2rem;">
  <h2>Password Reset</h2>
  <p>Hi {{userName}}, click below to reset your password. This link expires in {{expiresIn}}.</p>
  <a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:white;text-decoration:none;border-radius:8px;">Reset Password</a>
</div>`,
      textContent: 'Hi {{userName}}, reset your password: {{resetUrl}} (expires in {{expiresIn}})',
    },
    invoice: {
      name: 'Invoice', subject: 'Invoice #{{invoiceNumber}}', category: 'transactional',
      variables: ['userName', 'invoiceNumber', 'amount', 'dueDate', 'paymentUrl'],
      htmlContent: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:2rem;">
  <h2>Invoice #{{invoiceNumber}}</h2>
  <p>Hi {{userName}}, your invoice for <strong>\${{amount}}</strong> is due on {{dueDate}}.</p>
  <a href="{{paymentUrl}}" style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;">Pay Now</a>
</div>`,
      textContent: 'Invoice #{{invoiceNumber}}: ${{amount}} due {{dueDate}}. Pay: {{paymentUrl}}',
    },
  };

  const createTemplate = useCallback((presetKey?: string) => {
    const preset = presetKey ? TEMPLATE_PRESETS[presetKey] : undefined;
    const template: EmailTemplate = {
      id: crypto.randomUUID(),
      name: preset?.name || 'New Template',
      subject: preset?.subject || 'Subject line',
      category: preset?.category || 'transactional',
      variables: preset?.variables || [],
      htmlContent: preset?.htmlContent || '<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:2rem;"><h1>Hello {{name}}</h1><p>Your content here.</p></div>',
      textContent: preset?.textContent || 'Hello {{name}}, your content here.',
      createdAt: new Date(),
    };
    setTemplates(prev => [...prev, template]);
    setActiveTemplateId(template.id);
    return template;
  }, []);

  const updateTemplate = useCallback((id: string, update: Partial<EmailTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const addVariable = useCallback((templateId: string, name: string) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, variables: [...new Set([...t.variables, name])] } : t));
  }, []);

  const removeVariable = useCallback((templateId: string, name: string) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, variables: t.variables.filter(v => v !== name) } : t));
  }, []);

  const getActiveTemplate = useCallback(() => templates.find(t => t.id === activeTemplateId) || null, [templates, activeTemplateId]);

  const previewWithData = useCallback((templateId: string, data: Record<string, string>): string => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';
    let html = template.htmlContent;
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return html;
  }, [templates]);

  const generateSendFunction = useCallback((templateId: string): string => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';
    const varsType = template.variables.map(v => `  ${v}: string;`).join('\n');
    return `import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ${template.name.replace(/\s+/g, '')}Vars {\n${varsType}\n}

export async function send${template.name.replace(/\s+/g, '')}(to: string, vars: ${template.name.replace(/\s+/g, '')}Vars) {
  let html = \`${template.htmlContent.replace(/`/g, '\\`')}\`;
  let subject = \`${template.subject.replace(/`/g, '\\`')}\`;
  
  for (const [key, value] of Object.entries(vars)) {
    const re = new RegExp(\`\\\\{\\\\{\${key}\\\\}\\\\}\`, 'g');
    html = html.replace(re, value);
    subject = subject.replace(re, value);
  }
  
  return resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  });
}`;
  }, [templates]);

  return {
    templates, activeTemplateId, setActiveTemplateId, getActiveTemplate,
    TEMPLATE_PRESETS: Object.keys(TEMPLATE_PRESETS),
    createTemplate, updateTemplate, removeTemplate, addVariable, removeVariable,
    previewWithData, generateSendFunction,
  };
}

import { useState } from 'react';

export interface EmailStep {
  id: string;
  type: 'email' | 'delay' | 'condition';
  name: string;
  subject?: string;
  body?: string;
  delayDays?: number;
  conditionField?: string;
  conditionOp?: 'equals' | 'contains' | 'exists';
  conditionValue?: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  trigger: string;
  steps: EmailStep[];
  isActive: boolean;
}

export function useEmailSequenceBuilder() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [activeSequenceId, setActiveSequenceId] = useState<string | null>(null);

  const getActiveSequence = () => sequences.find(s => s.id === activeSequenceId) || null;

  const createSequence = (name: string, trigger: string) => {
    const seq: EmailSequence = { id: crypto.randomUUID(), name, trigger, steps: [], isActive: false };
    setSequences(prev => [...prev, seq]);
    setActiveSequenceId(seq.id);
  };

  const removeSequence = (id: string) => {
    setSequences(prev => prev.filter(s => s.id !== id));
    if (activeSequenceId === id) setActiveSequenceId(null);
  };

  const toggleSequence = (id: string) => {
    setSequences(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const addStep = (seqId: string, type: EmailStep['type'], name: string) => {
    const step: EmailStep = {
      id: crypto.randomUUID(), type, name,
      ...(type === 'email' ? { subject: 'Subject', body: 'Hello {{name}},' } : {}),
      ...(type === 'delay' ? { delayDays: 1 } : {}),
      ...(type === 'condition' ? { conditionField: 'opened', conditionOp: 'equals' as const, conditionValue: 'true' } : {}),
    };
    setSequences(prev => prev.map(s => s.id === seqId ? { ...s, steps: [...s.steps, step] } : s));
  };

  const removeStep = (seqId: string, stepId: string) => {
    setSequences(prev => prev.map(s => s.id === seqId ? { ...s, steps: s.steps.filter(st => st.id !== stepId) } : s));
  };

  const updateStep = (seqId: string, stepId: string, updates: Partial<EmailStep>) => {
    setSequences(prev => prev.map(s => s.id === seqId ? { ...s, steps: s.steps.map(st => st.id === stepId ? { ...st, ...updates } : st) } : s));
  };

  const generateCode = (): string => {
    const seq = getActiveSequence();
    if (!seq) return '// No sequence selected';

    const stepHandlers = seq.steps.map((step, i) => {
      if (step.type === 'delay') return `    // Step ${i + 1}: Wait ${step.delayDays} day(s)\n    await new Promise(r => setTimeout(r, ${(step.delayDays || 1) * 86400} * 1000));`;
      if (step.type === 'condition') return `    // Step ${i + 1}: Check ${step.conditionField}\n    if (!(context.${step.conditionField} ${step.conditionOp === 'equals' ? '===' : step.conditionOp === 'contains' ? '.includes' : ''}${step.conditionOp === 'exists' ? '' : ` '${step.conditionValue}'`})) return;`;
      return `    // Step ${i + 1}: Send "${step.name}"\n    await resend.emails.send({\n      from: 'onboarding@example.com',\n      to: context.email,\n      subject: '${step.subject || ''}',\n      html: \`${step.body || ''}\`,\n    });`;
    }).join('\n\n');

    return `import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Sequence: ${seq.name} (Trigger: ${seq.trigger})
serve(async (req) => {
  const context = await req.json();

  try {
${stepHandlers}

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});`;
  };

  return {
    sequences, activeSequenceId, setActiveSequenceId, getActiveSequence,
    createSequence, removeSequence, toggleSequence,
    addStep, removeStep, updateStep, generateCode,
  };
}

import { useState, useCallback } from 'react';
import type { Question, QuestionAnswers } from './QuestionsCard';

export interface PendingQuestions {
  id: string;
  questions: Question[];
  context: string; // original prompt that triggered questions
}

/**
 * Detects when a large prompt needs clarification and generates
 * relevant questions before proceeding.
 */
export function useBuilderQuestions() {
  const [pending, setPending] = useState<PendingQuestions | null>(null);

  /** Analyze a prompt and optionally generate clarifying questions */
  const analyzeForQuestions = useCallback((prompt: string): PendingQuestions | null => {
    const questions = generateQuestions(prompt);
    if (questions.length === 0) return null;

    const pq: PendingQuestions = {
      id: crypto.randomUUID(),
      questions,
      context: prompt,
    };
    setPending(pq);
    return pq;
  }, []);

  /** Clear pending questions */
  const dismiss = useCallback(() => setPending(null), []);

  /** Build an enriched prompt from answers */
  const buildEnrichedPrompt = useCallback((original: string, answers: QuestionAnswers): string => {
    const parts: string[] = [original, '\n\n--- User Preferences ---'];
    for (const [qid, qa] of Object.entries(answers)) {
      if (qa.selected.length > 0) {
        parts.push(`• ${qid}: ${qa.selected.join(', ')}`);
      }
    }
    setPending(null);
    return parts.join('\n');
  }, []);

  return { pending, analyzeForQuestions, dismiss, buildEnrichedPrompt };
}

// --- Question generation heuristics ---

function generateQuestions(prompt: string): Question[] {
  const questions: Question[] = [];
  const lower = prompt.toLowerCase();
  const len = prompt.length;

  // Only generate questions for substantial prompts
  if (len < 600) return [];

  // Auth question
  if (/auth|login|signup|user|role|permission|access/i.test(prompt)) {
    questions.push({
      id: 'auth_method',
      header: 'Authentication',
      question: 'What authentication method should this app use?',
      multiSelect: false,
      allowOther: true,
      options: [
        { label: 'Email & Password', description: 'Traditional email/password login with Supabase Auth' },
        { label: 'OAuth / Social', description: 'Sign in with Google, GitHub, Microsoft, etc.' },
        { label: 'Magic Link', description: 'Passwordless email-based authentication' },
        { label: 'API Key', description: 'Token-based auth for API/service integrations' },
      ],
    });
  }

  // Design question
  if (/design|theme|ui|dark|light|style|color|look/i.test(prompt) || len > 1000) {
    questions.push({
      id: 'design_style',
      header: 'Design',
      question: 'What design style do you prefer?',
      multiSelect: false,
      allowOther: true,
      options: [
        { label: 'Dark & Modern', description: 'Dark backgrounds with clean lines and subtle accents' },
        { label: 'Light & Minimal', description: 'White/light backgrounds with minimal visual noise' },
        { label: 'Bold & Colorful', description: 'Vibrant colors with strong visual hierarchy' },
        { label: 'Corporate / Professional', description: 'Neutral tones, formal typography, enterprise feel' },
      ],
    });
  }

  // Data storage question
  if (/database|table|store|data|schema|postgres|supabase/i.test(prompt)) {
    questions.push({
      id: 'data_approach',
      header: 'Data',
      question: 'How should data be stored?',
      multiSelect: false,
      allowOther: true,
      options: [
        { label: 'Supabase (Cloud)', description: 'Full Postgres database with RLS, auth, and real-time' },
        { label: 'Local Storage', description: 'Browser-based storage for prototyping (no backend)' },
        { label: 'Mock / Demo Data', description: 'Hardcoded sample data for demos and testing' },
      ],
    });
  }

  // Scope question for very large prompts
  if (len > 1500) {
    questions.push({
      id: 'scope_priority',
      header: 'Scope',
      question: 'Which areas should be prioritized first?',
      multiSelect: true,
      allowOther: true,
      options: [
        { label: 'Core functionality', description: 'Focus on the main feature set and business logic' },
        { label: 'UI & polish', description: 'Prioritize the look, feel, and user experience' },
        { label: 'Backend & data', description: 'Start with database schema, APIs, and data flow' },
        { label: 'Auth & security', description: 'Set up authentication and access controls first' },
      ],
    });
  }

  // Deployment question
  if (/deploy|host|production|live|domain|publish/i.test(prompt)) {
    questions.push({
      id: 'deployment',
      header: 'Deployment',
      question: 'Where will this be deployed?',
      multiSelect: false,
      allowOther: true,
      options: [
        { label: 'Lovable Cloud', description: 'Deploy directly from the builder with one click' },
        { label: 'Vercel / Netlify', description: 'Connect via Git and deploy to a static host' },
        { label: 'Custom server', description: 'Self-host on your own infrastructure' },
      ],
    });
  }

  return questions.slice(0, 4); // Max 4 questions
}

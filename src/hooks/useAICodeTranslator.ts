import { useState, useCallback } from 'react';

export interface TranslationJob {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceCode: string;
  translatedCode: string;
  status: 'pending' | 'translating' | 'done' | 'error';
  createdAt: string;
}

const SUPPORTED_LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java',
  'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart',
];

export function useAICodeTranslator() {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('TypeScript');
  const [targetLanguage, setTargetLanguage] = useState('Python');
  const [sourceCode, setSourceCode] = useState('');

  const translate = useCallback(() => {
    const job: TranslationJob = {
      id: crypto.randomUUID(),
      sourceLanguage,
      targetLanguage,
      sourceCode,
      translatedCode: `// Translated from ${sourceLanguage} to ${targetLanguage}\n// AI translation would process here\n${sourceCode}`,
      status: 'done',
      createdAt: new Date().toISOString(),
    };
    setJobs(prev => [job, ...prev]);
    return job;
  }, [sourceLanguage, targetLanguage, sourceCode]);

  const removeJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const generateCode = useCallback(() => {
    return `// AI Code Translator Utility
export async function translateCode(
  source: string,
  fromLang: string,
  toLang: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${apiKey}\` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: \`Translate the following \${fromLang} code to \${toLang}. Return only the translated code.\` },
        { role: 'user', content: source },
      ],
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}
`;
  }, []);

  return {
    jobs, sourceLanguage, targetLanguage, sourceCode,
    setSourceLanguage, setTargetLanguage, setSourceCode,
    translate, removeJob, generateCode,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

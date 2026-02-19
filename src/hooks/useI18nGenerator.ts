import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface I18nString {
  key: string;
  defaultValue: string;
  file: string;
  line: number;
}

export interface LocaleFile {
  locale: string;
  label: string;
  translations: Record<string, string>;
}

export function useI18nGenerator() {
  const [strings, setStrings] = useState<I18nString[]>([]);
  const [locales, setLocales] = useState<LocaleFile[]>([
    { locale: 'en', label: 'English', translations: {} },
  ]);

  const extractStrings = useCallback((files: ProjectFile[]): I18nString[] => {
    const extracted: I18nString[] = [];
    const seen = new Set<string>();
    for (const file of files) {
      if (!/\.(tsx|jsx|html)$/.test(file.path)) continue;
      const lines = file.content.split('\n');
      lines.forEach((line, idx) => {
        // Match JSX text content: >Text here<
        const matches = line.matchAll(/>([A-Z][^<>{}\n]{2,60})</g);
        for (const m of matches) {
          const text = m[1].trim();
          if (seen.has(text) || /^[^a-zA-Z]*$/.test(text) || text.includes('{')) continue;
          seen.add(text);
          const key = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
          extracted.push({ key, defaultValue: text, file: file.path, line: idx + 1 });
        }
      });
    }
    setStrings(extracted);
    // Auto-populate English locale
    const enTranslations: Record<string, string> = {};
    extracted.forEach(s => { enTranslations[s.key] = s.defaultValue; });
    setLocales(prev => prev.map(l => l.locale === 'en' ? { ...l, translations: enTranslations } : l));
    return extracted;
  }, []);

  const addLocale = useCallback((locale: string, label: string) => {
    setLocales(prev => {
      if (prev.some(l => l.locale === locale)) return prev;
      const en = prev.find(l => l.locale === 'en');
      const translations: Record<string, string> = {};
      if (en) Object.keys(en.translations).forEach(k => { translations[k] = ''; });
      return [...prev, { locale, label, translations }];
    });
  }, []);

  const updateTranslation = useCallback((locale: string, key: string, value: string) => {
    setLocales(prev => prev.map(l => l.locale === locale ? { ...l, translations: { ...l.translations, [key]: value } } : l));
  }, []);

  const generateFiles = useCallback((): ProjectFile[] => {
    const files: ProjectFile[] = [];
    // Locale JSON files
    for (const locale of locales) {
      files.push({
        path: `locales/${locale.locale}.json`,
        content: JSON.stringify(locale.translations, null, 2),
        language: 'json',
      });
    }
    // useTranslation hook
    files.push({
      path: 'hooks/useTranslation.ts',
      content: `import { useState, useCallback } from 'react';\n\nconst locales: Record<string, Record<string, string>> = {};\n\nexport function useTranslation() {\n  const [locale, setLocale] = useState('en');\n  const t = useCallback((key: string): string => {\n    return locales[locale]?.[key] || key;\n  }, [locale]);\n  const loadLocale = useCallback(async (loc: string) => {\n    if (!locales[loc]) {\n      const mod = await import(\`../locales/\${loc}.json\`);\n      locales[loc] = mod.default;\n    }\n    setLocale(loc);\n  }, []);\n  return { t, locale, setLocale: loadLocale, availableLocales: ${JSON.stringify(locales.map(l => l.locale))} };\n}`,
      language: 'typescript',
    });
    // LanguageSwitcher component
    files.push({
      path: 'components/LanguageSwitcher.tsx',
      content: `import { useTranslation } from '../hooks/useTranslation';\n\nconst LOCALE_LABELS: Record<string, string> = ${JSON.stringify(Object.fromEntries(locales.map(l => [l.locale, l.label])))};\n\nexport function LanguageSwitcher() {\n  const { locale, setLocale, availableLocales } = useTranslation();\n  return (\n    <select\n      value={locale}\n      onChange={(e) => setLocale(e.target.value)}\n      className="px-2 py-1 rounded border text-sm"\n    >\n      {availableLocales.map((l: string) => (\n        <option key={l} value={l}>{LOCALE_LABELS[l] || l}</option>\n      ))}\n    </select>\n  );\n}`,
      language: 'typescript',
    });
    return files;
  }, [locales]);

  const removeLocale = useCallback((locale: string) => {
    if (locale === 'en') return;
    setLocales(prev => prev.filter(l => l.locale !== locale));
  }, []);

  return { strings, locales, extractStrings, addLocale, removeLocale, updateTranslation, generateFiles };
}

import { X, Globe, Plus, Trash2, Search, Download } from 'lucide-react';
import type { I18nString, LocaleFile } from '@/hooks/useI18nGenerator';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  strings: I18nString[];
  locales: LocaleFile[];
  onExtract: () => void;
  onAddLocale: (locale: string, label: string) => void;
  onRemoveLocale: (locale: string) => void;
  onUpdateTranslation: (locale: string, key: string, value: string) => void;
  onGenerateFiles: () => void;
}

const COMMON_LOCALES = [
  { code: 'es', label: 'Spanish' }, { code: 'fr', label: 'French' }, { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' }, { code: 'zh', label: 'Chinese' }, { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' }, { code: 'ar', label: 'Arabic' }, { code: 'hi', label: 'Hindi' },
];

export function I18nPanel({ open, onClose, strings, locales, onExtract, onAddLocale, onRemoveLocale, onUpdateTranslation, onGenerateFiles }: Props) {
  const [activeLocale, setActiveLocale] = useState('en');
  if (!open) return null;
  const locale = locales.find(l => l.locale === activeLocale);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-blue-400" /><span className="text-sm font-medium text-white">Internationalization (i18n)</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={onExtract} className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 flex items-center gap-1">
              <Search className="h-3 w-3" /> Extract Strings
            </button>
            <button onClick={onGenerateFiles} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 flex items-center gap-1">
              <Download className="h-3 w-3" /> Generate Files
            </button>
            <span className="text-[10px] text-white/30">{strings.length} strings · {locales.length} locale(s)</span>
          </div>

          {/* Locale tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {locales.map(l => (
              <button key={l.locale} onClick={() => setActiveLocale(l.locale)} className={`px-2 py-1 text-[10px] rounded ${activeLocale === l.locale ? 'bg-blue-500/20 text-blue-300' : 'text-white/30 hover:text-white/50'}`}>
                {l.label} ({l.locale})
                {l.locale !== 'en' && <span onClick={(e) => { e.stopPropagation(); onRemoveLocale(l.locale); }} className="ml-1 text-red-400/50 hover:text-red-400">×</span>}
              </button>
            ))}
            <div className="relative group">
              <button className="px-2 py-1 text-[10px] text-white/20 hover:text-white/40"><Plus className="h-3 w-3 inline" /> Add</button>
              <div className="absolute top-full left-0 mt-1 bg-[#1a1a2e] border border-white/[0.08] rounded-lg shadow-xl hidden group-hover:block z-10 py-1 min-w-[120px]">
                {COMMON_LOCALES.filter(cl => !locales.some(l => l.locale === cl.code)).map(cl => (
                  <button key={cl.code} onClick={() => onAddLocale(cl.code, cl.label)} className="w-full text-left px-3 py-1 text-[10px] text-white/50 hover:text-white/80 hover:bg-white/5">{cl.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Translation table */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {strings.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">Click "Extract Strings" to scan your project for translatable text.</p>
            ) : strings.map(s => (
              <div key={s.key} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02]">
                <span className="text-[10px] text-white/20 font-mono w-32 truncate shrink-0">{s.key}</span>
                <span className="text-[10px] text-white/40 w-40 truncate shrink-0">{s.defaultValue}</span>
                <input
                  value={locale?.translations[s.key] || ''}
                  onChange={e => onUpdateTranslation(activeLocale, s.key, e.target.value)}
                  placeholder={activeLocale === 'en' ? s.defaultValue : 'Translation...'}
                  className="flex-1 bg-black/20 border border-white/[0.06] rounded px-2 py-0.5 text-[10px] text-white/70 placeholder:text-white/15"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

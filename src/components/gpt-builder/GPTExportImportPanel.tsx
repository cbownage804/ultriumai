import { useState, useRef } from 'react';
import { GPTConfig } from '@/types/gptConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  X, Download, Upload, Copy, Check, FileJson, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GPTExportImportPanelProps {
  config: GPTConfig;
  onChange: (updates: Partial<GPTConfig>) => void;
  onClose: () => void;
  onDuplicate?: () => void;
}

export function GPTExportImportPanel({ config, onChange, onClose, onDuplicate }: GPTExportImportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Partial<GPTConfig> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportableConfig = {
    name: config.name,
    description: config.description,
    system_prompt: config.system_prompt,
    avatar_url: config.avatar_url,
    theme_color: config.theme_color,
    welcome_message: config.welcome_message,
    starter_questions: config.starter_questions,
    preferred_model: config.preferred_model,
    enable_web_search: config.enable_web_search,
    communication_style: config.communication_style,
    expertise_areas: config.expertise_areas,
    category: config.category,
    features: config.features,
    placeholder_prompt: config.placeholder_prompt,
    knowledge_sources: config.knowledge_sources,
    actions: config.actions,
    embed_style: config.embed_style,
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(exportableConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(config.name || 'gpt-config').replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('GPT config exported');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(exportableConfig, null, 2));
    setCopied(true);
    toast.success('JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data || typeof data !== 'object') throw new Error('Invalid format');
        if (!data.system_prompt && !data.name) throw new Error('Missing required fields (name or system_prompt)');
        setPreviewData(data);
      } catch (err: any) {
        setImportError(err.message || 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const applyImport = () => {
    if (!previewData) return;
    onChange(previewData);
    setPreviewData(null);
    toast.success('GPT config imported successfully');
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
          <FileJson className="h-3.5 w-3.5" /> Export & Import
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Export Section */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Export</h4>
            <p className="text-[10px] text-white/20">
              Download or copy your GPT configuration as JSON to share or back up.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportJSON}
                className="flex-1 h-9 text-xs border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download .json
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyJSON}
                className="h-9 px-3 text-xs border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Import</h4>
            <p className="text-[10px] text-white/20">
              Load a previously exported GPT config. This will overwrite current settings.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="w-full h-9 text-xs border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Select JSON file
            </Button>

            <AnimatePresence mode="wait">
              {importError && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-red-500/20 bg-red-500/5"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-[10px] text-red-400/80">{importError}</p>
                </motion.div>
              )}

              {previewData && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                    <p className="text-[11px] text-emerald-400/80 font-medium">
                      Ready to import: {previewData.name || 'Unnamed GPT'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {previewData.system_prompt && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">Prompt</span>
                      )}
                      {previewData.starter_questions?.length ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
                          {previewData.starter_questions.length} starters
                        </span>
                      ) : null}
                      {previewData.knowledge_sources?.length ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
                          {previewData.knowledge_sources.length} knowledge sources
                        </span>
                      ) : null}
                      {previewData.actions?.some(a => a.enabled) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">Actions</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={applyImport}
                      className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Apply Import
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewData(null)}
                      className="h-8 text-xs text-white/40"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Duplicate Section */}
          {onDuplicate && (
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Duplicate</h4>
              <p className="text-[10px] text-white/20">
                Create a copy of this GPT with all settings. The clone will be saved as a new GPT.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onDuplicate}
                className="w-full h-9 text-xs border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Duplicate GPT
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

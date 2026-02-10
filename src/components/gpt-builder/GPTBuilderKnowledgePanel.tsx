import { useState } from 'react';
import { GPTConfig, KnowledgeSource } from '@/types/gptConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Plus, Link, FileText, Type, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface GPTBuilderKnowledgePanelProps {
  config: GPTConfig;
  onChange: (updates: Partial<GPTConfig>) => void;
  onClose: () => void;
}

type AddMode = 'text' | 'url' | null;

export function GPTBuilderKnowledgePanel({ config, onChange, onClose }: GPTBuilderKnowledgePanelProps) {
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [textName, setTextName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addTextKnowledge = () => {
    if (!textName.trim() || !textContent.trim()) {
      toast.error('Provide a name and content');
      return;
    }
    const source: KnowledgeSource = {
      id: crypto.randomUUID(),
      type: 'text',
      name: textName.trim(),
      content: textContent.trim(),
      addedAt: new Date(),
    };
    onChange({ knowledge_sources: [...config.knowledge_sources, source] });
    setTextName('');
    setTextContent('');
    setAddMode(null);
    toast.success('Knowledge added');
  };

  const addUrlKnowledge = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    try {
      // For now, store URL as a knowledge source reference
      const source: KnowledgeSource = {
        id: crypto.randomUUID(),
        type: 'url',
        name: urlInput.trim(),
        content: `Reference URL: ${urlInput.trim()}`,
        addedAt: new Date(),
      };
      onChange({ knowledge_sources: [...config.knowledge_sources, source] });
      setUrlInput('');
      setAddMode(null);
      toast.success('URL source added');
    } catch {
      toast.error('Failed to add URL');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSource = (id: string) => {
    onChange({ knowledge_sources: config.knowledge_sources.filter(s => s.id !== id) });
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Knowledge Base
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Add buttons */}
          {!addMode && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAddMode('text')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
              >
                <Type className="h-5 w-5 text-white/40" />
                <span className="text-[11px] text-white/50">Add Text</span>
              </button>
              <button
                onClick={() => setAddMode('url')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
              >
                <Link className="h-5 w-5 text-white/40" />
                <span className="text-[11px] text-white/50">Add URL</span>
              </button>
            </div>
          )}

          {/* Add Text Form */}
          {addMode === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]"
            >
              <Label className="text-xs text-white/50">Name</Label>
              <Input
                value={textName}
                onChange={(e) => setTextName(e.target.value)}
                placeholder="e.g., Product FAQ, Company Info"
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
              <Label className="text-xs text-white/50">Content</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your knowledge content here..."
                className="min-h-[120px] text-xs bg-white/[0.04] border-white/[0.08] text-white resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addTextKnowledge} className="h-7 text-xs flex-1">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddMode(null)} className="h-7 text-xs text-white/50">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Add URL Form */}
          {addMode === 'url' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]"
            >
              <Label className="text-xs text-white/50">Website URL</Label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://docs.example.com"
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addUrlKnowledge} disabled={isLoading} className="h-7 text-xs flex-1">
                  {isLoading ? 'Adding...' : <><Plus className="h-3 w-3 mr-1" /> Add URL</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddMode(null)} className="h-7 text-xs text-white/50">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Sources List */}
          {config.knowledge_sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">
                Sources ({config.knowledge_sources.length})
              </h4>
              <AnimatePresence>
                {config.knowledge_sources.map(source => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                  >
                    {source.type === 'text' && <FileText className="h-3.5 w-3.5 text-blue-400/60 shrink-0" />}
                    {source.type === 'url' && <Link className="h-3.5 w-3.5 text-green-400/60 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{source.name}</p>
                      <p className="text-[10px] text-white/30 truncate">
                        {source.type === 'text' ? `${source.content.length} chars` : source.content}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSource(source.id)}
                      className="text-white/20 hover:text-red-400/60 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {config.knowledge_sources.length === 0 && !addMode && (
            <p className="text-[11px] text-white/20 text-center py-6">
              Add text or URLs to give your GPT specialized knowledge
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

import { useState } from 'react';
import { X, Brain, Plus, Trash2, FileText, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface KnowledgeConfig {
  customInstructions: string;
  contextFiles: { name: string; content: string }[];
}

interface KnowledgePanelProps {
  open: boolean;
  onClose: () => void;
  knowledge: KnowledgeConfig;
  onKnowledgeChange: (knowledge: KnowledgeConfig) => void;
}

export function KnowledgePanel({ open, onClose, knowledge, onKnowledgeChange }: KnowledgePanelProps) {
  const [instructions, setInstructions] = useState(knowledge.customInstructions);
  const [contextFiles, setContextFiles] = useState(knowledge.contextFiles);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);

  const handleSave = () => {
    onKnowledgeChange({ customInstructions: instructions, contextFiles });
    toast.success('Knowledge saved');
  };

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    setContextFiles(prev => [...prev, { name: newFileName.trim(), content: newFileContent }]);
    setNewFileName('');
    setNewFileContent('');
    setShowAddFile(false);
  };

  const handleRemoveFile = (index: number) => {
    setContextFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/80">Knowledge</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Custom Instructions */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1.5">
              Custom Instructions
            </label>
            <p className="text-[9px] text-white/20 mb-2">
              These instructions are included with every AI prompt in this project.
            </p>
            <Textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Always use Tailwind CSS. The brand color is #06b6d4. Use TypeScript strict mode."
              className="min-h-[120px] text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/15 resize-none"
            />
          </div>

          {/* Context Files */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                Context Files
              </label>
              <button
                onClick={() => setShowAddFile(true)}
                className="text-[10px] text-cyan-400/60 hover:text-cyan-400 flex items-center gap-0.5"
              >
                <Plus className="h-2.5 w-2.5" />Add
              </button>
            </div>
            <p className="text-[9px] text-white/20 mb-2">
              Files always included as context for the AI.
            </p>

            {contextFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded bg-white/[0.02] border border-white/[0.04] mb-1.5 group">
                <FileText className="h-3 w-3 text-white/20 shrink-0" />
                <span className="text-[10px] text-white/60 font-mono truncate flex-1">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(i)}
                  className="h-4 w-4 rounded flex items-center justify-center text-white/10 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}

            {showAddFile && (
              <div className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.02] space-y-2 mt-2">
                <Input
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  placeholder="File name (e.g. style-guide.md)"
                  className="h-7 text-[10px] bg-white/[0.03] border-white/[0.08] text-white/80"
                />
                <Textarea
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  placeholder="File content..."
                  className="min-h-[60px] text-[10px] bg-white/[0.03] border-white/[0.08] text-white/80 resize-none"
                />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setShowAddFile(false)} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded">Cancel</button>
                  <button onClick={handleAddFile} className="text-[10px] text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20">Add</button>
                </div>
              </div>
            )}

            {contextFiles.length === 0 && !showAddFile && (
              <p className="text-[9px] text-white/15 italic">No context files added</p>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <Button onClick={handleSave} className="w-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0 text-xs h-8">
          <Save className="h-3 w-3 mr-1.5" />
          Save Knowledge
        </Button>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { Pencil, Type, Palette, X, Check, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisualEditClickOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onDirectEdit?: (selector: string, property: string, value: string) => void;
  onAIPromptEdit?: (selector: string, context: string, prompt: string) => void;
}

export function VisualEditClickOverlay({ isActive, onToggle, iframeRef, onDirectEdit, onAIPromptEdit }: VisualEditClickOverlayProps) {
  const [selectedElement, setSelectedElement] = useState<{
    selector: string;
    tagName: string;
    text: string;
    rect: DOMRect;
    sourceFile?: string | null;
    sourceLine?: number | null;
  } | null>(null);
  const [editMode, setEditMode] = useState<'text' | 'prompt' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    if (!isActive || !iframeRef.current) {
      setSelectedElement(null);
      setEditMode(null);
      return;
    }

    const iframe = iframeRef.current;
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === '__VISUAL_EDIT_SELECT__') {
        setSelectedElement({
          selector: e.data.selector,
          tagName: e.data.tagName,
          text: e.data.text,
          rect: e.data.rect,
        });
        setEditValue(e.data.text);
      }
    };

    // Inject visual edit listener into iframe
    try {
      const doc = iframe.contentDocument;
      if (doc) {
        const script = doc.createElement('script');
        script.textContent = `
          (function() {
            if (window.__visualEditActive) return;
            window.__visualEditActive = true;
            var hovered = null;
            document.addEventListener('mouseover', function(e) {
              if (hovered) hovered.style.outline = '';
              hovered = e.target;
              hovered.style.outline = '2px solid rgba(6,182,212,0.5)';
              hovered.style.outlineOffset = '2px';
            });
            document.addEventListener('mouseout', function(e) {
              if (hovered) hovered.style.outline = '';
            });
            document.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              var el = e.target;
              // Step 3: Source-mapped visual edits — prefer data-source-file attributes
              var sourceFile = null;
              var sourceLine = null;
              var current = el;
              while (current && current !== document.body) {
                if (current.getAttribute && current.getAttribute('data-source-file')) {
                  sourceFile = current.getAttribute('data-source-file');
                  sourceLine = current.getAttribute('data-source-line');
                  break;
                }
                current = current.parentElement;
              }
              var selector = el.tagName.toLowerCase();
              if (el.id) selector += '#' + el.id;
              if (el.className && typeof el.className === 'string') selector += '.' + el.className.split(' ').join('.');
              window.parent.postMessage({
                type: '__VISUAL_EDIT_SELECT__',
                selector: selector,
                tagName: el.tagName,
                text: el.textContent?.slice(0, 200) || '',
                rect: el.getBoundingClientRect(),
                sourceFile: sourceFile,
                sourceLine: sourceLine ? parseInt(sourceLine, 10) : null,
              }, '*');
            }, true);
          })();
        `;
        doc.body.appendChild(script);
      }
    } catch (e) {
      // Cross-origin restriction
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      // Clean up outline
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          doc.querySelectorAll('*').forEach(el => {
            (el as HTMLElement).style.outline = '';
          });
          (window as any).__visualEditActive = false;
        }
      } catch (e) {}
    };
  }, [isActive, iframeRef]);

  const handleTextSave = () => {
    if (selectedElement && onDirectEdit) {
      onDirectEdit(selectedElement.selector, 'textContent', editValue);
    }
    setEditMode(null);
    setSelectedElement(null);
  };

  const handlePromptSend = () => {
    if (selectedElement && onAIPromptEdit && promptValue.trim()) {
      onAIPromptEdit(selectedElement.selector, selectedElement.text, promptValue.trim());
    }
    setPromptValue('');
    setEditMode(null);
    setSelectedElement(null);
  };

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          "h-7 px-2 rounded-md flex items-center gap-1.5 text-[11px] font-medium transition-all",
          isActive
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            : "text-white/30 hover:text-white/60 hover:bg-white/5"
        )}
      >
        <Pencil className="h-3 w-3" />
        {isActive ? 'Editing' : 'Edit'}
      </button>

      {/* Floating edit toolbar */}
      {isActive && selectedElement && !editMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#0d0d14] border border-white/[0.1] rounded-xl shadow-2xl px-2 py-1.5 flex items-center gap-1">
            <span className="text-[10px] text-white/30 px-1.5 font-mono truncate max-w-[120px]">
              {selectedElement.tagName.toLowerCase()}
            </span>
            <div className="h-4 w-px bg-white/[0.08]" />
            <button
              onClick={() => setEditMode('text')}
              className="h-6 px-2 rounded-md flex items-center gap-1 text-[10px] text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Type className="h-3 w-3" /> Text
            </button>
            <button
              onClick={() => setEditMode('prompt')}
              className="h-6 px-2 rounded-md flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Wand2 className="h-3 w-3" /> AI Edit
            </button>
            <button
              onClick={() => setSelectedElement(null)}
              className="h-6 w-6 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Text edit inline */}
      {editMode === 'text' && selectedElement && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 animate-in fade-in duration-200">
          <div className="bg-[#0d0d14] border border-white/[0.1] rounded-xl shadow-2xl p-3 w-80">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm text-white/80 resize-none outline-none min-h-[60px]"
              autoFocus
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button onClick={() => { setEditMode(null); setSelectedElement(null); }} className="text-[10px] text-white/30 px-2 py-1 rounded hover:bg-white/5">Cancel</button>
              <button onClick={handleTextSave} className="text-[10px] text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20">
                <Check className="h-3 w-3 inline mr-1" />Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI prompt edit */}
      {editMode === 'prompt' && selectedElement && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 animate-in fade-in duration-200">
          <div className="bg-[#0d0d14] border border-white/[0.1] rounded-xl shadow-2xl p-3 w-80">
            <div className="text-[10px] text-white/30 mb-2 truncate">
              Selected: <span className="text-white/50 font-mono">{selectedElement.text.slice(0, 60)}</span>
            </div>
            <input
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder="What do you want to change?"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm text-white/80 outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handlePromptSend(); }}
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button onClick={() => { setEditMode(null); setSelectedElement(null); }} className="text-[10px] text-white/30 px-2 py-1 rounded hover:bg-white/5">Cancel</button>
              <button onClick={handlePromptSend} disabled={!promptValue.trim()} className="text-[10px] text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-30">
                Send to AI
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

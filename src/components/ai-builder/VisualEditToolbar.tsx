import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Type, Palette, MousePointer2, Move, Undo2, Check, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SelectedElement {
  selector: string;
  tagName: string;
  textContent: string;
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
    textAlign: string;
    padding: string;
    margin: string;
    borderRadius: string;
  };
  outerHTML: string;
  rect: { x: number; y: number; width: number; height: number };
}

interface VisualEditToolbarProps {
  active: boolean;
  onToggle: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onEditRequest: (selector: string, elementContext: string, prompt: string) => void;
  onDirectEdit: (selector: string, property: string, value: string) => void;
}

export function VisualEditToolbar({ active, onToggle, iframeRef, onEditRequest, onDirectEdit }: VisualEditToolbarProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [editMode, setEditMode] = useState<'select' | 'text' | 'style' | 'prompt'>('select');
  const [editText, setEditText] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBgColor, setEditBgColor] = useState('');
  const [editFontSize, setEditFontSize] = useState('');
  const [promptText, setPromptText] = useState('');
  const [highlightRect, setHighlightRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Listen for element selection from iframe
  useEffect(() => {
    if (!active) {
      setSelectedElement(null);
      setHighlightRect(null);
      return;
    }

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'visual-edit-hover') {
        setHighlightRect(e.data.rect ? { x: e.data.rect.x, y: e.data.rect.y, w: e.data.rect.width, h: e.data.rect.height } : null);
      }

      if (e.data.type === 'visual-edit-select') {
        setSelectedElement(e.data.element);
        setEditText(e.data.element?.textContent || '');
        setEditColor(e.data.element?.computedStyles?.color || '');
        setEditBgColor(e.data.element?.computedStyles?.backgroundColor || '');
        setEditFontSize(e.data.element?.computedStyles?.fontSize || '');
        setEditMode('select');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [active]);

  // Inject visual edit mode into iframe
  useEffect(() => {
    if (!iframeRef.current) return;

    const script = active ? `
      (function() {
        if (window.__visualEditActive) return;
        window.__visualEditActive = true;

        let hoverOverlay = document.createElement('div');
        hoverOverlay.id = '__ve-overlay';
        hoverOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid #06b6d4;background:rgba(6,182,212,0.08);transition:all 0.1s ease;display:none;border-radius:3px;';
        document.body.appendChild(hoverOverlay);

        let selectedOverlay = document.createElement('div');
        selectedOverlay.id = '__ve-selected';
        selectedOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border:2px solid #f43f5e;background:rgba(244,63,94,0.06);display:none;border-radius:3px;';
        document.body.appendChild(selectedOverlay);

        function getSelector(el) {
          if (el.id) return '#' + el.id;
          let path = [];
          while (el && el.nodeType === 1) {
            let sel = el.tagName.toLowerCase();
            if (el.className && typeof el.className === 'string') {
              sel += '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.');
            }
            path.unshift(sel);
            el = el.parentElement;
            if (path.length > 3) break;
          }
          return path.join(' > ');
        }

        document.addEventListener('mousemove', function(e) {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (!el || el === hoverOverlay || el === selectedOverlay) return;
          const rect = el.getBoundingClientRect();
          hoverOverlay.style.display = 'block';
          hoverOverlay.style.left = rect.left + 'px';
          hoverOverlay.style.top = rect.top + 'px';
          hoverOverlay.style.width = rect.width + 'px';
          hoverOverlay.style.height = rect.height + 'px';
          parent.postMessage({ type: 'visual-edit-hover', rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }, '*');
        });

        document.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (!el || el === hoverOverlay || el === selectedOverlay) return;
          const rect = el.getBoundingClientRect();
          selectedOverlay.style.display = 'block';
          selectedOverlay.style.left = rect.left + 'px';
          selectedOverlay.style.top = rect.top + 'px';
          selectedOverlay.style.width = rect.width + 'px';
          selectedOverlay.style.height = rect.height + 'px';
          const cs = getComputedStyle(el);
          parent.postMessage({
            type: 'visual-edit-select',
            element: {
              selector: getSelector(el),
              tagName: el.tagName.toLowerCase(),
              textContent: el.textContent?.slice(0, 200) || '',
              computedStyles: {
                color: cs.color,
                backgroundColor: cs.backgroundColor,
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                fontFamily: cs.fontFamily,
                textAlign: cs.textAlign,
                padding: cs.padding,
                margin: cs.margin,
                borderRadius: cs.borderRadius,
              },
              outerHTML: el.outerHTML.slice(0, 500),
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            },
          }, '*');
        }, true);
      })();
    ` : `
      (function() {
        window.__visualEditActive = false;
        const overlay = document.getElementById('__ve-overlay');
        const selected = document.getElementById('__ve-selected');
        if (overlay) overlay.remove();
        if (selected) selected.remove();
      })();
    `;

    try {
      iframeRef.current.contentWindow?.postMessage({ type: 'inject-devtools', script }, '*');
    } catch (e) {}
  }, [active, iframeRef]);

  const applyTextEdit = useCallback(() => {
    if (!selectedElement) return;
    onDirectEdit(selectedElement.selector, 'text', editText);
    toast.success('Text updated');
  }, [selectedElement, editText, onDirectEdit]);

  const applyColorEdit = useCallback(() => {
    if (!selectedElement) return;
    onDirectEdit(selectedElement.selector, 'color', editColor);
    toast.success('Color updated');
  }, [selectedElement, editColor, onDirectEdit]);

  const applyPrompt = useCallback(() => {
    if (!selectedElement || !promptText.trim()) return;
    onEditRequest(selectedElement.selector, selectedElement.outerHTML, promptText);
    setPromptText('');
    toast.success('Edit request sent to AI');
  }, [selectedElement, promptText, onEditRequest]);

  if (!active) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Floating toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-0.5 mr-2">
          <MousePointer2 className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium text-white/70">Visual Edit</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {!selectedElement ? (
          <span className="text-[10px] text-white/30 px-2">Click an element to select it</span>
        ) : (
          <>
            <button
              onClick={() => setEditMode('text')}
              className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-colors", editMode === 'text' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="Edit text"
            >
              <Type className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setEditMode('style')}
              className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-colors", editMode === 'style' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="Edit styles"
            >
              <Palette className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setEditMode('prompt')}
              className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-colors", editMode === 'prompt' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="AI prompt"
            >
              <Move className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-white/10" />
            <span className="text-[9px] text-white/25 font-mono">&lt;{selectedElement.tagName}&gt;</span>
          </>
        )}

        <div className="h-4 w-px bg-white/10" />
        <button onClick={onToggle} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Exit Visual Edit">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Edit panel */}
      {selectedElement && editMode === 'text' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl max-w-md w-full">
          <input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="flex-1 h-7 px-2 text-[12px] bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/20 outline-none focus:border-cyan-500/40"
            placeholder="New text..."
            onKeyDown={e => e.key === 'Enter' && applyTextEdit()}
          />
          <button onClick={applyTextEdit} className="h-7 px-3 rounded-lg bg-cyan-500/20 text-cyan-400 text-[11px] font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-1">
            <Check className="h-3 w-3" /> Apply
          </button>
        </div>
      )}

      {selectedElement && editMode === 'style' && (
        <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl w-72">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/40 w-16 shrink-0">Color</label>
            <input type="color" value={editColor.startsWith('#') ? editColor : '#ffffff'} onChange={e => setEditColor(e.target.value)} className="h-6 w-8 rounded border-0 bg-transparent cursor-pointer" />
            <input value={editColor} onChange={e => setEditColor(e.target.value)} className="flex-1 h-6 px-2 text-[11px] bg-white/[0.06] border border-white/[0.08] rounded text-white/70 font-mono outline-none" />
            <button onClick={applyColorEdit} className="h-6 w-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30 transition-colors">
              <Check className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/40 w-16 shrink-0">BG</label>
            <input type="color" value={editBgColor.startsWith('#') ? editBgColor : '#000000'} onChange={e => setEditBgColor(e.target.value)} className="h-6 w-8 rounded border-0 bg-transparent cursor-pointer" />
            <input value={editBgColor} onChange={e => setEditBgColor(e.target.value)} className="flex-1 h-6 px-2 text-[11px] bg-white/[0.06] border border-white/[0.08] rounded text-white/70 font-mono outline-none" />
            <button onClick={() => { if (selectedElement) onDirectEdit(selectedElement.selector, 'backgroundColor', editBgColor); toast.success('BG updated'); }} className="h-6 w-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30 transition-colors">
              <Check className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/40 w-16 shrink-0">Font size</label>
            <input value={editFontSize} onChange={e => setEditFontSize(e.target.value)} className="flex-1 h-6 px-2 text-[11px] bg-white/[0.06] border border-white/[0.08] rounded text-white/70 font-mono outline-none" placeholder="16px" />
            <button onClick={() => { if (selectedElement) onDirectEdit(selectedElement.selector, 'fontSize', editFontSize); toast.success('Font size updated'); }} className="h-6 w-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30 transition-colors">
              <Check className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {selectedElement && editMode === 'prompt' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl max-w-lg w-full">
          <input
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            className="flex-1 h-7 px-2 text-[12px] bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/40"
            placeholder="Describe the change you want..."
            onKeyDown={e => e.key === 'Enter' && applyPrompt()}
          />
          <button onClick={applyPrompt} className="h-7 px-3 rounded-lg bg-violet-500/20 text-violet-400 text-[11px] font-medium hover:bg-violet-500/30 transition-colors flex items-center gap-1">
            AI Edit
          </button>
        </div>
      )}
    </div>
  );
}

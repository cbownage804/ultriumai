import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Type, Palette, MousePointer2, Move, Check, ImagePlus, Paperclip, Code2 } from 'lucide-react';
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
  /** Wave 9 Step 2: Navigate to source code for selected element */
  onViewSource?: (selector: string, textContent: string, tagName: string) => void;
}

export function VisualEditToolbar({ active, onToggle, iframeRef, onEditRequest, onDirectEdit, onViewSource }: VisualEditToolbarProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [editMode, setEditMode] = useState<'select' | 'text' | 'style' | 'image' | 'prompt'>('select');
  const [editText, setEditText] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBgColor, setEditBgColor] = useState('');
  const [editFontSize, setEditFontSize] = useState('');
  const [promptText, setPromptText] = useState('');
  const [highlightRect, setHighlightRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [promptImagePreview, setPromptImagePreview] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const promptImgInputRef = useRef<HTMLInputElement>(null);

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

  // Handle image upload for replacing selected element
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Replace the selected element with an <img> tag using the data URL
      onDirectEdit(selectedElement.selector, 'replaceWithImage', dataUrl);
      toast.success('Element replaced with image');
    };
    reader.readAsDataURL(file);
    // Reset input
    if (imgInputRef.current) imgInputRef.current.value = '';
  }, [selectedElement, onDirectEdit]);

  // Handle image attachment for AI Edit prompt
  const handlePromptImageAttach = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPromptImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (promptImgInputRef.current) promptImgInputRef.current.value = '';
  }, []);

  const applyPrompt = useCallback(() => {
    if (!selectedElement || !promptText.trim()) return;
    // If an image is attached, include it in the prompt context
    const fullPrompt = promptImagePreview
      ? `${promptText}\n\n[ATTACHED IMAGE DATA URL — use this as the image source]: ${promptImagePreview}`
      : promptText;
    onEditRequest(selectedElement.selector, selectedElement.outerHTML, fullPrompt);
    setPromptText('');
    setPromptImagePreview(null);
    toast.success('Edit request sent to AI');
  }, [selectedElement, promptText, promptImagePreview, onEditRequest]);

  if (!active) return null;

  // Hidden file inputs
  const fileInputs = (
    <>
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={promptImgInputRef} type="file" accept="image/*" className="hidden" onChange={handlePromptImageAttach} />
    </>
  );

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {fileInputs}

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
            {/* Img button — replace element with image */}
            <button
              onClick={() => setEditMode('image')}
              className={cn("h-7 px-2 rounded-lg flex items-center gap-1 transition-colors text-[10px] font-medium", editMode === 'image' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="Replace with image"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Img</span>
            </button>
            {/* Text button */}
            <button
              onClick={() => setEditMode('text')}
              className={cn("h-7 px-2 rounded-lg flex items-center gap-1 transition-colors text-[10px] font-medium", editMode === 'text' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="Edit text"
            >
              <Type className="h-3.5 w-3.5" />
              <span>Text</span>
            </button>
            {/* Color button */}
            <button
              onClick={() => setEditMode('style')}
              className={cn("h-7 px-2 rounded-lg flex items-center gap-1 transition-colors text-[10px] font-medium", editMode === 'style' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="Edit styles"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Color</span>
            </button>
            {/* AI Edit button */}
            <button
              onClick={() => setEditMode('prompt')}
              className={cn("h-7 px-2 rounded-lg flex items-center gap-1 transition-colors text-[10px] font-medium", editMode === 'prompt' ? 'bg-violet-500/20 text-violet-400' : 'text-white/40 hover:text-white/70 hover:bg-white/10')}
              title="AI prompt"
            >
              <Move className="h-3.5 w-3.5" />
              <span>AI Edit</span>
            </button>

            {/* Wave 9 Step 2: View Source button */}
            {onViewSource && (
              <button
                onClick={() => onViewSource(selectedElement.selector, selectedElement.textContent, selectedElement.tagName)}
                className="h-7 px-2 rounded-lg flex items-center gap-1 transition-colors text-[10px] font-medium text-white/40 hover:text-white/70 hover:bg-white/10"
                title="Jump to source code"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Source</span>
              </button>
            )}

            <div className="h-4 w-px bg-white/10" />
            <span className="text-[9px] text-white/25 font-mono">&lt;{selectedElement.tagName}&gt;</span>
          </>
        )}

        <div className="h-4 w-px bg-white/10" />
        <button onClick={onToggle} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Exit Visual Edit">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Image replacement panel */}
      {selectedElement && editMode === 'image' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl max-w-md w-full">
          <button
            onClick={() => imgInputRef.current?.click()}
            className="flex-1 h-8 rounded-lg border-2 border-dashed border-white/10 hover:border-emerald-500/30 text-[11px] text-white/40 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Choose image to replace this element
          </button>
        </div>
      )}

      {/* Text edit panel */}
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

      {/* Style edit panel */}
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

      {/* AI Edit prompt panel — with image attachment */}
      {selectedElement && editMode === 'prompt' && (
        <div className="flex flex-col gap-2 px-3 py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl max-w-lg w-full">
          {/* Attached image preview */}
          {promptImagePreview && (
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <img src={promptImagePreview} alt="Attached" className="h-8 w-8 rounded object-cover" />
              <span className="text-[10px] text-white/40 flex-1">Image attached</span>
              <button
                onClick={() => setPromptImagePreview(null)}
                className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Attach image button */}
            <button
              onClick={() => promptImgInputRef.current?.click()}
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
                promptImagePreview
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-white/30 hover:text-white/60 hover:bg-white/10"
              )}
              title="Attach image for context"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
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
        </div>
      )}
    </div>
  );
}

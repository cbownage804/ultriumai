import { useState, useCallback, useRef, useEffect } from 'react';
import { Crosshair, Type, Palette, X, Check, Sparkles, Send, Loader2, Pipette, Paperclip, ImagePlus, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChromePicker } from 'react-color';

interface VisualEditOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  onEditApply: (selector: string, property: string, value: string, meta?: { tagName: string; text: string }) => void;
  onAIEditRequest?: (selector: string, elementContext: string, prompt: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isProcessingAIEdit?: boolean;
}

export function VisualEditOverlay({ isActive, onToggle, onEditApply, onAIEditRequest, iframeRef, isProcessingAIEdit }: VisualEditOverlayProps) {
  const [selectedElement, setSelectedElement] = useState<{
    tagName: string;
    text: string;
    selector: string;
    rect: DOMRect;
    outerHTML: string;
    parentHTML: string;
  } | null>(null);
  const [editMode, setEditMode] = useState<'text' | 'color' | 'ai' | 'resize' | null>(null);
  const [resizeW, setResizeW] = useState('');
  const [resizeH, setResizeH] = useState('');
  const [editValue, setEditValue] = useState('');
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiImagePreview, setAIImagePreview] = useState<string | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const aiImgInputRef = useRef<HTMLInputElement>(null);
  const imgReplaceInputRef = useRef<HTMLInputElement>(null);
  const selectedOverlayRef = useRef<HTMLDivElement | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);
  const [iframeBounds, setIframeBounds] = useState<DOMRect | null>(null);

  const getCompactElementContext = useCallback((el: HTMLElement) => {
    const textNodes = Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent?.trim() || '')
      .filter(Boolean)
      .join(' ')
      .slice(0, 200);

    const childTags = Array.from(el.children)
      .slice(0, 8)
      .map(child => child.tagName.toLowerCase())
      .join(', ');

    const attrSummary = Array.from(el.attributes)
      .filter(attr => !attr.name.startsWith('style') && !attr.name.startsWith('data-'))
      .slice(0, 8)
      .map(attr => `${attr.name}="${attr.value.slice(0, 80)}"`)
      .join(' ');

    return [
      `<${el.tagName.toLowerCase()}${attrSummary ? ` ${attrSummary}` : ''}>`,
      textNodes ? `text: ${textNodes}` : '',
      childTags ? `children: ${childTags}` : '',
    ].filter(Boolean).join('\n');
  }, []);

  const getSafeElementText = useCallback((el: HTMLElement) => {
    const attrText = [
      el.getAttribute('aria-label'),
      el.getAttribute('title'),
      el.getAttribute('alt'),
      el.getAttribute('placeholder'),
    ].find((value): value is string => !!value?.trim());

    if (attrText) return attrText.trim().slice(0, 120);

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return (el.value || el.placeholder || '').trim().slice(0, 120);
    }

    const directText = Array.from(el.childNodes)
      .filter((node): node is Text => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter(Boolean)
      .join(' ')
      .trim();

    return directText.slice(0, 120);
  }, []);

  const updateIframeBounds = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      setIframeBounds(null);
      return;
    }

    const rect = iframe.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      setIframeBounds(null);
      return;
    }

    setIframeBounds(new DOMRect(rect.x, rect.y, rect.width, rect.height));
  }, [iframeRef]);

  const resolveEditableTarget = useCallback((target: EventTarget | null, selectedOverlay?: HTMLDivElement | null) => {
    const el = target instanceof HTMLElement ? target : null;
    if (!el) return null;
    if (selectedOverlay && el === selectedOverlay) return null;

    const ownerDoc = el.ownerDocument;
    if (!ownerDoc) return null;
    if (el === ownerDoc.documentElement || el === ownerDoc.body) return null;

    return el;
  }, []);

  const updateOverlay = useCallback((overlay: HTMLDivElement | null, el: HTMLElement | null, iframeDoc?: Document | null) => {
    const doc = iframeDoc || iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
    if (!overlay || !el || !doc?.contains(el)) {
      if (overlay) overlay.style.display = 'none';
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }, [iframeRef]);

  const selectEditableElement = useCallback((el: HTMLElement) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const overlayTarget = resolveEditableTarget(el, selectedOverlayRef.current);
    if (!overlayTarget) return;

    const safeText = getSafeElementText(overlayTarget);
    const selector = buildSelector(overlayTarget);
    const iframeRect = iframe.getBoundingClientRect();
    const elRect = overlayTarget.getBoundingClientRect();

    selectedElRef.current = overlayTarget;
    updateOverlay(selectedOverlayRef.current, overlayTarget, iframeDoc);

    setSelectedElement({
      tagName: overlayTarget.tagName.toLowerCase(),
      text: safeText.slice(0, 50),
      selector,
      rect: new DOMRect(
        elRect.x + iframeRect.x,
        elRect.y + iframeRect.y,
        elRect.width,
        elRect.height,
      ),
      outerHTML: getCompactElementContext(overlayTarget),
      parentHTML: overlayTarget.parentElement ? getCompactElementContext(overlayTarget.parentElement) : '',
    });
    setEditValue(safeText);
    setAIPrompt('');
    setEditMode(null);
  }, [getCompactElementContext, getSafeElementText, iframeRef, resolveEditableTarget, updateOverlay]);

  const handleAIImageAttach = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setAIImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    if (aiImgInputRef.current) aiImgInputRef.current.value = '';
  }, []);

  const handleImgReplace = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onEditApply(selectedElement.selector, 'replaceWithImage', dataUrl);
      setEditMode(null);
      setSelectedElement(null);
    };
    reader.readAsDataURL(file);
    if (imgReplaceInputRef.current) imgReplaceInputRef.current.value = '';
  }, [selectedElement, onEditApply]);

  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const style = iframeDoc.createElement('style');
    style.id = '__visual-edit-styles__';
    style.textContent = `
      html, body { cursor: crosshair !important; }
      #__ve-selected-overlay {
        position: fixed;
        pointer-events: none;
        z-index: 2147483646;
        display: none;
        border-radius: 4px;
        box-sizing: border-box;
      }
      #__ve-selected-overlay {
        border: 2px solid rgba(6, 182, 212, 0.85);
        background: rgba(6, 182, 212, 0.12);
      }
    `;
    iframeDoc.head.appendChild(style);

    const selectedOverlay = iframeDoc.createElement('div');
    selectedOverlay.id = '__ve-selected-overlay';
    iframeDoc.body.appendChild(selectedOverlay);
    selectedOverlayRef.current = selectedOverlay;

    const onScrollOrResize = () => {
      updateIframeBounds();
      updateOverlay(selectedOverlayRef.current, selectedElRef.current, iframeDoc);
    };

    updateIframeBounds();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    iframe.contentWindow?.addEventListener('scroll', onScrollOrResize, true);
    iframe.contentWindow?.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      iframe.contentWindow?.removeEventListener('scroll', onScrollOrResize, true);
      iframe.contentWindow?.removeEventListener('resize', onScrollOrResize);
      iframeDoc.getElementById('__visual-edit-styles__')?.remove();
      selectedOverlayRef.current?.remove();
      selectedOverlayRef.current = null;
      selectedElRef.current = null;
      setIframeBounds(null);
    };
  }, [iframeRef, isActive, updateIframeBounds, updateOverlay]);

  const applyEdit = useCallback(() => {
    if (!selectedElement || !editMode) return;

    if (editMode === 'ai') {
      if (!aiPrompt.trim() || !onAIEditRequest) return;
      const fullPrompt = aiImagePreview
        ? `${aiPrompt}\n\n[ATTACHED IMAGE DATA URL — use this as the image source]: ${aiImagePreview}`
        : aiPrompt;
      onAIEditRequest(selectedElement.selector, selectedElement.outerHTML, fullPrompt);
      setEditMode(null);
      setSelectedElement(null);
      setAIImagePreview(null);
      return;
    }

    if (editMode === 'resize') {
      const w = resizeW.trim();
      const h = resizeH.trim();
      if (!w && !h) return;
      const style = `${w ? `width:${w}px;` : ''}${h ? `height:${h}px;` : ''}object-fit:contain;`;
      // Apply to iframe
      const iframe = iframeRef.current;
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (iframeDoc) {
        const el = iframeDoc.querySelector(selectedElement.selector) as HTMLElement;
        if (el) {
          if (w) el.style.width = `${w}px`;
          if (h) el.style.height = `${h}px`;
          el.style.objectFit = 'contain';
        }
      }
      onEditApply(selectedElement.selector, 'resize', `${w}x${h}`);
      setEditMode(null);
      setSelectedElement(null);
      return;
    }

    if (!editValue) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDoc) return;

    const el = iframeDoc.querySelector(selectedElement.selector) as HTMLElement;
    if (!el) return;

    if (editMode === 'text') {
      el.textContent = editValue;
    } else if (editMode === 'color') {
      el.style.color = editValue;
    }

    onEditApply(selectedElement.selector, editMode, editValue, { tagName: selectedElement.tagName, text: selectedElement.text });
    setEditMode(null);
    setSelectedElement(null);
  }, [selectedElement, editMode, editValue, aiPrompt, aiImagePreview, resizeW, resizeH, iframeRef, onEditApply, onAIEditRequest]);

  // Focus AI input when mode switches
  useEffect(() => {
    if (editMode === 'ai') {
      setTimeout(() => aiInputRef.current?.focus(), 50);
    }
  }, [editMode]);

  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className="h-7 px-2 rounded-md flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors border border-white/[0.06]"
        title="Visual Edit Mode"
      >
        <Crosshair className="h-3 w-3" />
        <span className="hidden md:inline">Edit</span>
      </button>
    );
  }

  return (
    <>
      {/* Active indicator */}
      <button
        onClick={onToggle}
        className="h-7 px-2 rounded-md flex items-center gap-1.5 text-[11px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 transition-colors"
      >
        <Crosshair className="h-3 w-3 animate-pulse" />
        <span>Editing</span>
        <X className="h-2.5 w-2.5" />
      </button>

      {iframeBounds && (
        <div
          className="fixed z-40"
          style={{
            top: iframeBounds.top,
            left: iframeBounds.left,
            width: iframeBounds.width,
            height: iframeBounds.height,
            cursor: 'crosshair',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const iframe = iframeRef.current;
            const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
            if (!iframe || !iframeDoc || !iframeBounds) return;

            const x = e.clientX - iframeBounds.left;
            const y = e.clientY - iframeBounds.top;
            const target = iframeDoc.elementFromPoint(x, y);
            if (!(target instanceof HTMLElement)) return;

            selectEditableElement(target);
          }}
        />
      )}

      {/* Edit toolbar for selected element */}
      {selectedElement && !editMode && (
        <div
          className="fixed z-50 flex items-center gap-1 p-1 rounded-lg bg-[#0d0d14] border border-white/[0.08] shadow-xl shadow-black/50"
          style={{
            top: Math.min(selectedElement.rect.bottom + 8, window.innerHeight - 50),
            left: Math.max(8, Math.min(selectedElement.rect.left, window.innerWidth - 280)),
          }}
        >
          <input ref={imgReplaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgReplace} />
          <span className="text-[9px] text-white/30 px-1.5 font-mono">{selectedElement.tagName}</span>
          <div className="h-3 w-px bg-white/[0.06]" />
          <button
            onClick={() => imgReplaceInputRef.current?.click()}
            className="h-6 px-2 rounded flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 hover:bg-white/5"
          >
            <ImagePlus className="h-2.5 w-2.5" /> Img
          </button>
          <button
            onClick={() => setEditMode('text')}
            className="h-6 px-2 rounded flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 hover:bg-white/5"
          >
            <Type className="h-2.5 w-2.5" /> Text
          </button>
          <button
            onClick={() => { setEditMode('color'); setEditValue('#'); }}
            className="h-6 px-2 rounded flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 hover:bg-white/5"
          >
            <Palette className="h-2.5 w-2.5" /> Color
          </button>
          {selectedElement.tagName === 'IMG' && (
            <button
              onClick={() => {
                setEditMode('resize');
                // Pre-fill with current dimensions
                const iframe = iframeRef.current;
                const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
                if (iframeDoc) {
                  const el = iframeDoc.querySelector(selectedElement.selector) as HTMLImageElement;
                  if (el) {
                    setResizeW(String(el.offsetWidth));
                    setResizeH(String(el.offsetHeight));
                  }
                }
              }}
              className="h-6 px-2 rounded flex items-center gap-1 text-[10px] text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-500/10"
            >
              <Maximize2 className="h-2.5 w-2.5" /> Resize
            </button>
          )}
          <div className="h-3 w-px bg-white/[0.06]" />
          <button
            onClick={() => setEditMode('ai')}
            className="h-6 px-2 rounded flex items-center gap-1 text-[10px] text-violet-400/80 hover:text-violet-400 hover:bg-violet-500/10"
          >
            <Sparkles className="h-2.5 w-2.5" /> AI Edit
          </button>
        </div>
      )}

      {/* Resize editor for images */}
      {selectedElement && editMode === 'resize' && (
        <div
          className="fixed z-50 flex items-center gap-1.5 p-2 rounded-lg bg-[#0d0d14] border border-cyan-500/30 shadow-xl shadow-black/50"
          style={{
            top: Math.min(selectedElement.rect.bottom + 8, window.innerHeight - 50),
            left: Math.max(8, Math.min(selectedElement.rect.left, window.innerWidth - 320)),
          }}
        >
          <Maximize2 className="h-3 w-3 text-cyan-400/60 shrink-0" />
          <div className="flex items-center gap-1">
            <input
              value={resizeW}
              onChange={e => setResizeW(e.target.value.replace(/\D/g, ''))}
              placeholder="W"
              className="h-6 w-14 px-1.5 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 text-center font-mono"
              autoFocus
            />
            <span className="text-[9px] text-white/20">×</span>
            <input
              value={resizeH}
              onChange={e => setResizeH(e.target.value.replace(/\D/g, ''))}
              placeholder="H"
              onKeyDown={e => e.key === 'Enter' && applyEdit()}
              className="h-6 w-14 px-1.5 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 text-center font-mono"
            />
            <span className="text-[8px] text-white/20">px</span>
          </div>
          <button onClick={applyEdit} className="h-6 w-6 rounded flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10">
            <Check className="h-3 w-3" />
          </button>
          <button onClick={() => { setEditMode(null); setSelectedElement(null); }} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Inline editor for text */}
      {selectedElement && editMode === 'text' && (
        <div
          className="fixed z-50 flex items-center gap-1 p-1 rounded-lg bg-[#0d0d14] border border-cyan-500/30 shadow-xl shadow-black/50"
          style={{
            top: Math.min(selectedElement.rect.bottom + 8, window.innerHeight - 50),
            left: Math.max(8, Math.min(selectedElement.rect.left, window.innerWidth - 220)),
          }}
        >
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyEdit()}
            className="h-6 w-40 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30"
            autoFocus
          />
          <button onClick={applyEdit} className="h-6 w-6 rounded flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10">
            <Check className="h-3 w-3" />
          </button>
          <button onClick={() => { setEditMode(null); setSelectedElement(null); }} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Color picker with wheel and hex input */}
      {selectedElement && editMode === 'color' && (
        <div
          className="fixed z-50 rounded-xl bg-[#0d0d14] border border-cyan-500/30 shadow-2xl shadow-black/60 overflow-hidden"
          style={{
            top: Math.min(selectedElement.rect.bottom + 8, window.innerHeight - 340),
            left: Math.max(8, Math.min(selectedElement.rect.left, window.innerWidth - 260)),
          }}
        >
          {/* Color wheel */}
          <div className="[&_.chrome-picker]:!bg-[#0d0d14]! [&_.chrome-picker]:!shadow-none!">
            <ChromePicker
              color={editValue || '#ffffff'}
              onChange={(color: any) => setEditValue(color.hex)}
              onChangeComplete={(color: any) => setEditValue(color.hex)}
              disableAlpha
              styles={{
                default: {
                  picker: { background: '#0d0d14', boxShadow: 'none', border: 'none', width: '240px' } as any,
                  body: { padding: '12px' } as any,
                  saturation: { borderRadius: '8px' } as any,
                  hue: { borderRadius: '4px' } as any,
                },
              }}
            />
          </div>

          {/* Hex input + preview */}
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
            <div className="h-6 w-6 rounded-md border border-white/10 shrink-0" style={{ backgroundColor: editValue || '#ffffff' }} />
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyEdit()}
              placeholder="#000000"
              className="flex-1 h-6 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 font-mono"
            />
            <button onClick={applyEdit} className="h-6 w-6 rounded flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10">
              <Check className="h-3 w-3" />
            </button>
            <button onClick={() => { setEditMode(null); setSelectedElement(null); }} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* AI prompt input */}
      {selectedElement && editMode === 'ai' && (
        <div
          className="fixed z-50 flex flex-col gap-1.5 p-2 rounded-lg bg-[#0d0d14] border border-violet-500/30 shadow-xl shadow-black/50 w-72"
          style={{
            top: Math.min(selectedElement.rect.bottom + 8, window.innerHeight - 100),
            left: Math.max(8, Math.min(selectedElement.rect.left, window.innerWidth - 300)),
          }}
        >
          <input ref={aiImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleAIImageAttach} />
          <div className="flex items-center gap-1.5 text-[9px] text-violet-400/60">
            <Sparkles className="h-2.5 w-2.5" />
            <span>Describe what you want to change</span>
          </div>
          {aiImagePreview && (
            <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.04] border border-white/[0.06]">
              <img src={aiImagePreview} alt="Attached" className="h-7 w-7 rounded object-cover" />
              <span className="text-[9px] text-white/40 flex-1 truncate">Image attached</span>
              <button onClick={() => setAIImagePreview(null)} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-red-400">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => aiImgInputRef.current?.click()}
              className={cn(
                "h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0",
                aiImagePreview ? "text-emerald-400 bg-emerald-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
              )}
              title="Attach image"
            >
              <Paperclip className="h-3 w-3" />
            </button>
            <input
              ref={aiInputRef}
              value={aiPrompt}
              onChange={e => setAIPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && applyEdit()}
              placeholder="e.g. make this button bigger and blue"
              className="flex-1 h-7 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-violet-500/30 placeholder:text-white/20"
              disabled={isProcessingAIEdit}
            />
            <button
              onClick={applyEdit}
              disabled={!aiPrompt.trim() || isProcessingAIEdit}
              className="h-7 w-7 rounded flex items-center justify-center text-violet-400 hover:bg-violet-500/10 disabled:opacity-30 disabled:pointer-events-none"
            >
              {isProcessingAIEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </button>
            <button onClick={() => { setEditMode(null); setSelectedElement(null); setAIImagePreview(null); }} className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function buildSelector(el: HTMLElement): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const directStableSelector = getStableElementSelector(el);
  if (directStableSelector) return directStableSelector;

  const segments: string[] = [];
  let current: HTMLElement | null = el;
  let depth = 0;

  while (current && depth < 5) {
    if (current.id) {
      segments.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const stableSelector = getStableElementSelector(current);
    if (stableSelector && current !== el) {
      segments.unshift(stableSelector);
      break;
    }

    const tagName = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (!parent) {
      segments.unshift(tagName);
      break;
    }

    const sameTagSiblings = Array.from(parent.children).filter(
      child => child.tagName === current?.tagName,
    );
    const siblingIndex = sameTagSiblings.indexOf(current);
    segments.unshift(
      sameTagSiblings.length > 1 ? `${tagName}:nth-of-type(${siblingIndex + 1})` : tagName,
    );

    current = parent;
    depth += 1;
  }

  return segments.join(' > ') || el.tagName.toLowerCase();
}

function getStableElementSelector(el: HTMLElement): string | null {
  const attrCandidates: Array<[string, string | null]> = [
    ['data-testid', el.getAttribute('data-testid')],
    ['data-test', el.getAttribute('data-test')],
    ['data-cy', el.getAttribute('data-cy')],
    ['name', el.getAttribute('name')],
    ['aria-label', el.getAttribute('aria-label')],
    ['role', el.getAttribute('role')],
  ];

  for (const [attr, value] of attrCandidates) {
    if (value && value.trim()) {
      return `${el.tagName.toLowerCase()}[${attr}="${cssEscape(value.trim())}"]`;
    }
  }

  const classList = Array.from(el.classList)
    .filter(token => token && token.length < 40 && !/^(__|hover|active|selected|focus|group|peer)/.test(token))
    .slice(0, 2);

  if (classList.length > 0) {
    return `${el.tagName.toLowerCase()}.${classList.map(cssEscape).join('.')}`;
  }

  return null;
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }

  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s])/g, '\\$1');
}

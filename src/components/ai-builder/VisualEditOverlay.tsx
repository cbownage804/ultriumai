import { useState, useCallback, useRef, useEffect } from 'react';
import { Crosshair, Type, Palette, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisualEditOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  onEditApply: (selector: string, property: string, value: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function VisualEditOverlay({ isActive, onToggle, onEditApply, iframeRef }: VisualEditOverlayProps) {
  const [selectedElement, setSelectedElement] = useState<{
    tagName: string;
    text: string;
    selector: string;
    rect: DOMRect;
  } | null>(null);
  const [editMode, setEditMode] = useState<'text' | 'color' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Inject selection styles
    const style = iframeDoc.createElement('style');
    style.id = '__visual-edit-styles__';
    style.textContent = `
      .__ve-hover { outline: 2px dashed rgba(6, 182, 212, 0.5) !important; outline-offset: 2px; cursor: crosshair !important; }
      .__ve-selected { outline: 2px solid rgba(6, 182, 212, 0.8) !important; outline-offset: 2px; }
    `;
    iframeDoc.head.appendChild(style);

    let hoveredEl: HTMLElement | null = null;

    const onMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el === hoveredEl) return;
      hoveredEl?.classList.remove('__ve-hover');
      hoveredEl = el;
      el.classList.add('__ve-hover');
    };

    const onMouseOut = (e: MouseEvent) => {
      (e.target as HTMLElement).classList.remove('__ve-hover');
    };

    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.target as HTMLElement;
      
      // Remove previous selection
      iframeDoc.querySelectorAll('.__ve-selected').forEach(sel => sel.classList.remove('__ve-selected'));
      el.classList.add('__ve-selected');

      // Build a simple CSS selector
      const selector = buildSelector(el);
      const iframeRect = iframe.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      
      setSelectedElement({
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.slice(0, 50) || '',
        selector,
        rect: new DOMRect(
          elRect.x + iframeRect.x,
          elRect.y + iframeRect.y,
          elRect.width,
          elRect.height
        ),
      });
      setEditValue(el.textContent || '');
    };

    iframeDoc.addEventListener('mouseover', onMouseOver, true);
    iframeDoc.addEventListener('mouseout', onMouseOut, true);
    iframeDoc.addEventListener('click', onClick, true);

    return () => {
      iframeDoc.removeEventListener('mouseover', onMouseOver, true);
      iframeDoc.removeEventListener('mouseout', onMouseOut, true);
      iframeDoc.removeEventListener('click', onClick, true);
      iframeDoc.getElementById('__visual-edit-styles__')?.remove();
      iframeDoc.querySelectorAll('.__ve-hover, .__ve-selected').forEach(el => {
        el.classList.remove('__ve-hover', '__ve-selected');
      });
    };
  }, [isActive, iframeRef]);

  const applyEdit = useCallback(() => {
    if (!selectedElement || !editMode || !editValue) return;

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

    onEditApply(selectedElement.selector, editMode, editValue);
    setEditMode(null);
    setSelectedElement(null);
  }, [selectedElement, editMode, editValue, iframeRef, onEditApply]);

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

      {/* Edit toolbar for selected element */}
      {selectedElement && !editMode && (
        <div
          className="fixed z-50 flex items-center gap-1 p-1 rounded-lg bg-[#0d0d14] border border-white/[0.08] shadow-xl shadow-black/50"
          style={{
            top: selectedElement.rect.bottom + 8,
            left: selectedElement.rect.left,
          }}
        >
          <span className="text-[9px] text-white/30 px-1.5 font-mono">{selectedElement.tagName}</span>
          <div className="h-3 w-px bg-white/[0.06]" />
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
        </div>
      )}

      {/* Inline editor */}
      {selectedElement && editMode && (
        <div
          className="fixed z-50 flex items-center gap-1 p-1 rounded-lg bg-[#0d0d14] border border-cyan-500/30 shadow-xl shadow-black/50"
          style={{
            top: selectedElement.rect.bottom + 8,
            left: selectedElement.rect.left,
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
    </>
  );
}

function buildSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  const parent = el.parentElement;
  if (!parent) return el.tagName.toLowerCase();
  const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
  const index = siblings.indexOf(el);
  const parentSelector = buildSelector(parent);
  return `${parentSelector} > ${el.tagName.toLowerCase()}${siblings.length > 1 ? `:nth-child(${index + 1})` : ''}`;
}

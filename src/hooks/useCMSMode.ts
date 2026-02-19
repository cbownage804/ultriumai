import { useState, useCallback } from 'react';

export interface CMSBlock {
  id: string;
  type: 'text' | 'image' | 'heading' | 'richtext' | 'list';
  selector: string;
  content: string;
  page: string;
  lastEdited?: Date;
}

export function useCMSMode() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [blocks, setBlocks] = useState<CMSBlock[]>([]);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);

  const toggleCMS = useCallback(() => setIsEnabled(prev => !prev), []);

  const detectBlocks = useCallback((html: string, page: string): CMSBlock[] => {
    const detected: CMSBlock[] = [];
    const textMatches = html.matchAll(/<(h[1-6]|p|span|a|button|label|li)([^>]*)>([^<]+)<\/\1>/g);
    let idx = 0;
    for (const m of textMatches) {
      const tag = m[1];
      const content = m[3].trim();
      if (content.length < 2 || content.length > 500) continue;
      detected.push({
        id: crypto.randomUUID(),
        type: /^h[1-6]$/.test(tag) ? 'heading' : 'text',
        selector: `${tag}:nth-of-type(${++idx})`,
        content,
        page,
      });
    }
    const imgMatches = html.matchAll(/<img([^>]*?)src="([^"]+)"([^>]*?)>/g);
    for (const m of imgMatches) {
      detected.push({
        id: crypto.randomUUID(),
        type: 'image',
        selector: `img[src="${m[2]}"]`,
        content: m[2],
        page,
      });
    }
    setBlocks(detected);
    return detected;
  }, []);

  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content, lastEdited: new Date() } : b));
  }, []);

  const exportContent = useCallback(() => {
    return JSON.stringify(blocks.map(b => ({ id: b.id, type: b.type, selector: b.selector, content: b.content, page: b.page })), null, 2);
  }, [blocks]);

  return { isEnabled, blocks, editingBlock, toggleCMS, detectBlocks, updateBlock, setEditingBlock, exportContent };
}

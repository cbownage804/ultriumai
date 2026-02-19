import { useState, useCallback } from 'react';

export interface TipTapExtension {
  id: string;
  name: string;
  package: string;
  enabled: boolean;
  category: 'formatting' | 'block' | 'inline' | 'table' | 'media' | 'task';
}

const DEFAULT_EXTENSIONS: TipTapExtension[] = [
  { id: 'starterKit', name: 'Starter Kit', package: '@tiptap/starter-kit', enabled: true, category: 'formatting' },
  { id: 'link', name: 'Link', package: '@tiptap/extension-link', enabled: false, category: 'inline' },
  { id: 'image', name: 'Image', package: '@tiptap/extension-image', enabled: false, category: 'media' },
  { id: 'table', name: 'Table', package: '@tiptap/extension-table', enabled: false, category: 'table' },
  { id: 'tableRow', name: 'Table Row', package: '@tiptap/extension-table-row', enabled: false, category: 'table' },
  { id: 'tableCell', name: 'Table Cell', package: '@tiptap/extension-table-cell', enabled: false, category: 'table' },
  { id: 'tableHeader', name: 'Table Header', package: '@tiptap/extension-table-header', enabled: false, category: 'table' },
  { id: 'taskList', name: 'Task List', package: '@tiptap/extension-task-list', enabled: false, category: 'task' },
  { id: 'taskItem', name: 'Task Item', package: '@tiptap/extension-task-item', enabled: false, category: 'task' },
  { id: 'placeholder', name: 'Placeholder', package: '@tiptap/extension-placeholder', enabled: false, category: 'formatting' },
];

export function useRichTextConfig() {
  const [extensions, setExtensions] = useState<TipTapExtension[]>(DEFAULT_EXTENSIONS);
  const [placeholder, setPlaceholder] = useState('Start typing...');
  const [editable, setEditable] = useState(true);

  const toggleExtension = useCallback((id: string) => {
    setExtensions(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e);
      // Auto-enable table dependencies
      if (id === 'table') {
        const tableEnabled = updated.find(e => e.id === 'table')?.enabled;
        if (tableEnabled) {
          return updated.map(e => ['tableRow', 'tableCell', 'tableHeader'].includes(e.id) ? { ...e, enabled: true } : e);
        }
      }
      if (id === 'taskList') {
        const taskEnabled = updated.find(e => e.id === 'taskList')?.enabled;
        if (taskEnabled) {
          return updated.map(e => e.id === 'taskItem' ? { ...e, enabled: true } : e);
        }
      }
      return updated;
    });
  }, []);

  const generateCode = useCallback((): string => {
    const enabled = extensions.filter(e => e.enabled);
    const imports = enabled.map(e => {
      const name = e.id.charAt(0).toUpperCase() + e.id.slice(1);
      return `import ${name} from '${e.package}';`;
    }).join('\n');

    const extList = enabled.map(e => {
      const name = e.id.charAt(0).toUpperCase() + e.id.slice(1);
      if (e.id === 'placeholder') return `${name}.configure({ placeholder: '${placeholder}' })`;
      if (e.id === 'link') return `${name}.configure({ openOnClick: false })`;
      if (e.id === 'taskItem') return `${name}.configure({ nested: true })`;
      return name;
    }).join(',\n    ');

    return `import { useEditor, EditorContent } from '@tiptap/react';
${imports}

export function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
    ${extList}
    ],
    content,
    editable: ${editable},
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex gap-1 p-2 border-b bg-muted/50">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={\`px-2 py-1 rounded text-xs \${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}\`}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={\`px-2 py-1 rounded text-xs italic \${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}\`}>I</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={\`px-2 py-1 rounded text-xs \${editor.isActive('heading') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}\`}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={\`px-2 py-1 rounded text-xs \${editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}\`}>• List</button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[200px]" />
    </div>
  );
}`;
  }, [extensions, placeholder, editable]);

  return { extensions, placeholder, editable, setPlaceholder, setEditable, toggleExtension, generateCode };
}

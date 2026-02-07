import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface CodeViewerProps {
  file: ProjectFile | null;
}

export function CodeViewer({ file }: CodeViewerProps) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a file to view its code
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-xs font-mono leading-relaxed">
        <code>
          {file.content.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-muted-foreground/40 w-10 text-right pr-4 shrink-0">
                {i + 1}
              </span>
              <span className="whitespace-pre-wrap break-all">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </ScrollArea>
  );
}

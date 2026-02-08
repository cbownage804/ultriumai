import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CodeEditor, type RemoteCursor } from './CodeEditor';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { X, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitEditorPaneProps {
  leftFile: ProjectFile | null;
  rightFile: ProjectFile | null;
  allFiles: ProjectFile[];
  onContentChange?: (path: string, content: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onInlineAIAction?: (action: string, selection: string, filePath: string) => void;
  remoteCursors?: RemoteCursor[];
  onSelectRightFile: (path: string) => void;
  onCloseSplit: () => void;
}

export function SplitEditorPane({
  leftFile, rightFile, allFiles,
  onContentChange, onCursorChange, onInlineAIAction, remoteCursors,
  onSelectRightFile, onCloseSplit,
}: SplitEditorPaneProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full flex flex-col">
          {leftFile && (
            <div className="h-7 flex items-center px-2 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <FileCode className="h-3 w-3 text-cyan-400/50 mr-1.5" />
              <span className="text-[10px] text-white/50 font-mono truncate">{leftFile.path}</span>
            </div>
          )}
          <div className="flex-1">
            <CodeEditor
              file={leftFile}
              onContentChange={onContentChange}
              onCursorChange={onCursorChange}
              onInlineAIAction={onInlineAIAction}
              remoteCursors={remoteCursors}
            />
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors" />

      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full flex flex-col">
          <div className="h-7 flex items-center justify-between px-2 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCode className="h-3 w-3 text-violet-400/50" />
              {rightFile ? (
                <span className="text-[10px] text-white/50 font-mono truncate">{rightFile.path}</span>
              ) : (
                <select
                  onChange={(e) => onSelectRightFile(e.target.value)}
                  className="text-[10px] text-white/40 bg-transparent border-none outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Select a file...</option>
                  {allFiles.map(f => (
                    <option key={f.path} value={f.path}>{f.path}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={onCloseSplit}
              className="h-4 w-4 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
          <div className="flex-1">
            <CodeEditor
              file={rightFile}
              onContentChange={onContentChange}
              onInlineAIAction={onInlineAIAction}
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

import { CleanMarkdownRenderer } from '@/components/chat/CleanMarkdownRenderer';

interface AIMessageContentProps {
  content: string;
  isStreaming?: boolean;
}

export function AIMessageContent({ content, isStreaming }: AIMessageContentProps) {
  return (
    <div className="relative">
      <CleanMarkdownRenderer content={content} />
      
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />
      )}
    </div>
  );
}

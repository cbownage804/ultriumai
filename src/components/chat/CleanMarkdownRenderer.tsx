import ReactMarkdown from 'react-markdown';
import { Copy, Check, Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CleanMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * A clean, accessible markdown renderer designed for easy reading.
 * Features:
 * - Clear typography with good spacing
 * - Visual callouts for tips, warnings, and success messages
 * - Syntax-highlighted code blocks with copy functionality
 * - Accessible for all reading levels
 */
export function CleanMarkdownRenderer({ content, className }: CleanMarkdownRendererProps) {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
          // Headings - Clear hierarchy with good spacing
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-3 text-foreground border-b pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-5 mb-2 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-3 mb-1 text-foreground">
              {children}
            </h4>
          ),

          // Paragraphs - Comfortable reading with good line height
          p: ({ children }) => {
            const text = String(children);
            
            // Detect and style special callouts
            if (text.includes('💡') || text.toLowerCase().startsWith('tip:') || text.toLowerCase().startsWith('pro tip')) {
              return (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 my-3">
                  <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed m-0">{children}</p>
                </div>
              );
            }
            
            if (text.includes('⚠️') || text.toLowerCase().includes('warning:') || text.toLowerCase().includes('caution:')) {
              return (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 my-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed m-0">{children}</p>
                </div>
              );
            }
            
            if (text.includes('✅') || text.includes('✓')) {
              return (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 my-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed m-0">{children}</p>
                </div>
              );
            }

            if (text.toLowerCase().startsWith('note:') || text.includes('ℹ️')) {
              return (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border my-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed m-0">{children}</p>
                </div>
              );
            }
            
            return (
              <p className="text-sm text-foreground leading-relaxed my-3">
                {children}
              </p>
            );
          },

          // Lists - Clean bullets with good spacing
          ul: ({ children }) => (
            <ul className="space-y-2 my-3 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 my-3 ml-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground flex items-start gap-2 leading-relaxed">
              <span className="text-primary mt-1.5 text-xs">●</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Emphasis - Clear visual distinction
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),

          // Code - Clean styling with copy functionality
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeId = `code-${Math.random().toString(36).slice(2)}`;
            const codeContent = String(children).replace(/\n$/, '');
            
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-xs" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <div className="relative my-4 group">
                <div className="flex items-center justify-between bg-muted/80 px-3 py-2 rounded-t border border-b-0">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {match ? match[1] : 'code'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyCode(codeContent, codeId)}
                  >
                    {copiedBlock === codeId ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted/50 p-4 rounded-b border overflow-x-auto">
                  <code className={cn("text-sm font-mono", className)} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },

          // Blockquote - Elegant styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 py-2 my-4 bg-muted/30 rounded-r">
              <div className="text-sm text-muted-foreground italic">
                {children}
              </div>
            </blockquote>
          ),

          // Tables - Clean and readable
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground border-b">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-b border-muted">
              {children}
            </td>
          ),

          // Links - Clear and accessible
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => <hr className="border-border my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

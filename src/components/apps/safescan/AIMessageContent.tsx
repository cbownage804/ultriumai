import ReactMarkdown from 'react-markdown';
import { Shield, AlertTriangle, CheckCircle, Info, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMessageContentProps {
  content: string;
  isStreaming?: boolean;
}

export function AIMessageContent({ content, isStreaming }: AIMessageContentProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Headers with icons
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-400" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-red-300 mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-red-400 mt-2 mb-1">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => {
            const text = String(children);
            
            // Detect warning/alert patterns
            if (text.includes('⚠️') || text.toLowerCase().includes('warning') || text.toLowerCase().includes('caution')) {
              return (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 my-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-200 text-sm m-0">{children}</p>
                </div>
              );
            }
            
            // Detect success patterns
            if (text.includes('✅') || text.includes('✓') || text.toLowerCase().includes('safe') && text.toLowerCase().includes('no threat')) {
              return (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 my-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-200 text-sm m-0">{children}</p>
                </div>
              );
            }
            
            // Detect danger/critical patterns
            if (text.includes('🔴') || text.toLowerCase().includes('critical') || text.toLowerCase().includes('danger') || text.toLowerCase().includes('malicious')) {
              return (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 my-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-200 text-sm m-0">{children}</p>
                </div>
              );
            }
            
            // Detect tip patterns
            if (text.includes('💡') || text.toLowerCase().startsWith('tip:') || text.toLowerCase().startsWith('pro tip')) {
              return (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 my-2">
                  <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-200 text-sm m-0">{children}</p>
                </div>
              );
            }
            
            return <p className="text-gray-300 text-sm leading-relaxed my-1.5">{children}</p>;
          },
          // Lists
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 ml-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-red-400 mt-1.5">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="text-gray-200 italic">{children}</em>
          ),
          // Code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-gray-800 text-red-300 font-mono text-xs">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-3 rounded-lg bg-gray-900 text-gray-300 font-mono text-xs overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-red-500/50 pl-3 my-2 text-gray-400 italic">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          // Horizontal rule
          hr: () => <hr className="border-gray-700 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
      
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-red-400 animate-pulse ml-0.5 rounded-sm" />
      )}
    </div>
  );
}

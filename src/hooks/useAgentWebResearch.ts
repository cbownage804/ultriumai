import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResearchResult {
  query: string;
  content: string;
  source: string;
  timestamp: Date;
}

const SEARCH_MARKER_REGEX = /\[SEARCH:\s*(.+?)\]/g;

/**
 * Detect research markers in AI responses and fetch web content.
 */
export function useAgentWebResearch() {
  const detectResearchNeeded = useCallback((text: string): string[] => {
    const queries: string[] = [];
    let match;
    while ((match = SEARCH_MARKER_REGEX.exec(text)) !== null) {
      queries.push(match[1].trim());
    }
    return queries;
  }, []);

  const executeResearch = useCallback(async (query: string): Promise<ResearchResult | null> => {
    try {
      // Try firecrawl-scrape for URL-like queries
      const isUrl = /^https?:\/\//i.test(query) || /\.\w{2,}\//.test(query);
      
      if (isUrl) {
        const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
          body: { url: query, options: { formats: ['markdown'], onlyMainContent: true } },
        });

        if (!error && data?.success !== false) {
          const content = data?.data?.markdown || data?.data?.content || JSON.stringify(data).slice(0, 5000);
          return {
            query,
            content: content.slice(0, 8000),
            source: query,
            timestamp: new Date(),
          };
        }
      }

      // For non-URL queries, Firecrawl cannot scrape search engines
      console.warn('[research] Skipping non-URL query (Firecrawl cannot scrape search engines):', query);
      return null;
    } catch (err) {
      console.error('[research] Error:', err);
      return null;
    }
  }, []);

  const buildResearchContext = useCallback((results: ResearchResult[]): string => {
    if (results.length === 0) return '';
    
    const sections = results.map(r => 
      `[RESEARCH RESULT for "${r.query}"]\nSource: ${r.source}\n${r.content}`
    );

    return `\n\n[WEB RESEARCH CONTEXT — Use this information to generate accurate code]\n${sections.join('\n\n---\n\n')}`;
  }, []);

  return {
    detectResearchNeeded,
    executeResearch,
    buildResearchContext,
  };
}

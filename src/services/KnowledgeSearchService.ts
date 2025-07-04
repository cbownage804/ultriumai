import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeSearchResult {
  id: string;
  content: string;
  similarity: number;
  source: {
    id: string;
    name: string;
    type: string;
  };
  document: {
    id: string;
    name: string;
  };
  metadata: {
    chunk_index: number;
    token_count: number;
    [key: string]: any;
  };
}

export interface KnowledgeSearchParams {
  query: string;
  gptId?: string;
  sourceIds?: string[];
  searchType?: 'semantic' | 'keyword';
  limit?: number;
  threshold?: number;
}

export class KnowledgeSearchService {
  static async searchKnowledge({
    query,
    gptId,
    sourceIds = [],
    searchType = 'semantic',
    limit = 5,
    threshold = 0.7
  }: KnowledgeSearchParams): Promise<{
    success: boolean;
    results: KnowledgeSearchResult[];
    searchType: string;
    responseTime: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: {
          query,
          gptId,
          sourceIds,
          searchType,
          limit,
          threshold
        }
      });

      if (error) {
        console.error('Knowledge search error:', error);
        return {
          success: false,
          results: [],
          searchType,
          responseTime: 0,
          error: error.message || 'Failed to search knowledge base'
        };
      }

      return {
        success: true,
        results: data.results || [],
        searchType: data.searchType || searchType,
        responseTime: data.responseTime || 0
      };
    } catch (error) {
      console.error('Knowledge search service error:', error);
      return {
        success: false,
        results: [],
        searchType,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getKnowledgeSources(gptId: string): Promise<{
    success: boolean;
    sources: Array<{
      id: string;
      name: string;
      source_type: string;
      status: string;
      file_count: number;
      total_size_bytes: number;
      last_synced_at: string | null;
    }>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('id, name, source_type, status, file_count, total_size_bytes, last_synced_at')
        .eq('gpt_id', gptId)
        .eq('status', 'completed');

      if (error) {
        return {
          success: false,
          sources: [],
          error: error.message
        };
      }

      return {
        success: true,
        sources: data || []
      };
    } catch (error) {
      return {
        success: false,
        sources: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static formatSearchResultsForContext(results: KnowledgeSearchResult[]): string {
    if (results.length === 0) return '';

    const context = results.map((result, index) => {
      return `[Source ${index + 1}: ${result.source.name} - ${result.document.name}]
${result.content}`;
    }).join('\n\n');

    return `\n\nKnowledge Base Context:\n${context}`;
  }

  static shouldUseKnowledgeSearch(query: string): boolean {
    // Simple heuristic to determine if knowledge search would be helpful
    const knowledgeIndicators = [
      'what', 'how', 'why', 'when', 'where', 'who',
      'explain', 'describe', 'tell me about', 'information about',
      'help with', 'guide', 'tutorial', 'documentation',
      'example', 'process', 'procedure', 'step'
    ];

    const queryLower = query.toLowerCase();
    return knowledgeIndicators.some(indicator => queryLower.includes(indicator));
  }
}
import { useState, useCallback } from 'react';

export interface NLQueryResult {
  id: string;
  naturalLanguage: string;
  generatedSQL: string;
  status: 'pending' | 'running' | 'success' | 'error';
  data?: Record<string, any>[];
  error?: string;
  rowCount?: number;
  executionTimeMs?: number;
  timestamp: Date;
}

export function useNLDatabaseQuery() {
  const [queryHistory, setQueryHistory] = useState<NLQueryResult[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  const buildNLToSQLPrompt = useCallback((naturalLanguage: string, schemaContext?: string): string => {
    return `Convert this natural language query to a PostgreSQL SELECT statement for a Supabase database.

${schemaContext ? `Database schema context:\n${schemaContext}\n\n` : ''}Natural language query: "${naturalLanguage}"

Rules:
- Only generate SELECT statements (read-only)
- Use proper table and column names from the schema
- Add LIMIT 100 if no limit is specified
- Use parameterized-style values where applicable
- Return ONLY the SQL query, no explanation

SQL:`;
  }, []);

  const addQueryResult = useCallback((naturalLanguage: string, sql: string) => {
    const result: NLQueryResult = {
      id: crypto.randomUUID(),
      naturalLanguage,
      generatedSQL: sql,
      status: 'pending',
      timestamp: new Date(),
    };
    setQueryHistory(prev => [result, ...prev].slice(0, 50));
    return result;
  }, []);

  const updateQueryResult = useCallback((id: string, update: Partial<NLQueryResult>) => {
    setQueryHistory(prev => prev.map(q => q.id === id ? { ...q, ...update } : q));
  }, []);

  const clearHistory = useCallback(() => {
    setQueryHistory([]);
  }, []);

  // Common natural language query examples
  const suggestions = [
    'Show me all users who signed up this week',
    'Count tickets by status',
    'Top 10 most active users by login count',
    'Revenue by month for the last 6 months',
    'All overdue invoices with customer details',
    'Users who haven\'t logged in for 30 days',
    'Average response time per ticket priority',
    'List all tables and their row counts',
  ];

  return {
    queryHistory,
    isQuerying,
    setIsQuerying,
    buildNLToSQLPrompt,
    addQueryResult,
    updateQueryResult,
    clearHistory,
    suggestions,
  };
}

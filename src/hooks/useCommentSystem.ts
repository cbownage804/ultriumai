/**
 * Phase 114: Code Commenting System
 * Threaded, resolvable comments on any line of code.
 */
import { useCallback, useState, useEffect } from 'react';

export interface CodeComment {
  id: string;
  filePath: string;
  line: number;
  content: string;
  author: string;
  authorColor: string;
  parentId: string | null; // for threading
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'ultrium-code-comments';

export function useCommentSystem() {
  const [comments, setComments] = useState<CodeComment[]>([]);
  const [activeCommentLine, setActiveCommentLine] = useState<{ filePath: string; line: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setComments(JSON.parse(stored).map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    }
  }, [comments]);

  const addComment = useCallback((filePath: string, line: number, content: string, author = 'You', parentId: string | null = null) => {
    const comment: CodeComment = {
      id: crypto.randomUUID(),
      filePath, line, content, author,
      authorColor: '#06b6d4',
      parentId,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setComments(prev => [...prev, comment]);
    return comment;
  }, []);

  const resolveComment = useCallback((id: string) => {
    setComments(prev => prev.map(c =>
      c.id === id ? { ...c, resolved: true, updatedAt: new Date() } : c
    ));
  }, []);

  const unresolveComment = useCallback((id: string) => {
    setComments(prev => prev.map(c =>
      c.id === id ? { ...c, resolved: false, updatedAt: new Date() } : c
    ));
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id && c.parentId !== id));
  }, []);

  const editComment = useCallback((id: string, content: string) => {
    setComments(prev => prev.map(c =>
      c.id === id ? { ...c, content, updatedAt: new Date() } : c
    ));
  }, []);

  const getFileComments = useCallback((filePath: string) => {
    return comments.filter(c => c.filePath === filePath && !c.resolved);
  }, [comments]);

  const getLineComments = useCallback((filePath: string, line: number) => {
    return comments.filter(c => c.filePath === filePath && c.line === line);
  }, [comments]);

  const getThread = useCallback((commentId: string) => {
    const root = comments.find(c => c.id === commentId);
    if (!root) return [];
    const replies = comments.filter(c => c.parentId === commentId);
    return [root, ...replies].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [comments]);

  const getCommentedLines = useCallback((filePath: string): Set<number> => {
    const lines = new Set<number>();
    comments.filter(c => c.filePath === filePath && !c.resolved).forEach(c => lines.add(c.line));
    return lines;
  }, [comments]);

  return {
    comments,
    activeCommentLine,
    setActiveCommentLine,
    addComment,
    resolveComment,
    unresolveComment,
    deleteComment,
    editComment,
    getFileComments,
    getLineComments,
    getThread,
    getCommentedLines,
    unresolvedCount: comments.filter(c => !c.resolved && !c.parentId).length,
    totalCount: comments.filter(c => !c.parentId).length,
  };
}

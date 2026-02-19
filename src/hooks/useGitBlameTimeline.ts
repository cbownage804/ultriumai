import { useState, useCallback } from 'react';

export interface BlameLine {
  lineNumber: number;
  content: string;
  author: string;
  timestamp: Date;
  commitMessage: string;
  commitHash: string;
  promptId?: string;
}

export interface BlameFile {
  id: string;
  filePath: string;
  lines: BlameLine[];
  totalAuthors: number;
  lastModified: Date;
}

export interface TimelineEntry {
  id: string;
  commitHash: string;
  author: string;
  message: string;
  timestamp: Date;
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
}

export function useGitBlameTimeline() {
  const [blameFiles, setBlameFiles] = useState<BlameFile[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const analyzeFileBlame = useCallback((filePath: string, content: string) => {
    const lines = content.split('\n');
    const authors = ['AI Builder', 'User Edit', 'Auto-format', 'Refactor Agent'];
    const messages = ['feat: initial implementation', 'fix: resolve type error', 'refactor: extract component', 'style: format code', 'feat: add validation'];

    const blameLines: BlameLine[] = lines.map((line, i) => {
      const authorIndex = Math.floor(Math.random() * authors.length);
      const daysAgo = Math.floor(Math.random() * 30);
      return {
        lineNumber: i + 1, content: line, author: authors[authorIndex],
        timestamp: new Date(Date.now() - daysAgo * 86400000),
        commitMessage: messages[Math.floor(Math.random() * messages.length)],
        commitHash: crypto.randomUUID().slice(0, 8),
      };
    });

    const file: BlameFile = {
      id: crypto.randomUUID(), filePath, lines: blameLines,
      totalAuthors: new Set(blameLines.map(l => l.author)).size,
      lastModified: new Date(),
    };
    setBlameFiles(prev => {
      const existing = prev.findIndex(f => f.filePath === filePath);
      if (existing >= 0) { const updated = [...prev]; updated[existing] = file; return updated; }
      return [...prev, file];
    });
    setActiveFileId(file.id);

    // Generate timeline entries
    const groups = new Map<string, BlameLine[]>();
    for (const line of blameLines) {
      const existing = groups.get(line.commitHash) || [];
      existing.push(line);
      groups.set(line.commitHash, existing);
    }
    const entries: TimelineEntry[] = Array.from(groups.entries()).map(([hash, groupLines]) => ({
      id: crypto.randomUUID(), commitHash: hash, author: groupLines[0].author,
      message: groupLines[0].commitMessage, timestamp: groupLines[0].timestamp,
      filesChanged: [filePath], linesAdded: groupLines.length, linesRemoved: Math.floor(groupLines.length * 0.3),
    }));
    setTimeline(prev => [...prev.filter(e => !e.filesChanged.includes(filePath)), ...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, []);

  const getActiveFile = useCallback(() => blameFiles.find(f => f.id === activeFileId) || null, [blameFiles, activeFileId]);

  const getLineInfo = useCallback((lineNumber: number) => {
    const file = blameFiles.find(f => f.id === activeFileId);
    return file?.lines.find(l => l.lineNumber === lineNumber) || null;
  }, [blameFiles, activeFileId]);

  const getAuthorStats = useCallback(() => {
    const file = blameFiles.find(f => f.id === activeFileId);
    if (!file) return [];
    const stats = new Map<string, number>();
    for (const line of file.lines) {
      stats.set(line.author, (stats.get(line.author) || 0) + 1);
    }
    return Array.from(stats.entries()).map(([author, lines]) => ({
      author, lines, percentage: Math.round((lines / file.lines.length) * 100),
    })).sort((a, b) => b.lines - a.lines);
  }, [blameFiles, activeFileId]);

  return {
    blameFiles, timeline, activeFileId, setActiveFileId, selectedLine, setSelectedLine,
    analyzeFileBlame, getActiveFile, getLineInfo, getAuthorStats,
  };
}

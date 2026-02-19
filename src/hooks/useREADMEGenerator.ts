import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export function useREADMEGenerator() {
  const [title, setTitle] = useState('My Project');
  const [description, setDescription] = useState('A modern web application built with React, TypeScript, and Tailwind CSS.');
  const [showBadges, setShowBadges] = useState(true);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const [showAPI, setShowAPI] = useState(false);
  const [license, setLicense] = useState('MIT');

  const generateCode = useCallback((files?: ProjectFile[]): string => {
    const lines: string[] = [];
    lines.push(`# ${title}\n`);
    lines.push(`${description}\n`);

    if (showBadges) {
      lines.push('![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)\n');
    }

    if (showSetup) {
      lines.push('## Getting Started\n');
      lines.push('```bash\n# Install dependencies\nnpm install\n\n# Start development server\nnpm run dev\n\n# Build for production\nnpm run build\n```\n');
    }

    if (showFileTree && files && files.length > 0) {
      lines.push('## Project Structure\n');
      lines.push('```');
      const dirs = new Set<string>();
      files.forEach(f => {
        const parts = f.path.split('/');
        for (let i = 1; i <= parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
      });
      const sorted = Array.from(dirs).sort();
      sorted.slice(0, 30).forEach(d => {
        const depth = d.split('/').length - 1;
        const name = d.split('/').pop();
        lines.push(`${'  '.repeat(depth)}${name}`);
      });
      if (sorted.length > 30) lines.push('  ...');
      lines.push('```\n');
    }

    if (showAPI) {
      lines.push('## API Reference\n');
      lines.push('| Endpoint | Method | Description |\n|----------|--------|-------------|\n| `/api/health` | GET | Health check |\n');
    }

    lines.push(`## License\n\n${license}\n`);
    return lines.join('\n');
  }, [title, description, showBadges, showFileTree, showSetup, showAPI, license]);

  return { title, setTitle, description, setDescription, showBadges, setShowBadges, showFileTree, setShowFileTree, showSetup, setShowSetup, showAPI, setShowAPI, license, setLicense, generateCode };
}

/**
 * Seed Data Generator — Phase 34
 * Generates realistic sample data for new database tables.
 */

import { useState, useCallback } from 'react';
import { Database, Sparkles, Loader2, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeedDataGeneratorProps {
  tableName: string;
  migrationSQL: string;
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
}

export function SeedDataGenerator({ tableName, migrationSQL, onGenerate, isGenerating }: SeedDataGeneratorProps) {
  const [rowCount, setRowCount] = useState(8);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    const prompt = `[SEED DATA GENERATION]
Generate ${rowCount} realistic sample rows for this table:

\`\`\`sql
${migrationSQL}
\`\`\`

Requirements:
- Use realistic names, emails, dates, descriptions
- Follow all NOT NULL constraints and data types
- Use valid foreign key references if any exist
- Vary the data to show different states (e.g., different statuses, dates spread across months)

Output the INSERT statements as a ===MIGRATION:=== block so they can be executed directly.
Do NOT include the CREATE TABLE — only INSERTs.`;

    onGenerate(prompt);
    setGenerated(true);
  }, [rowCount, migrationSQL, onGenerate]);

  return (
    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <Database className="h-3.5 w-3.5 text-cyan-400/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/50">
          {generated ? 'Sample data requested' : `Generate sample data for ${tableName}?`}
        </p>
      </div>
      {!generated ? (
        <div className="flex items-center gap-1.5">
          <select
            value={rowCount}
            onChange={e => setRowCount(Number(e.target.value))}
            className="h-6 text-[10px] bg-white/[0.03] border border-white/[0.06] rounded text-white/50 px-1"
          >
            <option value={5}>5 rows</option>
            <option value={8}>8 rows</option>
            <option value={15}>15 rows</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors",
              isGenerating
                ? "text-white/30 bg-white/[0.03]"
                : "text-emerald-400/80 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15]"
            )}
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Generate
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400/60">
          <Check className="h-3 w-3" />
          <span>Sent</span>
          <button
            onClick={() => setGenerated(false)}
            className="ml-1 text-white/20 hover:text-white/40"
          >
            <RefreshCw className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

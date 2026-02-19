import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Database, Play, FileCode, History, Shield, Loader2, CheckCircle2, XCircle,
  Plus, Download, Copy, AlertTriangle, Table2, Zap, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { useSupabaseConnection } from '@/hooks/useSupabaseConnection';
import { SeedDataGenerator } from './SeedDataGenerator';

interface DatabaseMigrationPanelProps {
  open: boolean;
  onClose: () => void;
  connection: ReturnType<typeof useSupabaseConnection>;
  onGenerateCode?: (code: string, fileName: string) => void;
  onSendToChat?: (prompt: string) => void;
}

interface MigrationEntry {
  id: string;
  name: string;
  sql: string;
  status: 'pending' | 'applied' | 'failed';
  appliedAt?: string;
  error?: string;
}

const MIGRATIONS_KEY = 'app-builder-migrations';

export function DatabaseMigrationPanel({ open, onClose, connection, onGenerateCode, onSendToChat }: DatabaseMigrationPanelProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'templates'>('editor');
  const [sql, setSql] = useState('');
  const [migrationName, setMigrationName] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; rowCount?: number; tableName?: string } | null>(null);
  const [migrations, setMigrations] = useState<MigrationEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(MIGRATIONS_KEY) || '[]'); } catch { return []; }
  });

  const saveMigrations = (m: MigrationEntry[]) => {
    setMigrations(m);
    localStorage.setItem(MIGRATIONS_KEY, JSON.stringify(m));
  };

  const executeSql = async () => {
    if (!sql.trim()) return;
    if (!connection.status.connected) { toast.error('Connect to Supabase first'); return; }

    setIsExecuting(true);
    setLastResult(null);
    try {
      const client = connection.getClient();
      if (!client) throw new Error('No client');

      // Use rpc to run raw SQL — requires a helper function in the DB
      // Fallback: try to parse and execute via the client
      const statements = sql.split(';').filter(s => s.trim());
      let totalAffected = 0;

      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;

        // Detect SELECT statements
        if (/^\s*SELECT/i.test(trimmed)) {
          // For SELECTs, try to extract table name and use .from()
          const match = trimmed.match(/FROM\s+(\w+\.)?(\w+)/i);
          if (match) {
            const tableName = match[2];
            const result = await connection.executeQuery(tableName, { limit: 100 });
            if (result.error) throw new Error(result.error);
            totalAffected += result.rowCount;
          }
        }
        // For DDL/DML, we need an RPC function — inform user
        else {
          // Try using the Supabase Management API approach
          const response = await fetch(`${connection.config!.url}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
              'apikey': connection.config!.anonKey,
              'Authorization': `Bearer ${connection.config!.anonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: trimmed }),
          });

          if (response.ok) {
            totalAffected++;
          } else {
            // If RPC doesn't exist, offer to create it
            const errText = await response.text();
            if (errText.includes('execute_sql') || errText.includes('does not exist')) {
              throw new Error(
                'To run DDL/DML from the App Builder, create this helper function in your Supabase SQL Editor:\n\n' +
                'CREATE OR REPLACE FUNCTION execute_sql(query text)\n' +
                'RETURNS json AS $$\n' +
                'BEGIN\n' +
                '  EXECUTE query;\n' +
                '  RETURN \'{"ok": true}\'::json;\n' +
                'END;\n' +
                '$$ LANGUAGE plpgsql SECURITY DEFINER;'
              );
            }
            throw new Error(errText);
          }
        }
      }

      // Phase 58: Detect CREATE TABLE for seed data generation
      const createTableMatch = sql.match(/CREATE\s+TABLE\s+(?:\w+\.)?(\w+)/i);
      
      setLastResult({ success: true, message: `Executed successfully`, rowCount: totalAffected, tableName: createTableMatch?.[1] || undefined });
      
      // Save to history
      const entry: MigrationEntry = {
        id: crypto.randomUUID(),
        name: migrationName || `migration_${Date.now()}`,
        sql: sql.trim(),
        status: 'applied',
        appliedAt: new Date().toISOString(),
      };
      saveMigrations([entry, ...migrations]);
      
      // Refresh schema
      connection.fetchSchema();
      toast.success('Migration applied');
    } catch (e: any) {
      setLastResult({ success: false, message: e.message });
      
      const entry: MigrationEntry = {
        id: crypto.randomUUID(),
        name: migrationName || `migration_${Date.now()}`,
        sql: sql.trim(),
        status: 'failed',
        error: e.message,
      };
      saveMigrations([entry, ...migrations]);
    } finally {
      setIsExecuting(false);
    }
  };

  const templates = [
    {
      name: 'Create Table with RLS',
      sql: `CREATE TABLE public.my_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rows"
  ON public.my_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rows"
  ON public.my_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);`,
    },
    {
      name: 'Add Column',
      sql: `ALTER TABLE public.my_table
  ADD COLUMN description TEXT;`,
    },
    {
      name: 'Create Index',
      sql: `CREATE INDEX idx_my_table_user_id
  ON public.my_table (user_id);`,
    },
    {
      name: 'Storage Bucket + Policy',
      sql: `INSERT INTO storage.buckets (id, name, public)
  VALUES ('uploads', 'uploads', true);

CREATE POLICY "Anyone can view uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "Auth users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');`,
    },
    {
      name: 'Profiles Table',
      sql: `CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-[#0c0c14] border-white/10 shadow-2xl gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="h-4.5 w-4.5 text-cyan-400" />
            Database Migrations
            {connection.status.connected && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">Connected</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-5 mt-3 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 h-9">
            <TabsTrigger value="editor" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <FileCode className="h-3 w-3" /> SQL Editor
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <History className="h-3 w-3" /> History
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Zap className="h-3 w-3" /> Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 min-h-0 flex flex-col p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Input value={migrationName} onChange={e => setMigrationName(e.target.value)} placeholder="Migration name (optional)" className="bg-white/5 border-white/10 text-white text-sm flex-1" />
              <Button onClick={() => { if (sql.trim()) { onGenerateCode?.(sql, `${migrationName || 'migration'}.sql`); toast.success('Saved to project files'); } }} variant="outline" size="sm" className="text-xs border-white/10 text-white/60 gap-1">
                <Download className="h-3 w-3" /> Save
              </Button>
            </div>
            <Textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              placeholder="-- Write your SQL migration here...&#10;CREATE TABLE public.my_table (&#10;  id UUID PRIMARY KEY DEFAULT gen_random_uuid()&#10;);"
              className="bg-white/[0.03] border-white/[0.06] text-white text-sm font-mono flex-1 min-h-[200px] resize-none"
              spellCheck={false}
            />

            {lastResult && (
              <div className={cn(
                "rounded-lg border p-3 text-xs flex items-start gap-2",
                lastResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              )}>
                {lastResult.success ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                <pre className="whitespace-pre-wrap break-all">{lastResult.message}</pre>
              </div>
            )}

            {/* Phase 58: Seed Data Generator after successful CREATE TABLE */}
            {lastResult?.success && lastResult.tableName && onSendToChat && (
              <SeedDataGenerator
                tableName={lastResult.tableName}
                migrationSQL={sql}
                onGenerate={onSendToChat}
                isGenerating={false}
              />
            )}

            <div className="flex items-center gap-2">
              {!connection.status.connected && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
                  <AlertTriangle className="h-3 w-3" /> Connect to Supabase IDE first
                </div>
              )}
              <div className="flex-1" />
              <Button onClick={executeSql} disabled={isExecuting || !sql.trim() || !connection.status.connected} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs gap-1.5">
                {isExecuting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Execute Migration
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                {migrations.length === 0 && <div className="py-8 text-center text-white/15 text-sm">No migrations yet</div>}
                {migrations.map(m => (
                  <div key={m.id} className="rounded-lg border border-white/[0.06] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {m.status === 'applied' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                      <span className="text-sm text-white/70 font-mono">{m.name}</span>
                      <Badge className={cn("text-[9px] px-1.5 py-0", m.status === 'applied' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>{m.status}</Badge>
                      <span className="text-[10px] text-white/15 ml-auto">{m.appliedAt ? new Date(m.appliedAt).toLocaleString() : ''}</span>
                    </div>
                    <pre className="text-[10px] text-white/30 font-mono bg-white/[0.02] rounded p-2 max-h-20 overflow-auto whitespace-pre-wrap">{m.sql}</pre>
                    {m.error && <div className="text-[10px] text-red-400/60">{m.error}</div>}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-[10px] text-white/20 h-5 gap-1" onClick={() => { setSql(m.sql); setMigrationName(m.name); setActiveTab('editor'); }}>
                        <Copy className="h-2.5 w-2.5" /> Reuse
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {templates.map((t, i) => (
                  <button key={i} onClick={() => { setSql(t.sql); setMigrationName(t.name.toLowerCase().replace(/\s+/g, '_')); setActiveTab('editor'); }} className="w-full text-left rounded-lg border border-white/[0.06] p-3 hover:bg-white/[0.03] transition-colors space-y-2">
                    <div className="flex items-center gap-2">
                      <Table2 className="h-3.5 w-3.5 text-cyan-400/60" />
                      <span className="text-sm text-white/70">{t.name}</span>
                    </div>
                    <pre className="text-[10px] text-white/25 font-mono max-h-16 overflow-hidden whitespace-pre-wrap">{t.sql}</pre>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Plus, Trash2, Play, Code, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import type { LintRule, LintResult } from '@/hooks/useCustomLinting';

interface CustomLintingPanelProps {
  rules: LintRule[];
  results: LintResult[];
  activeRuleId: string | null;
  setActiveRuleId: (id: string | null) => void;
  getActiveRule: () => LintRule | null;
  RULE_PRESETS: string[];
  createRule: (presetKey?: string) => LintRule;
  updateRule: (id: string, update: Partial<LintRule>) => void;
  removeRule: (id: string) => void;
  simulateLint: (code: string, fileName: string) => LintResult[];
  clearResults: () => void;
  generateEslintConfig: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

const severityIcon = { error: AlertCircle, warning: AlertTriangle, info: Info };
const severityColor = { error: 'text-red-500', warning: 'text-yellow-500', info: 'text-blue-500' };

export function CustomLintingPanel({
  rules, results, activeRuleId, setActiveRuleId, getActiveRule,
  RULE_PRESETS, createRule, updateRule, removeRule,
  simulateLint, clearResults, generateEslintConfig, onInsertCode, onClose,
}: CustomLintingPanelProps) {
  const active = getActiveRule();
  const [testCode, setTestCode] = useState('');
  const [tab, setTab] = useState<'rules' | 'results'>('rules');

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Custom Linting</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex border-b border-border">
        <button className={`flex-1 py-2 text-xs font-medium ${tab === 'rules' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('rules')}>Rules ({rules.length})</button>
        <button className={`flex-1 py-2 text-xs font-medium ${tab === 'results' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('results')}>Results ({results.length})</button>
      </div>

      {tab === 'rules' && (
        <>
          <div className="p-3 border-b border-border space-y-2">
            <Button size="sm" className="w-full" onClick={() => createRule()}>
              <Plus className="w-3 h-3 mr-1" /> New Rule
            </Button>
            <div className="flex flex-wrap gap-1">
              {RULE_PRESETS.map(p => (
                <Badge key={p} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10" onClick={() => createRule(p)}>{p}</Badge>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {!active && rules.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 mx-3 my-1 rounded hover:bg-muted cursor-pointer" onClick={() => setActiveRuleId(r.id)}>
                <div className="flex items-center gap-2">
                  {React.createElement(severityIcon[r.severity], { className: `w-3 h-3 ${severityColor[r.severity]}` })}
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={r.isActive} onCheckedChange={v => { updateRule(r.id, { isActive: v }); }} onClick={e => e.stopPropagation()} />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); removeRule(r.id); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}

            {active && (
              <div className="p-3 space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setActiveRuleId(null)}>← Back</Button>
                <div><Label className="text-xs">Name</Label><Input value={active.name} onChange={e => updateRule(active.id, { name: e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Pattern (regex)</Label><Input value={active.pattern} onChange={e => updateRule(active.id, { pattern: e.target.value })} className="h-8 text-sm font-mono" /></div>
                <div><Label className="text-xs">Message</Label><Input value={active.message} onChange={e => updateRule(active.id, { message: e.target.value })} className="h-8 text-sm" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><Label className="text-xs">Severity</Label>
                    <Select value={active.severity} onValueChange={v => updateRule(active.id, { severity: v as LintRule['severity'] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="error">Error</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="info">Info</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1"><Label className="text-xs">File glob</Label><Input value={active.fileGlob} onChange={e => updateRule(active.id, { fileGlob: e.target.value })} className="h-8 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Auto-fix (replacement)</Label><Input value={active.autoFix || ''} onChange={e => updateRule(active.id, { autoFix: e.target.value })} className="h-8 text-sm font-mono" placeholder="Optional" /></div>
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t border-border space-y-2">
            <Label className="text-xs">Test Code</Label>
            <Textarea value={testCode} onChange={e => setTestCode(e.target.value)} className="text-xs font-mono min-h-[60px]" placeholder="Paste code to lint..." />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs" onClick={() => { simulateLint(testCode, 'test.tsx'); setTab('results'); }}>
                <Play className="w-3 h-3 mr-1" /> Run Lint
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onInsertCode(generateEslintConfig())}>
                <Code className="w-3 h-3 mr-1" /> Export Config
              </Button>
            </div>
          </div>
        </>
      )}

      {tab === 'results' && (
        <ScrollArea className="flex-1 p-3">
          {results.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No lint results. Run lint on some code.</p>}
          {results.map(r => {
            const Icon = severityIcon[r.severity];
            return (
              <div key={r.id} className="flex items-start gap-2 p-2 rounded hover:bg-muted mb-1">
                <Icon className={`w-3 h-3 mt-0.5 ${severityColor[r.severity]}`} />
                <div className="flex-1">
                  <p className="text-xs">{r.message}</p>
                  <p className="text-[10px] text-muted-foreground">{r.filePath}:{r.line}:{r.column}</p>
                </div>
                {r.fixAvailable && <Badge variant="outline" className="text-[10px]">Fix</Badge>}
              </div>
            );
          })}
          {results.length > 0 && (
            <Button size="sm" variant="ghost" className="w-full text-xs mt-2" onClick={clearResults}>Clear Results</Button>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

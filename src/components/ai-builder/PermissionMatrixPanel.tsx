import { X, Grid3X3, Plus, Sparkles, Check, Database } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { usePermissionMatrixBuilder } from '@/hooks/usePermissionMatrixBuilder';

type Props = ReturnType<typeof usePermissionMatrixBuilder> & {
  onInsertCode: (code: string) => void;
  onClose: () => void;
};

export function PermissionMatrixPanel({
  roles, permissions, addRole, removeRole, addPermission, removePermission,
  togglePermission, isGranted, generateRLSPolicies, generateHookCode,
  onInsertCode, onClose
}: Props) {
  const [copied, setCopied] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newResource, setNewResource] = useState('');
  const [newAction, setNewAction] = useState('');
  const [outputMode, setOutputMode] = useState<'hook' | 'rls'>('hook');
  const [showSQL, setShowSQL] = useState(false);

  const handleInsert = () => {
    const code = outputMode === 'hook' ? generateHookCode() : generateRLSPolicies();
    onInsertCode(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-96 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-medium text-white/80">Permission Matrix</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Add Role */}
        <div className="flex gap-1">
          <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="New role..."
            className="flex-1 text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70" />
          <button onClick={() => { if (newRole) { addRole(newRole); setNewRole(''); }}}
            className="text-[9px] px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30">
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Add Permission */}
        <div className="flex gap-1">
          <input value={newResource} onChange={e => setNewResource(e.target.value)} placeholder="Resource"
            className="flex-1 text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70" />
          <input value={newAction} onChange={e => setNewAction(e.target.value)} placeholder="Action"
            className="w-16 text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70" />
          <button onClick={() => { if (newResource && newAction) { addPermission(newResource, newAction); setNewResource(''); setNewAction(''); }}}
            className="text-[9px] px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30">
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left text-white/30 p-1">Permission</th>
                {roles.map(r => (
                  <th key={r.id} className="text-center text-white/50 p-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{r.name}</span>
                      <button onClick={() => removeRole(r.id)} className="text-[8px] text-red-400/40 hover:text-red-400">✕</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p.id} className="border-t border-white/[0.04]">
                  <td className="p-1 text-white/60">
                    <div className="flex items-center gap-1">
                      <span>{p.resource}.{p.action}</span>
                      <button onClick={() => removePermission(p.id)} className="text-[8px] text-red-400/40 hover:text-red-400">✕</button>
                    </div>
                  </td>
                  {roles.map(r => (
                    <td key={r.id} className="text-center p-1">
                      <button onClick={() => togglePermission(r.id, p.id)}
                        className={cn("h-5 w-5 rounded border transition-all mx-auto flex items-center justify-center",
                          isGranted(r.id, p.id) ? "bg-purple-500/30 border-purple-400/50 text-purple-300" : "border-white/10 text-transparent hover:border-white/20"
                        )}>
                        ✓
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Output mode */}
        <div className="flex gap-1">
          <button onClick={() => setOutputMode('hook')}
            className={cn("flex-1 text-[10px] py-1 rounded", outputMode === 'hook' ? "bg-purple-500/20 text-purple-400" : "text-white/30 hover:text-white/50")}>
            usePermission Hook
          </button>
          <button onClick={() => setOutputMode('rls')}
            className={cn("flex-1 text-[10px] py-1 rounded", outputMode === 'rls' ? "bg-purple-500/20 text-purple-400" : "text-white/30 hover:text-white/50")}>
            RLS Policies
          </button>
        </div>

        <button onClick={() => setShowSQL(!showSQL)} className="flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400">
          <Database className="h-3 w-3" />{showSQL ? 'Hide' : 'Preview'} Output
        </button>
        {showSQL && (
          <pre className="text-[9px] text-white/40 bg-white/[0.03] p-2 rounded overflow-auto max-h-48 font-mono whitespace-pre-wrap">
            {outputMode === 'hook' ? generateHookCode() : generateRLSPolicies()}
          </pre>
        )}
      </div>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <button onClick={handleInsert} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-lg text-xs font-medium">
          {copied ? <><Check className="h-3 w-3" />Inserted</> : <><Sparkles className="h-3 w-3" />Generate {outputMode === 'hook' ? 'Hook' : 'RLS SQL'}</>}
        </button>
      </div>
    </div>
  );
}

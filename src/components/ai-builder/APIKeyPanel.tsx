import { X, Key, Plus, Trash2, Sparkles, Check, Database } from 'lucide-react';
import { useState } from 'react';
import type { useAPIKeyManagement } from '@/hooks/useAPIKeyManagement';

type Props = ReturnType<typeof useAPIKeyManagement> & {
  onInsertCode: (code: string) => void;
  onClose: () => void;
};

export function APIKeyPanel({ fields, tableName, setTableName, addField, updateField, removeField, generateCode, generateMigrationSQL, onInsertCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const handleInsert = () => {
    onInsertCode(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Key className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-medium text-white/80">API Key Manager</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Table Name</label>
          <input value={tableName} onChange={e => setTableName(e.target.value)}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Key Types</label>
            <button onClick={addField} className="text-[9px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5">
              <Plus className="h-2.5 w-2.5" />Add
            </button>
          </div>
          {fields.map(f => (
            <div key={f.id} className="p-2 rounded border border-white/[0.06] bg-white/[0.02] space-y-1.5">
              <div className="flex items-center justify-between">
                <input value={f.name} onChange={e => updateField(f.id, { name: e.target.value })} placeholder="Key name"
                  className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/70 flex-1 mr-1" />
                <button onClick={() => removeField(f.id)} className="text-white/20 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex gap-1.5">
                <input value={f.prefix} onChange={e => updateField(f.id, { prefix: e.target.value })} placeholder="Prefix"
                  className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/70 w-16" />
                <input type="number" value={f.expiryDays} onChange={e => updateField(f.id, { expiryDays: Number(e.target.value) })} placeholder="Expiry days"
                  className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/70 flex-1" />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowSQL(!showSQL)} className="flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400">
          <Database className="h-3 w-3" />{showSQL ? 'Hide' : 'Show'} Migration SQL
        </button>
        {showSQL && (
          <pre className="text-[9px] text-white/40 bg-white/[0.03] p-2 rounded overflow-auto max-h-40 font-mono whitespace-pre-wrap">
            {generateMigrationSQL()}
          </pre>
        )}
      </div>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <button onClick={handleInsert} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-lg text-xs font-medium">
          {copied ? <><Check className="h-3 w-3" />Inserted</> : <><Sparkles className="h-3 w-3" />Generate API Key UI</>}
        </button>
      </div>
    </div>
  );
}

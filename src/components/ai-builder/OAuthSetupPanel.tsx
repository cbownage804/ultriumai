import { X, Globe, ToggleLeft, ToggleRight, Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { useOAuthProviderSetup } from '@/hooks/useOAuthProviderSetup';

type Props = ReturnType<typeof useOAuthProviderSetup> & {
  onInsertCode: (code: string) => void;
  onClose: () => void;
};

export function OAuthSetupPanel({ providers, redirectUrl, setRedirectUrl, toggleProvider, updateProvider, generateCode, onInsertCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleInsert = () => {
    const code = generateCode();
    onInsertCode(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-white/80">OAuth Setup</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="space-y-2">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Providers</label>
          {providers.map(p => (
            <div key={p.id} className={cn("p-2.5 rounded-lg border transition-all", p.enabled ? "border-blue-500/30 bg-blue-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-white/80">{p.name}</span>
                <button onClick={() => toggleProvider(p.id)}>
                  {p.enabled ? <ToggleRight className="h-4 w-4 text-blue-400" /> : <ToggleLeft className="h-4 w-4 text-white/20" />}
                </button>
              </div>
              {p.enabled && (
                <div className="space-y-1.5">
                  <input
                    value={p.clientId}
                    onChange={e => updateProvider(p.id, { clientId: e.target.value })}
                    placeholder="Client ID"
                    className="w-full text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 placeholder:text-white/20"
                  />
                  <div className="text-[9px] text-white/30">Callback: {p.callbackUrl}</div>
                  <div className="text-[9px] text-white/30">Scopes: {p.scopes.join(', ')}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Redirect After Login</label>
          <input
            value={redirectUrl}
            onChange={e => setRedirectUrl(e.target.value)}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70"
          />
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <button onClick={handleInsert} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg text-xs font-medium">
          {copied ? <><Check className="h-3 w-3" />Inserted</> : <><Sparkles className="h-3 w-3" />Generate OAuth Code</>}
        </button>
      </div>
    </div>
  );
}

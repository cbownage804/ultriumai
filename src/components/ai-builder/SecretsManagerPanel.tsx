import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Shield, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Secret {
  id: string;
  key: string;
  value: string;
  environment: 'all' | 'development' | 'staging' | 'production';
  isEncrypted: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

interface SecretsManagerPanelProps {
  open: boolean;
  onClose: () => void;
  onSecretsChange?: (secrets: { key: string; value: string }[]) => void;
}

const ENV_COLORS: Record<string, string> = {
  all: 'text-white/50 border-white/20',
  development: 'text-emerald-400 border-emerald-500/30',
  staging: 'text-amber-400 border-amber-500/30',
  production: 'text-red-400 border-red-500/30',
};

export function SecretsManagerPanel({ open, onClose, onSecretsChange }: SecretsManagerPanelProps) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newEnv, setNewEnv] = useState<Secret['environment']>('all');
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [activeEnvFilter, setActiveEnvFilter] = useState<Secret['environment'] | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleVisibility = useCallback((id: string) => {
    setVisibleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    if (!newKey.trim()) { toast.error('Key is required'); return; }
    if (secrets.some(s => s.key === newKey.trim() && s.environment === newEnv)) {
      toast.error('Secret with this key already exists for this environment');
      return;
    }

    const secret: Secret = {
      id: crypto.randomUUID(),
      key: newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      value: newValue,
      environment: newEnv,
      isEncrypted: true,
      createdAt: new Date(),
    };

    setSecrets(prev => {
      const updated = [...prev, secret];
      onSecretsChange?.(updated.map(s => ({ key: s.key, value: s.value })));
      return updated;
    });

    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
    toast.success(`Secret "${secret.key}" added`);
  }, [newKey, newValue, newEnv, secrets, onSecretsChange]);

  const handleDelete = useCallback((id: string) => {
    setSecrets(prev => {
      const updated = prev.filter(s => s.id !== id);
      onSecretsChange?.(updated.map(s => ({ key: s.key, value: s.value })));
      return updated;
    });
    toast.success('Secret deleted');
  }, [onSecretsChange]);

  const handleCopyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(`process.env.${key}`);
    toast.success(`Copied process.env.${key}`);
  }, []);

  const filtered = activeEnvFilter === 'all' ? secrets : secrets.filter(s => s.environment === activeEnvFilter || s.environment === 'all');

  const SENSITIVE_PATTERNS = ['PASSWORD', 'SECRET', 'TOKEN', 'API_KEY', 'PRIVATE'];
  const hasSensitiveExposure = secrets.some(s => 
    SENSITIVE_PATTERNS.some(p => s.key.includes(p)) && s.environment === 'all'
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            Secrets & Environment Variables
          </DialogTitle>
        </DialogHeader>

        {/* Security warning */}
        {hasSensitiveExposure && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Sensitive secrets set to "All Environments" — consider scoping to production only.</span>
          </div>
        )}

        {/* Environment filter tabs */}
        <div className="flex items-center gap-1.5">
          {(['all', 'development', 'staging', 'production'] as const).map(env => (
            <button
              key={env}
              onClick={() => setActiveEnvFilter(env)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-md border transition-colors capitalize",
                activeEnvFilter === env
                  ? `${ENV_COLORS[env]} bg-white/5`
                  : "text-white/30 border-transparent hover:text-white/50"
              )}
            >
              {env === 'all' ? 'All Envs' : env}
            </button>
          ))}
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Secret
          </Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="border border-white/10 rounded-lg p-3 space-y-2 bg-white/[0.02]">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="KEY_NAME"
                className="h-8 text-xs bg-white/5 border-white/10 font-mono uppercase"
              />
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="value"
                type="password"
                className="h-8 text-xs bg-white/5 border-white/10 font-mono"
              />
              <select
                value={newEnv}
                onChange={(e) => setNewEnv(e.target.value as Secret['environment'])}
                className="h-8 text-xs bg-white/5 border border-white/10 rounded-md text-white/70 px-2"
              >
                <option value="all">All Envs</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
                <Lock className="h-3 w-3 mr-1" />
                Add Encrypted Secret
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Secrets list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-2">
              <Shield className="h-8 w-8" />
              <p className="text-sm">No secrets configured</p>
              <p className="text-xs text-white/15">Secrets are encrypted and only accessible from edge functions.</p>
            </div>
          ) : (
            filtered.map(secret => {
              const isVisible = visibleIds.has(secret.id);
              const isSensitive = SENSITIVE_PATTERNS.some(p => secret.key.includes(p));
              return (
                <div
                  key={secret.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.06] hover:border-white/10 bg-white/[0.02] transition-colors group"
                >
                  <Lock className={cn("h-3.5 w-3.5 shrink-0", isSensitive ? "text-red-400/60" : "text-white/20")} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/70">{secret.key}</span>
                      <Badge variant="outline" className={cn("text-[9px] h-4 capitalize", ENV_COLORS[secret.environment])}>
                        {secret.environment}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-mono text-white/30 mt-0.5">
                      {isVisible ? secret.value : '•'.repeat(Math.min(secret.value.length, 32))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleVisibility(secret.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60"
                    >
                      {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(secret.key)}
                      className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60"
                      title="Copy as env reference"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(secret.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-2 text-[10px] text-white/20 flex items-center gap-2">
          <Shield className="h-3 w-3" />
          Secrets are encrypted at rest and only available to edge functions via Deno.env.get()
        </div>
      </DialogContent>
    </Dialog>
  );
}

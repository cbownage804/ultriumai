import { useState } from 'react';
import { X, Shield, Mail, Github, Chrome, Key, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuthProvider {
  id: string;
  name: string;
  icon: typeof Mail;
  enabled: boolean;
  description: string;
  configUrl?: string;
}

interface AuthConfigPanelProps {
  open: boolean;
  onClose: () => void;
  supabaseConfig: { url: string; anonKey: string } | null;
  onGenerateAuthPages: (providers: string[]) => void;
}

export function AuthConfigPanel({ open, onClose, supabaseConfig, onGenerateAuthPages }: AuthConfigPanelProps) {
  const [providers, setProviders] = useState<AuthProvider[]>([
    { id: 'email', name: 'Email / Password', icon: Mail, enabled: true, description: 'Sign up and login with email and password' },
    { id: 'google', name: 'Google OAuth', icon: Chrome, enabled: false, description: 'Sign in with Google account', configUrl: 'https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh/auth/providers' },
    { id: 'github', name: 'GitHub OAuth', icon: Github, enabled: false, description: 'Sign in with GitHub account', configUrl: 'https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh/auth/providers' },
    { id: 'magic_link', name: 'Magic Link', icon: Key, enabled: false, description: 'Passwordless login via email link' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const handleGenerate = async () => {
    const enabled = providers.filter(p => p.enabled).map(p => p.id);
    if (enabled.length === 0) {
      toast.error('Enable at least one auth provider');
      return;
    }
    
    // Check if OAuth providers need configuration
    const oauthProviders = enabled.filter(id => ['google', 'github'].includes(id));
    if (oauthProviders.length > 0) {
      toast.info(
        `Configure ${oauthProviders.join(' & ')} OAuth in your Supabase dashboard before using.`,
        { duration: 5000 }
      );
    }

    setIsGenerating(true);
    onGenerateAuthPages(enabled);
    await new Promise(r => setTimeout(r, 500));
    setIsGenerating(false);
    toast.success('Auth pages generation triggered');
  };

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/80">Authentication</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {!supabaseConfig ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-white/30 text-center">Connect Supabase in Settings to configure authentication.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-wider font-medium">Providers</div>

          <div className="flex-1 overflow-auto px-3 space-y-2">
            {providers.map(provider => {
              const Icon = provider.icon;
              return (
                <div key={provider.id} className="space-y-1">
                  <button
                    onClick={() => toggleProvider(provider.id)}
                    className={cn(
                      "w-full p-2.5 rounded-lg border transition-all text-left",
                      provider.enabled
                        ? "border-violet-500/30 bg-violet-500/[0.05]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center",
                        provider.enabled ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/30"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-white/80">{provider.name}</div>
                        <div className="text-[9px] text-white/30">{provider.description}</div>
                      </div>
                      <div className={cn(
                        "h-4 w-7 rounded-full transition-colors flex items-center px-0.5",
                        provider.enabled ? "bg-violet-500 justify-end" : "bg-white/10 justify-start"
                      )}>
                        <div className="h-3 w-3 rounded-full bg-white" />
                      </div>
                    </div>
                  </button>
                  {provider.enabled && provider.configUrl && (
                    <a
                      href={provider.configUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] text-violet-400/60 hover:text-violet-400 ml-2 transition-colors"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      Configure in Supabase Dashboard
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-white/[0.06]">
            <a
              href="https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh/auth/users"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-cyan-400/60 hover:text-cyan-400 transition-colors mb-2"
            >
              <ExternalLink className="h-3 w-3" />
              View Users in Dashboard
            </a>
          </div>

          <div className="p-3 border-t border-white/[0.06] shrink-0">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || providers.every(p => !p.enabled)}
              className="w-full bg-gradient-to-r from-violet-500 to-violet-400 hover:from-violet-600 hover:to-violet-500 text-white border-0 text-xs h-8"
            >
              {isGenerating ? (
                <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-1.5" />Generate Auth Pages</>
              )}
            </Button>
            <p className="text-[9px] text-white/20 mt-1.5 text-center">
              AI generates login, signup & reset pages using Supabase Auth
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

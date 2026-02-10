import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bot, X, MessageSquare, Unplug, Plug, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface LinkedGPTConfig {
  gptId: string;
  name: string;
  avatarUrl?: string;
  themeColor: string;
  widgetStyle: 'bubble' | 'inline';
  position: 'bottom-right' | 'bottom-left';
  showOnAllPages: boolean;
  welcomeMessage: string;
  placeholderPrompt: string;
}

interface GPTConnectorPanelProps {
  open: boolean;
  onClose: () => void;
  linkedGPT: LinkedGPTConfig | null;
  onLinkGPT: (config: LinkedGPTConfig) => void;
  onUnlinkGPT: () => void;
}

interface SavedGPT {
  id: string;
  name: string;
  avatar_url: string | null;
  theme_color: string | null;
  description: string;
  placeholder_prompt: string | null;
  is_active: boolean;
}

export function GPTConnectorPanel({ open, onClose, linkedGPT, onLinkGPT, onUnlinkGPT }: GPTConnectorPanelProps) {
  const { user } = useAuth();
  const [gpts, setGPTs] = useState<SavedGPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGptId, setSelectedGptId] = useState<string>(linkedGPT?.gptId || '');
  const [widgetStyle, setWidgetStyle] = useState<'bubble' | 'inline'>(linkedGPT?.widgetStyle || 'bubble');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(linkedGPT?.position || 'bottom-right');
  const [showOnAllPages, setShowOnAllPages] = useState(linkedGPT?.showOnAllPages ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    const fetchGPTs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('custom_gpts')
        .select('id, name, avatar_url, theme_color, description, placeholder_prompt, is_active')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setGPTs(data || []);
      setLoading(false);
    };
    fetchGPTs();
  }, [open, user?.id]);

  useEffect(() => {
    if (linkedGPT) {
      setSelectedGptId(linkedGPT.gptId);
      setWidgetStyle(linkedGPT.widgetStyle);
      setPosition(linkedGPT.position);
      setShowOnAllPages(linkedGPT.showOnAllPages);
    }
  }, [linkedGPT]);

  const handleConnect = () => {
    const gpt = gpts.find(g => g.id === selectedGptId);
    if (!gpt) return;

    onLinkGPT({
      gptId: gpt.id,
      name: gpt.name,
      avatarUrl: gpt.avatar_url || undefined,
      themeColor: gpt.theme_color || '#6366f1',
      widgetStyle,
      position,
      showOnAllPages,
      welcomeMessage: gpt.description || `Hi! I'm ${gpt.name}. How can I help?`,
      placeholderPrompt: gpt.placeholder_prompt || 'Ask me anything...',
    });
    toast.success(`Connected "${gpt.name}" to this app`);
  };

  const handleDisconnect = () => {
    onUnlinkGPT();
    setSelectedGptId('');
    toast.success('GPT disconnected from this app');
  };

  const copyEmbedCode = () => {
    if (!linkedGPT) return;
    const code = `<!-- ${linkedGPT.name} Chat Widget -->
<script>
  (function() {
    var w = document.createElement('div');
    w.id = 'gpt-widget-${linkedGPT.gptId}';
    w.style.cssText = 'position:fixed;${linkedGPT.position === 'bottom-right' ? 'bottom:20px;right:20px;' : 'bottom:20px;left:20px;'}z-index:9999;';
    document.body.appendChild(w);
    var s = document.createElement('script');
    s.src = '${window.location.origin}/embed/gpt/${linkedGPT.gptId}.js';
    s.async = true;
    document.body.appendChild(s);
  })();
</script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Embed code copied');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  const selectedGPT = gpts.find(g => g.id === selectedGptId);

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-primary" /> GPT Connector
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Status */}
          {linkedGPT ? (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  {linkedGPT.avatarUrl ? (
                    <img src={linkedGPT.avatarUrl} alt="" className="h-6 w-6 rounded-md object-cover" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{linkedGPT.name}</p>
                  <p className="text-[10px] text-primary">Connected</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-[9px] bg-white/[0.04] border-white/[0.06] text-white/40">
                  {linkedGPT.widgetStyle === 'bubble' ? 'Chat Bubble' : 'Inline Panel'}
                </Badge>
                <Badge variant="secondary" className="text-[9px] bg-white/[0.04] border-white/[0.06] text-white/40">
                  {linkedGPT.position === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] text-center">
              <Unplug className="h-5 w-5 text-white/20 mx-auto mb-2" />
              <p className="text-[11px] text-white/30">No GPT connected</p>
              <p className="text-[10px] text-white/15 mt-1">Select a GPT below to add a chat widget to this app</p>
            </div>
          )}

          {/* GPT Selector */}
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Select GPT</Label>
            {loading ? (
              <div className="text-xs text-white/20 py-4 text-center">Loading your GPTs...</div>
            ) : gpts.length === 0 ? (
              <div className="text-xs text-white/20 py-4 text-center">
                <p>No GPTs found</p>
                <p className="text-[10px] mt-1">Create one in the GPT Builder first</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {gpts.map(gpt => (
                  <button
                    key={gpt.id}
                    onClick={() => setSelectedGptId(gpt.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5",
                      selectedGptId === gpt.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="h-7 w-7 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0">
                      {gpt.avatar_url ? (
                        <img src={gpt.avatar_url} alt="" className="h-5 w-5 rounded object-cover" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/70 truncate">{gpt.name}</p>
                      <p className="text-[10px] text-white/20 truncate">{gpt.description || 'No description'}</p>
                    </div>
                    {gpt.is_active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Widget Settings */}
          {selectedGptId && (
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Widget Style</Label>
                <Select value={widgetStyle} onValueChange={(v: 'bubble' | 'inline') => setWidgetStyle(v)}>
                  <SelectTrigger className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bubble">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" /> Chat Bubble (floating)
                      </span>
                    </SelectItem>
                    <SelectItem value="inline">
                      <span className="flex items-center gap-1.5">
                        <Bot className="h-3 w-3" /> Inline Panel (embedded)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {widgetStyle === 'bubble' && (
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Position</Label>
                  <Select value={position} onValueChange={(v: 'bottom-right' | 'bottom-left') => setPosition(v)}>
                    <SelectTrigger className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-white/40">Show on all pages</Label>
                <Switch checked={showOnAllPages} onCheckedChange={setShowOnAllPages} />
              </div>

              <Button
                variant="premium"
                size="sm"
                className="w-full"
                onClick={linkedGPT?.gptId === selectedGptId ? handleConnect : handleConnect}
              >
                <Plug className="mr-1.5 h-3.5 w-3.5" />
                {linkedGPT ? 'Update Connection' : 'Connect GPT'}
              </Button>

              {linkedGPT && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleDisconnect}
                >
                  <Unplug className="mr-1.5 h-3.5 w-3.5" />
                  Disconnect
                </Button>
              )}
            </div>
          )}

          {/* Embed for external sites */}
          {linkedGPT && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <Label className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Use on other sites</Label>
              <p className="text-[10px] text-white/20">Copy this embed code to add the same GPT to external websites.</p>
              <Button variant="outline" size="sm" className="w-full border-white/[0.08] text-white/50" onClick={copyEmbedCode}>
                {copied ? <Check className="mr-1.5 h-3 w-3 text-green-400" /> : <Copy className="mr-1.5 h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy Embed Code'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

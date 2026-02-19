import { useState } from 'react';
import { X, MessageCircle, Plus, Trash2, Send, Bell, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BotConfig, NotificationChannel, EventType } from '@/hooks/useSlackDiscordBot';

interface SlackDiscordPanelProps {
  bots: BotConfig[];
  logs: any[];
  eventLabels: Record<string, string>;
  onAddBot: (channel: NotificationChannel, webhookUrl: string, name: string) => void;
  onRemoveBot: (id: string) => void;
  onToggleEvent: (botId: string, event: EventType) => void;
  onGenerateCode: (bot: BotConfig) => string;
  onTestNotification: (bot: BotConfig) => void;
  onClose: () => void;
}

export function SlackDiscordPanel({ bots, logs, eventLabels, onAddBot, onRemoveBot, onToggleEvent, onGenerateCode, onTestNotification, onClose }: SlackDiscordPanelProps) {
  const [channel, setChannel] = useState<NotificationChannel>('slack');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [botName, setBotName] = useState('');
  const [showCode, setShowCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allEvents: EventType[] = ['build_success', 'build_failure', 'deploy', 'error_alert', 'new_comment', 'pr_merged'];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0f] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Slack / Discord Bots</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {bots.map(bot => (
          <div key={bot.id} className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${bot.channel === 'slack' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{bot.channel}</span>
                <span className="text-sm text-white">{bot.name}</span>
              </div>
              <button onClick={() => onRemoveBot(bot.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
            </div>
            <div className="flex flex-wrap gap-1">
              {allEvents.map(evt => (
                <button key={evt} onClick={() => onToggleEvent(bot.id, evt)} className={`text-[10px] px-1.5 py-0.5 rounded ${bot.events.includes(evt) ? 'bg-white/10 text-white/80' : 'bg-white/[0.03] text-white/25'}`}>
                  {eventLabels[evt] || evt}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => onTestNotification(bot)} className="h-6 px-2 text-[10px] text-white/40"><Send className="h-3 w-3 mr-1" />Test</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowCode(showCode === bot.id ? null : bot.id); }} className="h-6 px-2 text-[10px] text-white/40"><Copy className="h-3 w-3 mr-1" />Code</Button>
            </div>
            {showCode === bot.id && (
              <div className="relative">
                <pre className="bg-black/40 rounded p-2 text-[10px] text-white/40 font-mono overflow-auto max-h-32">{onGenerateCode(bot).slice(0, 500)}...</pre>
                <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-5 px-1 text-white/30" onClick={() => { navigator.clipboard.writeText(onGenerateCode(bot)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <Label className="text-white/60 text-xs">Add Bot</Label>
          <div className="flex gap-1">
            <button onClick={() => setChannel('slack')} className={`text-xs px-2 py-1 rounded ${channel === 'slack' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-white/40'}`}>Slack</button>
            <button onClick={() => setChannel('discord')} className={`text-xs px-2 py-1 rounded ${channel === 'discord' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.04] text-white/40'}`}>Discord</button>
          </div>
          <Input value={botName} onChange={e => setBotName(e.target.value)} placeholder="Bot name" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8" />
          <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="Webhook URL" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8" />
          <Button size="sm" onClick={() => { if (botName && webhookUrl) { onAddBot(channel, webhookUrl, botName); setBotName(''); setWebhookUrl(''); } }} className="w-full h-8 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/20 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add Bot
          </Button>
        </div>
      </div>
    </div>
  );
}

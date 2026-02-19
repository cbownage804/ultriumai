import { useState } from 'react';

export interface ChatWidgetConfig {
  brandName: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  greeting: string;
  placeholder: string;
  autoReplies: { trigger: string; response: string }[];
  showAvatar: boolean;
  avatarUrl: string;
  enableFileUpload: boolean;
  enableTypingIndicator: boolean;
}

export function useChatWidgetBuilder() {
  const [config, setConfig] = useState<ChatWidgetConfig>({
    brandName: 'Support',
    primaryColor: '#6366f1',
    position: 'bottom-right',
    greeting: 'Hi! How can we help you?',
    placeholder: 'Type your message...',
    autoReplies: [
      { trigger: 'hello', response: 'Hi there! How can I assist you today?' },
      { trigger: 'pricing', response: 'You can find our pricing at /pricing. Would you like more details?' },
    ],
    showAvatar: true,
    avatarUrl: '',
    enableFileUpload: false,
    enableTypingIndicator: true,
  });

  const updateConfig = (updates: Partial<ChatWidgetConfig>) => setConfig(prev => ({ ...prev, ...updates }));

  const addAutoReply = (trigger: string, response: string) => {
    setConfig(prev => ({ ...prev, autoReplies: [...prev.autoReplies, { trigger, response }] }));
  };

  const removeAutoReply = (index: number) => {
    setConfig(prev => ({ ...prev, autoReplies: prev.autoReplies.filter((_, i) => i !== index) }));
  };

  const generateCode = (): string => {
    const autoReplyMap = config.autoReplies.map(r => `    '${r.trigger}': '${r.response}'`).join(',\n');

    return `import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const AUTO_REPLIES: Record<string, string> = {
${autoReplyMap}
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', content: '${config.greeting}', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Auto-reply check
    const lower = input.trim().toLowerCase();
    const match = Object.entries(AUTO_REPLIES).find(([trigger]) => lower.includes(trigger));
    if (match) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', content: match[1], timestamp: new Date() }]);
      }, 800);
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} style={{ position: 'fixed', ${config.position === 'bottom-right' ? 'right: 20' : 'left: 20'}, bottom: 20, width: 56, height: 56, borderRadius: '50%', background: '${config.primaryColor}', color: 'white', border: 'none', cursor: 'pointer', fontSize: 24, zIndex: 9999 }}>
        💬
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', ${config.position === 'bottom-right' ? 'right: 20' : 'left: 20'}, bottom: 20, width: 360, height: 480, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
      <div style={{ padding: '12px 16px', background: '${config.primaryColor}', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>${config.brandName}</span>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 8, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 12, background: m.role === 'user' ? '${config.primaryColor}' : '#f3f4f6', color: m.role === 'user' ? 'white' : '#1f2937', maxWidth: '80%', fontSize: 14 }}>
              {m.content}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="${config.placeholder}" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none', fontSize: 14 }} />
        <button onClick={sendMessage} style={{ padding: '8px 16px', borderRadius: 8, background: '${config.primaryColor}', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Send</button>
      </div>
    </div>
  );
}`;
  };

  return { config, updateConfig, addAutoReply, removeAutoReply, generateCode };
}

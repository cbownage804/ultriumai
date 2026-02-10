import { useState } from 'react';
import { GPTConfig } from '@/types/gptConfig';
import { Bot, Send, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GPTBuilderPreviewProps {
  config: GPTConfig;
}

export function GPTBuilderPreview({ config }: GPTBuilderPreviewProps) {
  const [previewInput, setPreviewInput] = useState('');
  const themeColor = config.theme_color || '#6366f1';

  return (
    <div className="h-full flex flex-col bg-[#0a0a0c]">
      {/* Preview Header */}
      <div className="h-10 shrink-0 flex items-center justify-center border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Live Preview</span>
      </div>

      {/* Phone Frame */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-[380px] h-[640px] rounded-[2rem] border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        >
          {/* Chat Header */}
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${themeColor}20, transparent)` }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: themeColor }}
            >
              {config.avatar_url ? (
                <img src={config.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {config.name || 'Your GPT'}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-white/40">Online</span>
                {config.enable_web_search && (
                  <>
                    <span className="text-white/20">·</span>
                    <Globe className="h-3 w-3 text-white/30" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Welcome Message */}
            {config.welcome_message && (
              <div className="flex gap-2.5">
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: themeColor }}
                >
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-xs text-white/70 leading-relaxed">{config.welcome_message}</p>
                </div>
              </div>
            )}

            {/* Starter Questions */}
            {config.starter_questions.length > 0 && (
              <div className="space-y-1.5 pl-8">
                {config.starter_questions.map((q, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <p className="text-[11px] text-white/50">{q}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!config.welcome_message && config.starter_questions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 opacity-30"
                  style={{ backgroundColor: themeColor }}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs text-white/20 max-w-[200px]">
                  Describe your GPT in the chat panel and watch the preview update live
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 px-3 pb-4 pt-2">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5">
              <input
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                placeholder={config.placeholder_prompt || 'Ask me anything...'}
                className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
                disabled
              />
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            {config.description && (
              <p className="text-[10px] text-white/20 text-center mt-2 px-4 truncate">
                {config.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

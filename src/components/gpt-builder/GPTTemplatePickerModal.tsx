import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Database, Globe, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  icon: typeof MessageSquare;
  label: string;
  desc: string;
  features: string[];
  color: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'support',
    icon: MessageSquare,
    label: 'Customer Support Bot',
    desc: 'AI trained on your knowledge base to handle tier-1 support tickets with empathy and accuracy.',
    features: ['KB-powered answers', 'Escalation handling', 'Multi-language'],
    color: 'from-blue-500/20 to-blue-600/10',
  },
  {
    id: 'knowledge',
    icon: Database,
    label: 'Knowledge Base Q&A',
    desc: 'Query internal documentation in natural language with cited, sourced answers.',
    features: ['Document citations', 'Semantic search', 'Context-aware'],
    color: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    id: 'lead',
    icon: Globe,
    label: 'Website Lead Bot',
    desc: 'Qualify website visitors, understand their needs, and capture contact info 24/7.',
    features: ['Lead qualification', 'CRM-ready data', 'Conversational'],
    color: 'from-amber-500/20 to-amber-600/10',
  },
  {
    id: 'docs',
    icon: FileText,
    label: 'Doc Analyzer',
    desc: 'Upload contracts, proposals, or reports and get instant summaries and key insights.',
    features: ['Contract review', 'Risk detection', 'Key terms extraction'],
    color: 'from-violet-500/20 to-violet-600/10',
  },
];

interface GPTTemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateId: string) => void;
}

export function GPTTemplatePickerModal({ open, onOpenChange, onSelect }: GPTTemplatePickerModalProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#0d0d14] border-white/[0.08] text-white p-0 overflow-hidden">
        <div className="relative px-6 pt-6 pb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-violet-500/[0.03] to-transparent pointer-events-none" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Start from a Template
            </DialogTitle>
            <p className="text-sm text-white/40 mt-1">
              Pre-configured GPTs ready to customize. Pick one and make it yours.
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { onSelect(t.id); onOpenChange(false); }}
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all duration-200",
                  hoveredId === t.id
                    ? "border-primary/40 bg-white/[0.04] shadow-lg shadow-primary/5"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
                )}
              >
                <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 border border-white/[0.04]", t.color)}>
                  <Icon className="h-4.5 w-4.5 text-white/70" />
                </div>
                <p className="font-semibold text-sm text-white/90 mb-1">{t.label}</p>
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">{t.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.features.map(f => (
                    <Badge key={f} variant="secondary" className="text-[9px] px-1.5 py-0 bg-white/[0.04] text-white/40 border-white/[0.06]">
                      {f}
                    </Badge>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white">
            Start from scratch instead
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

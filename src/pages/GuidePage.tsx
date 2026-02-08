/**
 * Full Platform Guide Page
 * Comprehensive how-to documentation for all UltriumAI products
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, ArrowLeft, Shield, Brain, Target, Settings,
  ChevronRight, Lightbulb, Monitor, Ticket, AlertTriangle, FileText,
  Cpu, Eye, Lock, ScanLine, Globe, LayoutDashboard, Users, Crosshair,
  ClipboardCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getInstructionsByProduct, PageInstruction } from '@/config/pageInstructions';
import { cn } from '@/lib/utils';

const productMeta = {
  vanguard: {
    label: 'Vanguard',
    description: 'MSP management platform – RMM, service desk, security, documentation, and compliance.',
    icon: Target,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  safesuite: {
    label: 'SafeSuite',
    description: 'Personal security suite – passwords, threat scanning, and dark web monitoring.',
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'ai-studio': {
    label: 'AI Studio',
    description: 'Build and deploy custom AI assistants powered by GPT.',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  general: {
    label: 'Platform',
    description: 'Hub navigation, settings, keyboard shortcuts, and general platform features.',
    icon: Settings,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
};

const moduleIcons: Record<string, any> = {
  'vanguard-dashboard': LayoutDashboard,
  'vanguard-tickets': Ticket,
  'vanguard-devices': Monitor,
  'vanguard-alerts': AlertTriangle,
  'vanguard-atlas': FileText,
  'vanguard-cortex': Cpu,
  'vanguard-customers': Users,
  'vanguard-sentinel': Eye,
  'vanguard-recon': Crosshair,
  'vanguard-comply': ClipboardCheck,
  'safesuite-dashboard': LayoutDashboard,
  'safesuite-pass': Lock,
  'safesuite-scan': ScanLine,
  'safesuite-web': Globe,
  'ai-studio-dashboard': LayoutDashboard,
  'product-hub': LayoutDashboard,
  'settings': Settings,
};

export default function GuidePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const groupedInstructions = getInstructionsByProduct();

  useEffect(() => {
    document.title = 'Platform Guide | UltriumAI';
  }, []);

  // Filter instructions based on search
  const filterInstructions = (instructions: PageInstruction[]) => {
    if (!searchQuery) return instructions;
    const q = searchQuery.toLowerCase();
    return instructions.filter(
      inst =>
        inst.title.toLowerCase().includes(q) ||
        inst.description.toLowerCase().includes(q) ||
        inst.sections.some(s =>
          s.heading.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          (s.tips && s.tips.some(t => t.toLowerCase().includes(q)))
        )
    );
  };

  const productsToShow = selectedProduct
    ? { [selectedProduct]: groupedInstructions[selectedProduct] }
    : groupedInstructions;

  const hasResults = Object.values(productsToShow).some(
    instructions => filterInstructions(instructions).length > 0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Platform Guide
            </h1>
            <p className="text-sm text-muted-foreground">
              Learn how to use every feature across UltriumAI
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides... (e.g. 'tickets', 'password', 'scan')"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Product Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedProduct === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedProduct(null)}
          >
            All Products
          </Button>
          {Object.entries(productMeta).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Button
                key={key}
                variant={selectedProduct === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProduct(selectedProduct === key ? null : key)}
                className="gap-1.5"
              >
                <Icon className={cn('h-4 w-4', selectedProduct !== key && meta.color)} />
                {meta.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        {!hasResults ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No matching guides found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(productsToShow).map(([product, instructions]) => {
              const filtered = filterInstructions(instructions);
              if (filtered.length === 0) return null;
              const meta = productMeta[product as keyof typeof productMeta];
              const ProductIcon = meta.icon;

              return (
                <motion.section
                  key={product}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Product Header */}
                  <div className={cn('flex items-center gap-3 mb-4 p-4 rounded-xl border', meta.bgColor, meta.borderColor)}>
                    <div className={cn('p-2 rounded-lg', meta.bgColor)}>
                      <ProductIcon className={cn('h-6 w-6', meta.color)} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{meta.label}</h2>
                      <p className="text-sm text-muted-foreground">{meta.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {filtered.length} {filtered.length === 1 ? 'guide' : 'guides'}
                    </Badge>
                  </div>

                  {/* Module Guides */}
                  <Accordion type="multiple" className="space-y-2">
                    {filtered.map(instruction => {
                      const ModuleIcon = moduleIcons[instruction.id] || BookOpen;
                      return (
                        <AccordionItem
                          key={instruction.id}
                          value={instruction.id}
                          className="border rounded-lg px-4 bg-card"
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-3 text-left">
                              <ModuleIcon className={cn('h-5 w-5 flex-shrink-0', meta.color)} />
                              <div>
                                <p className="font-medium">{instruction.title}</p>
                                <p className="text-xs text-muted-foreground font-normal">
                                  {instruction.description}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-5 pb-2 pt-1">
                              {instruction.sections.map((section, idx) => (
                                <div key={idx} className="space-y-2">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    {section.heading}
                                  </h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed pl-7">
                                    {section.content}
                                  </p>
                                  {section.tips && section.tips.length > 0 && (
                                    <div className="pl-7 space-y-1 mt-1.5">
                                      {section.tips.map((tip, tipIdx) => (
                                        <div key={tipIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                          <span>{tip}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </motion.section>
              );
            })}
          </div>
        )}

        {/* Keyboard shortcuts section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 p-6 rounded-xl border border-border/50 bg-muted/30"
        >
          <h2 className="text-lg font-bold mb-4">⌨️ Keyboard Shortcuts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { keys: 'Cmd/Ctrl + K', action: 'Open Spotlight Search' },
              { keys: 'Shift + ?', action: 'Show keyboard shortcuts overlay' },
              { keys: '?', action: 'Open page help (when not in a text field)' },
              { keys: 'Escape', action: 'Close modals and panels' },
              { keys: '→ / Enter', action: 'Next step in guided tours' },
              { keys: '← ', action: 'Previous step in guided tours' },
            ].map(shortcut => (
              <div key={shortcut.keys} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50">
                <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{shortcut.keys}</kbd>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

/**
 * FloatingRayChat — global "Ask Ray" affordance.
 *
 * Slice 2 of v0.4: unify the "pick a skill" mental model. A single floating
 * button opens a full Ray conversation (via RaySkillsPanel) from anywhere in
 * the app. Other surfaces (recommendations, findings, dashboards) can open
 * Ray and seed a question via the `ray:panel-open` custom event.
 */
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import RaySkillsPanel from './RaySkillsPanel';

export type RayPanelOpenDetail = {
  message?: string;
  context?: {
    kind: 'recommendation' | 'finding' | 'device' | 'identity' | 'other';
    id?: string;
    title?: string;
    body?: string;
    evidence?: Record<string, unknown>;
  };
};

export function FloatingRayChat() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<RayPanelOpenDetail>).detail ?? {};
      setOpen(true);
      // Give the sheet a tick to mount RaySkillsPanel, then forward.
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('ray:panel-send', { detail }),
        );
      }, 60);
    }
    window.addEventListener('ray:panel-open', onOpen);
    return () => window.removeEventListener('ray:panel-open', onOpen);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          aria-label="Ask Ray"
          className="fixed bottom-5 right-5 z-40 h-12 gap-2 rounded-full shadow-lg bg-[hsl(262_60%_64%)] hover:bg-[hsl(262_60%_58%)] text-white pl-3 pr-4 safe-area-inset-bottom"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Ask Ray</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 border-l bg-background overflow-hidden"
      >
        <div className="h-full p-4">
          <RaySkillsPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FloatingRayChat;

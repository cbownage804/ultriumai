import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Widget, useWidgetLayout } from '@/hooks/useWidgetLayout';
import { cn } from '@/lib/utils';

export function WidgetCustomizer() {
  const {
    widgets,
    toggleWidget,
    reorderWidgets,
    setWidgetSize,
    resetLayout,
    isCustomizing,
    setIsCustomizing,
  } = useWidgetLayout();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderWidgets(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={isCustomizing} onOpenChange={setIsCustomizing}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-black border-l border-cyan-500/30 w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-cyan-400" />
            Customize Dashboard
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Drag to reorder, toggle visibility, and resize widgets.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-2">
          {sortedWidgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move",
                widget.visible
                  ? "bg-cyan-500/5 border-cyan-500/20"
                  : "bg-slate-900/50 border-slate-700/30 opacity-60",
                draggedIndex === index && "ring-2 ring-cyan-400 scale-[1.02]"
              )}
            >
              <GripVertical className="h-4 w-4 text-slate-500 shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {widget.visible ? (
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span className={cn(
                    "font-medium text-sm truncate",
                    widget.visible ? "text-white" : "text-slate-500"
                  )}>
                    {widget.title}
                  </span>
                </div>
              </div>

              <Select
                value={widget.size}
                onValueChange={(value: Widget['size']) => setWidgetSize(widget.id, value)}
                disabled={!widget.visible}
              >
                <SelectTrigger className="w-24 h-8 text-xs bg-black/50 border-cyan-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="small" className="text-slate-200">Small</SelectItem>
                  <SelectItem value="medium" className="text-slate-200">Medium</SelectItem>
                  <SelectItem value="large" className="text-slate-200">Large</SelectItem>
                </SelectContent>
              </Select>

              <Switch
                checked={widget.visible}
                onCheckedChange={() => toggleWidget(widget.id)}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
          ))}
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            onClick={resetLayout}
            className="w-full gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Changes are saved automatically
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

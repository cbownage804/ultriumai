import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Download, Archive, Tag, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive';
  onClick: (selectedIds: string[]) => void;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  actions: BulkAction[];
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  selectedIds,
  onClearSelection,
  onSelectAll,
  actions,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  const primaryActions = actions.slice(0, 3);
  const overflowActions = actions.slice(3);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 backdrop-blur-sm"
      >
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {selectedCount} selected
          </span>
          {selectedCount < totalCount ? (
            <button
              onClick={onSelectAll}
              className="text-xs text-primary/70 hover:text-primary underline"
            >
              Select all {totalCount}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">(all)</span>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Primary actions */}
        <div className="flex items-center gap-1.5">
          {primaryActions.map(action => (
            <Button
              key={action.id}
              variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => action.onClick(selectedIds)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}

          {/* Overflow menu */}
          {overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {overflowActions.map(action => (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => action.onClick(selectedIds)}
                    className={action.variant === 'destructive' ? 'text-destructive' : ''}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="ml-auto h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing bulk selection state
import { useState, useCallback } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(i => i.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const rangeSelect = useCallback((id: string, allIds: string[]) => {
    if (selectedIds.size === 0) {
      setSelectedIds(new Set([id]));
      return;
    }
    const lastSelected = [...selectedIds].pop()!;
    const startIdx = allIds.indexOf(lastSelected);
    const endIdx = allIds.indexOf(id);
    if (startIdx === -1 || endIdx === -1) return;
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const range = allIds.slice(from, to + 1);
    setSelectedIds(prev => new Set([...prev, ...range]));
  }, [selectedIds]);

  return {
    selectedIds: [...selectedIds],
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
    rangeSelect,
  };
}

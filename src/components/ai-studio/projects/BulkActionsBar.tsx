import { Trash2, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

export function BulkActionsBar({
  selectedCount, totalCount, onSelectAll, onClearSelection, onBulkDelete,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 animate-in slide-in-from-top-2">
      <CheckSquare className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>
      
      <div className="flex items-center gap-2 ml-auto">
        {selectedCount < totalCount && (
          <Button variant="ghost" size="sm" onClick={onSelectAll} className="text-xs h-7">
            Select all ({totalCount})
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="text-xs h-7"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete ({selectedCount})
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-xs h-7">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

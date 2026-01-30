/**
 * BulkActionBar - Floating action bar for bulk ticket operations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  Trash2, 
  Download, 
  MoreHorizontal,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onAssign?: (ids: string[], userId: string) => Promise<void>;
  onChangeStatus?: (ids: string[], status: string) => Promise<void>;
  onDelete?: (ids: string[]) => Promise<void>;
  onExport?: (ids: string[], format: 'csv' | 'pdf') => void;
  users?: Array<{ id: string; name: string }>;
  className?: string;
}

export function BulkActionBar({
  selectedIds,
  onClearSelection,
  onAssign,
  onChangeStatus,
  onDelete,
  onExport,
  users = [],
  className,
}: BulkActionBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleAssign = async (userId: string) => {
    if (!onAssign) return;
    setIsProcessing(true);
    try {
      await onAssign(selectedIds, userId);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!onChangeStatus) return;
    setIsProcessing(true);
    try {
      await onChangeStatus(selectedIds, status);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsProcessing(true);
    try {
      await onDelete(selectedIds);
      onClearSelection();
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    onExport?.(selectedIds, format);
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-card/95 backdrop-blur-xl border border-border shadow-2xl',
          'animate-in slide-in-from-bottom-4 duration-300',
          className
        )}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <Badge variant="secondary" className="font-semibold">
            {selectedIds.length}
          </Badge>
          <span className="text-sm text-muted-foreground">selected</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1"
            onClick={onClearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Assign action */}
        {onAssign && users.length > 0 && (
          <Select onValueChange={handleAssign} disabled={isProcessing}>
            <SelectTrigger className="w-[140px] h-9">
              <UserPlus className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Assign to" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status change action */}
        {onChangeStatus && (
          <Select onValueChange={handleStatusChange} disabled={isProcessing}>
            <SelectTrigger className="w-[140px] h-9">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Export dropdown */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Delete action */}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} tickets?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              tickets and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

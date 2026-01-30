/**
 * DeviceBulkActions - Floating action bar for bulk RMM device operations
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
  Play, 
  RotateCcw, 
  Trash2, 
  Download, 
  Power,
  FileSpreadsheet,
  FileText,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceBulkActionsProps {
  selectedDevices: string[];
  onClearSelection: () => void;
  onRunScript?: (devices: string[], scriptId: string) => Promise<void>;
  onRestart?: (devices: string[]) => Promise<void>;
  onShutdown?: (devices: string[]) => Promise<void>;
  onRemove?: (devices: string[]) => Promise<void>;
  onExport?: (devices: string[], format: 'csv' | 'pdf') => void;
  scripts?: Array<{ id: string; name: string }>;
  className?: string;
}

export function DeviceBulkActions({
  selectedDevices,
  onClearSelection,
  onRunScript,
  onRestart,
  onShutdown,
  onRemove,
  onExport,
  scripts = [],
  className,
}: DeviceBulkActionsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showShutdownDialog, setShowShutdownDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedDevices.length === 0) return null;

  const handleRunScript = async (scriptId: string) => {
    if (!onRunScript) return;
    setIsProcessing(true);
    try {
      await onRunScript(selectedDevices, scriptId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestart = async () => {
    if (!onRestart) return;
    setIsProcessing(true);
    try {
      await onRestart(selectedDevices);
      onClearSelection();
    } finally {
      setIsProcessing(false);
      setShowRestartDialog(false);
    }
  };

  const handleShutdown = async () => {
    if (!onShutdown) return;
    setIsProcessing(true);
    try {
      await onShutdown(selectedDevices);
      onClearSelection();
    } finally {
      setIsProcessing(false);
      setShowShutdownDialog(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setIsProcessing(true);
    try {
      await onRemove(selectedDevices);
      onClearSelection();
    } finally {
      setIsProcessing(false);
      setShowRemoveDialog(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    onExport?.(selectedDevices, format);
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-card/95 backdrop-blur-xl border border-safeops/30 shadow-2xl shadow-safeops/10',
          'animate-in slide-in-from-bottom-4 duration-300',
          className
        )}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <Badge className="font-semibold bg-safeops text-safeops-foreground">
            {selectedDevices.length}
          </Badge>
          <span className="text-sm text-muted-foreground">devices</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1"
            onClick={onClearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Run Script action */}
        {onRunScript && scripts.length > 0 && (
          <Select onValueChange={handleRunScript} disabled={isProcessing}>
            <SelectTrigger className="w-[150px] h-9 border-safeops/30">
              <Terminal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Run script" />
            </SelectTrigger>
            <SelectContent>
              {scripts.map((script) => (
                <SelectItem key={script.id} value={script.id}>
                  {script.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Restart action */}
        {onRestart && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-safeops/30 hover:bg-safeops/10"
            onClick={() => setShowRestartDialog(true)}
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>
        )}

        {/* Shutdown action */}
        {onShutdown && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-orange-500/30 hover:bg-orange-500/10 text-orange-500"
            onClick={() => setShowShutdownDialog(true)}
            disabled={isProcessing}
          >
            <Power className="h-4 w-4 mr-2" />
            Shutdown
          </Button>
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

        {/* Remove action */}
        {onRemove && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9"
            onClick={() => setShowRemoveDialog(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Restart confirmation dialog */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart {selectedDevices.length} devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a restart command to all selected devices. Any unsaved work
              on those devices may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestart}
              disabled={isProcessing}
              className="bg-safeops text-safeops-foreground hover:bg-safeops/90"
            >
              {isProcessing ? 'Restarting...' : 'Restart Devices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shutdown confirmation dialog */}
      <AlertDialog open={showShutdownDialog} onOpenChange={setShowShutdownDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Shutdown {selectedDevices.length} devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a shutdown command to all selected devices. The devices
              will need to be manually powered on again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleShutdown}
              disabled={isProcessing}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {isProcessing ? 'Shutting down...' : 'Shutdown Devices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selectedDevices.length} devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected devices from monitoring. You can re-add them
              later by reinstalling the agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Removing...' : 'Remove Devices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

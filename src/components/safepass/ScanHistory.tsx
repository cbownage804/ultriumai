import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  History, 
  Trash2, 
  Shield,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface BreachScan {
  id: string;
  scan_type: string;
  total_entries_scanned: number;
  compromised_count: number;
  weak_count: number;
  reused_count: number;
  overall_score: number;
  scan_results: any;
  completed_at: string;
}

interface ScanHistoryProps {
  scans: BreachScan[];
  onScanDeleted: () => void;
  onScanSelect?: (scan: BreachScan) => void;
}

export const ScanHistory = ({ scans, onScanDeleted, onScanSelect }: ScanHistoryProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (scanId: string) => {
    setDeletingId(scanId);
    try {
      const { error } = await supabase
        .from('safepass_breach_scans')
        .delete()
        .eq('id', scanId);

      if (error) throw error;
      
      toast.success('Scan deleted');
      onScanDeleted();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete scan');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-primary/10';
    if (score >= 40) return 'bg-primary/10';
    return 'bg-red-500/10';
  };

  if (scans.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Scan History
          </CardTitle>
          <CardDescription>
            Previous security scans and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {scans.map((scan) => (
                <div 
                  key={scan.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  {/* Score Badge */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-lg ${getScoreBg(scan.overall_score)} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${getScoreColor(scan.overall_score)}`}>
                      {scan.overall_score}%
                    </span>
                  </div>

                  {/* Scan Details */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onScanSelect?.(scan)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {format(new Date(scan.completed_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {scan.scan_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {scan.total_entries_scanned} checked
                      </span>
                      {scan.compromised_count > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <ShieldAlert className="h-3 w-3" />
                          {scan.compromised_count} breached
                        </span>
                      )}
                      {scan.weak_count > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <AlertTriangle className="h-3 w-3" />
                          {scan.weak_count} weak
                        </span>
                      )}
                      {scan.reused_count > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <RefreshCw className="h-3 w-3" />
                          {scan.reused_count} reused
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(scan.id);
                    }}
                    disabled={deletingId === scan.id}
                  >
                    {deletingId === scan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scan from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

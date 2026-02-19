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
import { FileCode, Clock } from 'lucide-react';
import type { RecoverableSession } from '@/hooks/useIndexedDBPersistence';

interface Props {
  session: RecoverableSession | null;
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}

export function SessionRecoveryDialog({ session, open, onRestore, onDiscard }: Props) {
  if (!session) return null;

  const savedDate = new Date(session.savedAt);
  const timeAgo = getTimeAgo(savedDate);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-[#141416] border-white/10 text-white max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg">
            <FileCode className="h-5 w-5 text-violet-400" />
            Recover unsaved work?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/50 space-y-3">
            <p>You have unsaved changes from a previous session.</p>
            <div className="bg-white/5 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/70 font-medium">{session.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>{session.files.length} file{session.files.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onDiscard}
            className="bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          >
            Discard
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onRestore}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Restore
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

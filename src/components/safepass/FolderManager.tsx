/**
 * Folder Manager - Organize passwords into folders
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FolderPlus, Folder, FolderOpen, ChevronRight, MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface FolderItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
  parent_folder_id?: string;
  entry_count?: number;
}

interface FolderManagerProps {
  vaultId?: string;
  selectedFolderId?: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export const FolderManager = ({ vaultId, selectedFolderId, onFolderSelect }: FolderManagerProps) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const loadFolders = useCallback(async () => {
    if (!user || !vaultId) return;

    try {
      const { data, error } = await supabase
        .from('safepass_folders')
        .select('*')
        .eq('user_id', user.id)
        .eq('vault_id', vaultId)
        .order('sort_order');

      if (error) throw error;

      // Get entry counts per folder
      const { data: entryCounts } = await supabase
        .from('safepass_entries')
        .select('folder_id')
        .eq('vault_id', vaultId);

      const countMap: Record<string, number> = {};
      entryCounts?.forEach(e => {
        if (e.folder_id) {
          countMap[e.folder_id] = (countMap[e.folder_id] || 0) + 1;
        }
      });

      setFolders((data || []).map(f => ({
        id: f.id,
        name: f.name,
        icon: f.icon || 'folder',
        color: f.color,
        parent_folder_id: f.parent_folder_id,
        entry_count: countMap[f.id] || 0
      })));
    } catch (error) {
      console.error('Failed to load folders');
    }
  }, [user, vaultId]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleCreateFolder = async () => {
    if (!user || !vaultId || !newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('safepass_folders')
        .insert({
          user_id: user.id,
          vault_id: vaultId,
          name: newFolderName.trim(),
          parent_folder_id: selectedFolderId || null
        });

      if (error) throw error;

      toast.success('Folder created');
      setNewFolderName('');
      setIsCreateOpen(false);
      loadFolders();
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('safepass_folders')
        .update({ name: newFolderName.trim() })
        .eq('id', editingFolder.id);

      if (error) throw error;

      toast.success('Folder renamed');
      setEditingFolder(null);
      setNewFolderName('');
      loadFolders();
    } catch (error) {
      toast.error('Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Passwords inside will be moved to "No Folder".')) return;

    try {
      // First, unset folder_id on entries
      await supabase
        .from('safepass_entries')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      const { error } = await supabase
        .from('safepass_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Folder deleted');
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
      loadFolders();
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  const toggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolder = (folder: FolderItem, depth = 0) => {
    const hasChildren = folders.some(f => f.parent_folder_id === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 group",
            isSelected && "bg-primary/10 text-primary"
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {hasChildren && (
            <button onClick={() => toggleExpand(folder.id)} className="p-0.5">
              <ChevronRight 
                className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} 
              />
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          
          <button
            onClick={() => onFolderSelect(folder.id)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {isSelected ? (
              <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />
            ) : (
              <Folder className="h-4 w-4" style={{ color: folder.color }} />
            )}
            <span className="text-sm truncate">{folder.name}</span>
            {folder.entry_count !== undefined && folder.entry_count > 0 && (
              <span className="text-xs text-muted-foreground">({folder.entry_count})</span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingFolder(folder);
                setNewFolderName(folder.name);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteFolder(folder.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {folders
              .filter(f => f.parent_folder_id === folder.id)
              .map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const topLevelFolders = folders.filter(f => !f.parent_folder_id);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">Folders</span>
        <Dialog open={isCreateOpen || !!editingFolder} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingFolder(null);
            setNewFolderName('');
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreateOpen(true)}>
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFolder ? 'Rename Folder' : 'New Folder'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingFolder ? handleRenameFolder() : handleCreateFolder();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={editingFolder ? handleRenameFolder : handleCreateFolder}
                  className="flex-1"
                >
                  {editingFolder ? 'Rename' : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingFolder(null);
                  setNewFolderName('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Items */}
      <button
        onClick={() => onFolderSelect(null)}
        className={cn(
          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left hover:bg-muted/50",
          selectedFolderId === null && "bg-primary/10 text-primary"
        )}
      >
        <Star className="h-4 w-4" />
        <span className="text-sm">All Items</span>
      </button>

      {/* Folder Tree */}
      {topLevelFolders.map(folder => renderFolder(folder))}
    </div>
  );
};

export default FolderManager;

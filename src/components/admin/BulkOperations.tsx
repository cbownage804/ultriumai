import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Mail, Ban, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkOperationsProps {
  selectedItems: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
  entityType: 'users' | 'msps' | 'gpts' | 'subscriptions';
}

export const BulkOperations = ({ selectedItems, onClearSelection, onRefresh, entityType }: BulkOperationsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBulkOperation = async () => {
    if (!operation || selectedItems.length === 0) return;

    setLoading(true);
    try {
      switch (entityType) {
        case 'users':
          await handleUsersBulkOperation();
          break;
        case 'msps':
          await handleMSPsBulkOperation();
          break;
        case 'gpts':
          await handleGPTsBulkOperation();
          break;
        case 'subscriptions':
          await handleSubscriptionsBulkOperation();
          break;
      }

      toast({
        title: "Success",
        description: `Bulk operation completed for ${selectedItems.length} items`,
      });
      
      onRefresh();
      onClearSelection();
      setIsOpen(false);
      setOperation('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete bulk operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUsersBulkOperation = async () => {
    switch (operation) {
      case 'delete':
        await supabase
          .from('profiles')
          .delete()
          .in('id', selectedItems);
        break;
      case 'export':
        await exportData('users');
        return;
    }
  };

  const handleMSPsBulkOperation = async () => {
    switch (operation) {
      case 'deactivate':
        await supabase
          .from('msps')
          .update({ is_active: false })
          .in('id', selectedItems);
        break;
      case 'activate':
        await supabase
          .from('msps')
          .update({ is_active: true })
          .in('id', selectedItems);
        break;
      case 'export':
        await exportData('msps');
        return;
    }
  };

  const handleGPTsBulkOperation = async () => {
    switch (operation) {
      case 'deactivate':
        await supabase
          .from('custom_gpts')
          .update({ is_active: false })
          .in('id', selectedItems);
        break;
      case 'activate':
        await supabase
          .from('custom_gpts')
          .update({ is_active: true })
          .in('id', selectedItems);
        break;
      case 'delete':
        await supabase
          .from('custom_gpts')
          .delete()
          .in('id', selectedItems);
        break;
      case 'export':
        await exportData('gpts');
        return;
    }
  };

  const handleSubscriptionsBulkOperation = async () => {
    switch (operation) {
      case 'cancel':
        await supabase
          .from('subscribers')
          .update({ subscribed: false })
          .in('id', selectedItems);
        break;
      case 'export':
        await exportData('subscriptions');
        return;
    }
  };

  const exportData = async (type: string) => {
    let query = supabase.from(getTableName(type)).select('*').in('id', selectedItems);
    
    const { data, error } = await query;
    if (error) throw error;

    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getTableName = (type: string) => {
    switch (type) {
      case 'users': return 'profiles';
      case 'msps': return 'msps';
      case 'gpts': return 'custom_gpts';
      case 'subscriptions': return 'subscribers';
      default: return 'profiles';
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const getOperationOptions = () => {
    switch (entityType) {
      case 'users':
        return [
          { value: 'delete', label: 'Delete Users', icon: Trash2 },
          { value: 'export', label: 'Export Data', icon: Download },
        ];
      case 'msps':
        return [
          { value: 'activate', label: 'Activate MSPs', icon: CheckCircle },
          { value: 'deactivate', label: 'Deactivate MSPs', icon: Ban },
          { value: 'export', label: 'Export Data', icon: Download },
        ];
      case 'gpts':
        return [
          { value: 'activate', label: 'Activate GPTs', icon: CheckCircle },
          { value: 'deactivate', label: 'Deactivate GPTs', icon: Ban },
          { value: 'delete', label: 'Delete GPTs', icon: Trash2 },
          { value: 'export', label: 'Export Data', icon: Download },
        ];
      case 'subscriptions':
        return [
          { value: 'cancel', label: 'Cancel Subscriptions', icon: Ban },
          { value: 'export', label: 'Export Data', icon: Download },
        ];
      default:
        return [];
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
      <Badge variant="secondary">
        {selectedItems.length} selected
      </Badge>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Bulk Actions
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedItems.length} selected {entityType}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Select an operation" />
              </SelectTrigger>
              <SelectContent>
                {getOperationOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkOperation} 
                disabled={!operation || loading}
                variant={operation === 'delete' ? 'destructive' : 'default'}
              >
                {loading ? 'Processing...' : 'Execute'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear Selection
      </Button>
    </div>
  );
};
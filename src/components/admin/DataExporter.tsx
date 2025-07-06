import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Database, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DataExporterProps {
  entityType: 'users' | 'msps' | 'gpts' | 'subscriptions' | 'analytics';
}

export const DataExporter = ({ entityType }: DataExporterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | 'custom'>('30d');
  const [includeRelatedData, setIncludeRelatedData] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getAvailableFields = () => {
    switch (entityType) {
      case 'users':
        return [
          { id: 'email', label: 'Email', default: true },
          { id: 'full_name', label: 'Full Name', default: true },
          { id: 'account_type', label: 'Account Type', default: true },
          { id: 'company_name', label: 'Company Name', default: true },
          { id: 'created_at', label: 'Created Date', default: true },
          { id: 'last_login', label: 'Last Login', default: false },
          { id: 'subscription_info', label: 'Subscription Info', default: true },
          { id: 'credit_usage', label: 'Credit Usage', default: false },
        ];
      case 'msps':
        return [
          { id: 'company_name', label: 'Company Name', default: true },
          { id: 'contact_email', label: 'Contact Email', default: true },
          { id: 'subscription_tier', label: 'Tier', default: true },
          { id: 'max_clients', label: 'Max Clients', default: true },
          { id: 'current_clients', label: 'Current Clients', default: true },
          { id: 'monthly_revenue', label: 'Monthly Revenue', default: true },
          { id: 'created_at', label: 'Created Date', default: true },
          { id: 'trial_ends_at', label: 'Trial End Date', default: false },
        ];
      case 'gpts':
        return [
          { id: 'name', label: 'GPT Name', default: true },
          { id: 'owner_email', label: 'Owner Email', default: true },
          { id: 'sharing_level', label: 'Sharing Level', default: true },
          { id: 'chat_count', label: 'Chat Count', default: true },
          { id: 'ai_model', label: 'AI Model', default: true },
          { id: 'created_at', label: 'Created Date', default: true },
          { id: 'last_activity', label: 'Last Activity', default: false },
        ];
      case 'subscriptions':
        return [
          { id: 'user_email', label: 'User Email', default: true },
          { id: 'subscription_tier', label: 'Tier', default: true },
          { id: 'subscribed', label: 'Active Status', default: true },
          { id: 'subscription_start', label: 'Start Date', default: true },
          { id: 'subscription_end', label: 'End Date', default: true },
          { id: 'billing_amount', label: 'Billing Amount', default: true },
          { id: 'payment_method', label: 'Payment Method', default: false },
        ];
      case 'analytics':
        return [
          { id: 'date', label: 'Date', default: true },
          { id: 'gpt_name', label: 'GPT Name', default: true },
          { id: 'user_email', label: 'User Email', default: true },
          { id: 'total_conversations', label: 'Conversations', default: true },
          { id: 'total_messages', label: 'Messages', default: true },
          { id: 'total_tokens', label: 'Tokens Used', default: true },
          { id: 'unique_users', label: 'Unique Users', default: false },
          { id: 'avg_response_time', label: 'Avg Response Time', default: false },
        ];
      default:
        return [];
    }
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field to export",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchExportData();
      const filename = generateFilename();
      
      if (exportFormat === 'csv') {
        downloadCSV(data, filename);
      } else {
        downloadJSON(data, filename);
      }

      toast({
        title: "Export Complete",
        description: `${data.length} records exported successfully`,
      });

      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExportData = async () => {
    const { from, to } = getDateRange();
    let query = supabase.from(getTableName()).select(getSelectQuery());

    if (from && to) {
      query = query.gte('created_at', from.toISOString()).lte('created_at', to.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const getTableName = () => {
    switch (entityType) {
      case 'users': return 'profiles';
      case 'msps': return 'msps';
      case 'gpts': return 'custom_gpts';
      case 'subscriptions': return 'subscribers';
      case 'analytics': return 'daily_analytics';
      default: return 'profiles';
    }
  };

  const getSelectQuery = () => {
    if (includeRelatedData) {
      switch (entityType) {
        case 'users':
          return `*, subscribers(*), user_credits(*), custom_gpts(count)`;
        case 'msps':
          return `*, profiles(*), msp_clients(*)`;
        case 'gpts':
          return `*, profiles(email), gpt_analytics(count)`;
        default:
          return '*';
      }
    }
    return selectedFields.join(', ');
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
      case '30d':
        return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
      case '90d':
        return { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), to: now };
      default:
        return { from: null, to: null };
    }
  };

  const generateFilename = () => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `${entityType}_export_${timestamp}.${exportFormat}`;
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = selectedFields.length > 0 ? selectedFields : Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, filename);
  };

  const downloadJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldId]);
    } else {
      setSelectedFields(prev => prev.filter(id => id !== fieldId));
    }
  };

  // Initialize selected fields on first render
  useState(() => {
    const defaultFields = getAvailableFields()
      .filter(field => field.default)
      .map(field => field.id);
    setSelectedFields(defaultFields);
  });

  const availableFields = getAvailableFields();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Data
          </DialogTitle>
          <DialogDescription>
            Configure and download data in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV - Spreadsheet Compatible
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      JSON - Developer Friendly
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fields to Export</CardTitle>
              <CardDescription>
                Select which data fields to include in your export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {availableFields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={(checked) => 
                        handleFieldToggle(field.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={field.id} className="text-sm flex items-center gap-1">
                      {field.label}
                      {field.default && (
                        <Badge variant="secondary" className="text-xs">default</Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-related"
              checked={includeRelatedData}
              onCheckedChange={(checked) => setIncludeRelatedData(checked as boolean)}
            />
            <Label htmlFor="include-related" className="text-sm">
              Include related data (subscriptions, usage stats, etc.)
            </Label>
          </div>

          {/* Export Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading || selectedFields.length === 0}>
              {loading ? 'Exporting...' : 'Download Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
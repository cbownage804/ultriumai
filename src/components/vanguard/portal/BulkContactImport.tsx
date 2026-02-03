/**
 * Bulk Contact Import Component
 * CSV upload for adding multiple contacts with portal access
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, 
  AlertTriangle, Loader2, Users, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BulkContactImportProps {
  clientId: string;
  companyName: string;
  onComplete?: () => void;
}

interface ParsedContact {
  contact_name: string;
  email: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
  portal_enabled?: boolean;
  portal_role?: 'admin' | 'manager' | 'user';
}

interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  validationErrors: number;
  invitationsSent: number;
}

export function BulkContactImport({ clientId, companyName, onComplete }: BulkContactImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [sendInvitations, setSendInvitations] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setParseErrors(['CSV file must have a header row and at least one data row']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const contacts: ParsedContact[] = [];
    const errors: string[] = [];

    // Map common header variations
    const headerMap: Record<string, string> = {
      'name': 'contact_name',
      'full name': 'contact_name',
      'contact': 'contact_name',
      'contact_name': 'contact_name',
      'email': 'email',
      'email address': 'email',
      'phone': 'phone',
      'phone number': 'phone',
      'role': 'role',
      'job title': 'role',
      'title': 'role',
      'primary': 'is_primary',
      'is_primary': 'is_primary',
      'portal': 'portal_enabled',
      'portal_enabled': 'portal_enabled',
      'portal access': 'portal_enabled',
      'portal_role': 'portal_role',
      'portal role': 'portal_role',
    };

    const mappedHeaders = headers.map(h => headerMap[h] || h);

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const contact: any = {};
      mappedHeaders.forEach((header, idx) => {
        if (values[idx]) {
          const value = values[idx].trim().replace(/^["']|["']$/g, '');
          if (header === 'is_primary' || header === 'portal_enabled') {
            contact[header] = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
          } else {
            contact[header] = value;
          }
        }
      });

      if (contact.contact_name && contact.email) {
        contacts.push(contact as ParsedContact);
      } else {
        errors.push(`Row ${i + 1}: Missing required field (name or email)`);
      }
    }

    setParsedContacts(contacts);
    setParseErrors(errors);
    setImportResult(null);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    if (parsedContacts.length === 0) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-bulk-import', {
        body: {
          clientId,
          contacts: parsedContacts,
          sendInvitations
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setImportResult(data.results);
      
      toast({
        title: 'Import Complete',
        description: `Imported ${data.results.imported} contacts`,
      });

      if (data.results.imported > 0) {
        onComplete?.();
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `contact_name,email,phone,role,portal_enabled,portal_role
John Doe,john@example.com,555-0100,IT Manager,true,admin
Jane Smith,jane@example.com,555-0101,Developer,true,user
Bob Wilson,bob@example.com,555-0102,Support,false,user`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearImport = () => {
    setParsedContacts([]);
    setParseErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-black/40 border-cyan-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Upload className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-white">Bulk Import Contacts</CardTitle>
              <CardDescription>
                Upload a CSV file to add multiple contacts at once
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <FileSpreadsheet className="h-10 w-10 text-cyan-400 mx-auto mb-3" />
            <p className="text-white font-medium">Click to upload CSV</p>
            <p className="text-white/50 text-sm mt-1">
              Required columns: contact_name, email
            </p>
          </label>
        </div>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Parse Warnings
            </div>
            <ul className="text-sm text-red-400/80 space-y-1">
              {parseErrors.slice(0, 5).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
              {parseErrors.length > 5 && (
                <li>...and {parseErrors.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Parsed Contacts Preview */}
        {parsedContacts.length > 0 && !importResult && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span className="text-white font-medium">
                  {parsedContacts.length} contacts ready to import
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearImport} className="text-white/60">
                Clear
              </Button>
            </div>

            <ScrollArea className="h-48 rounded-lg border border-cyan-500/20 bg-black/20">
              <div className="p-2 space-y-1">
                {parsedContacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-white">{contact.contact_name}</span>
                      <span className="text-white/50">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.portal_enabled && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Portal</Badge>
                      )}
                      {contact.portal_role && contact.portal_role !== 'user' && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                          {contact.portal_role}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Switch
                  id="send-invitations"
                  checked={sendInvitations}
                  onCheckedChange={setSendInvitations}
                />
                <Label htmlFor="send-invitations" className="text-white cursor-pointer">
                  Send portal invitations
                </Label>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Info className="h-3 w-3" />
                Emails will be sent to contacts with portal enabled
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {parsedContacts.length} Contacts
                </>
              )}
            </Button>
          </>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Import Complete
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{importResult.imported}</div>
                <div className="text-sm text-green-400/70">Contacts Imported</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-400">{importResult.skippedDuplicates}</div>
                <div className="text-sm text-amber-400/70">Duplicates Skipped</div>
              </div>
            </div>

            {importResult.invitationsSent > 0 && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="text-lg font-bold text-purple-400">{importResult.invitationsSent} invitations queued</div>
              </div>
            )}

            <Button onClick={clearImport} variant="outline" className="w-full border-cyan-500/30 text-cyan-400">
              Import More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

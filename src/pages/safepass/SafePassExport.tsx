/**
 * SafePass Export - Export passwords to CSV/JSON
 */
import { useState } from 'react';
import { useSafePass } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileJson, FileSpreadsheet, Shield, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';

type ExportFormat = 'csv' | 'json' | 'encrypted-json';

export default function SafePassExport() {
  const { entries, vaults, getEntryUsername, getEntryPassword, getEntryWebsite, getEntryNotes } = useSafePass();
  const { isUnlocked } = useMasterPassword();
  
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includePasswords, setIncludePasswords] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!isUnlocked) {
      toast.error('Please unlock your vault first');
      return;
    }

    if (entries.length === 0) {
      toast.error('No passwords to export');
      return;
    }

    setIsExporting(true);

    try {
      // Decrypt all entries
      const decryptedEntries = await Promise.all(
        entries.map(async (entry) => {
          const username = await getEntryUsername(entry);
          const password = includePasswords ? await getEntryPassword(entry) : '********';
          const website = await getEntryWebsite(entry);
          const notes = includeNotes ? await getEntryNotes(entry) : '';
          
          return {
            name: entry.title,
            url: website,
            username,
            password,
            notes,
            category: entry.category,
            created_at: entry.created_at,
            is_favorite: entry.is_favorite
          };
        })
      );

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        // CSV Export (Chrome/LastPass compatible)
        const headers = ['name', 'url', 'username', 'password', 'notes'];
        const csvRows = [headers.join(',')];
        
        decryptedEntries.forEach(entry => {
          const row = [
            `\"${(entry.name || '').replace(/\"/g, '\"\"')}\"`,
            `\"${(entry.url || '').replace(/\"/g, '\"\"')}\"`,
            `\"${(entry.username || '').replace(/\"/g, '\"\"')}\"`,
            `\"${(entry.password || '').replace(/\"/g, '\"\"')}\"`,
            `\"${(entry.notes || '').replace(/\"/g, '\"\"')}\"`
          ];
          csvRows.push(row.join(','));
        });
        
        content = csvRows.join('\n');
        filename = `safepass-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'json') {
        // JSON Export (Bitwarden compatible)
        const exportData = {
          encrypted: false,
          folders: vaults.map(v => ({ id: v.id, name: v.vault_name })),
          items: decryptedEntries.map(entry => ({
            type: 1, // Login type
            name: entry.name,
            login: {
              uris: entry.url ? [{ uri: entry.url }] : [],
              username: entry.username,
              password: entry.password
            },
            notes: entry.notes,
            favorite: entry.is_favorite
          }))
        };
        
        content = JSON.stringify(exportData, null, 2);
        filename = `safepass-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Encrypted JSON (SafePass format)
        const exportData = {
          version: '1.0',
          encrypted: true,
          exportedAt: new Date().toISOString(),
          entries: entries.map(e => ({
            ...e,
            // Keep encrypted_data as-is
          }))
        };
        
        content = JSON.stringify(exportData, null, 2);
        filename = `safepass-encrypted-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${decryptedEntries.length} passwords`);
    } catch (error) {
      console.error('Export failed');
      toast.error('Failed to export passwords');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Export Passwords</h1>
          <p className="text-muted-foreground">Export your passwords to CSV or JSON format</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Vault Locked</p>
            <p className="text-muted-foreground">Please unlock your vault to export passwords</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Passwords</h1>
        <p className="text-muted-foreground">
          Export your passwords to CSV or JSON format for backup or migration
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Warning:</strong> Exported files contain sensitive data in plain text. 
          Store them securely and delete after use.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Format
          </CardTitle>
          <CardDescription>Choose your preferred export format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="csv" id="csv" />
              <div className="flex-1">
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="font-medium">CSV (Universal)</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Compatible with Chrome, Firefox, LastPass, 1Password, and most password managers
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="json" id="json" />
              <div className="flex-1">
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">JSON (Bitwarden Format)</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Compatible with Bitwarden and other JSON-based importers
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="encrypted-json" id="encrypted-json" />
              <div className="flex-1">
                <Label htmlFor="encrypted-json" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Encrypted JSON (SafePass Backup)</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Keeps data encrypted - only importable back into SafePass
                </p>
              </div>
            </div>
          </RadioGroup>

          {format !== 'encrypted-json' && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Export Options</h4>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-passwords" 
                  checked={includePasswords}
                  onCheckedChange={(checked) => setIncludePasswords(!!checked)}
                />
                <Label htmlFor="include-passwords">Include passwords (uncheck to mask)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-notes" 
                  checked={includeNotes}
                  onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                />
                <Label htmlFor="include-notes">Include notes</Label>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{entries.length} passwords will be exported</p>
                <p className="text-sm text-muted-foreground">From {vaults.length} vault(s)</p>
              </div>
              <Button onClick={handleExport} disabled={isExporting || entries.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

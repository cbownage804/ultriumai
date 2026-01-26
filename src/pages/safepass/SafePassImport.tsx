import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { useSafePass } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Chrome, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Key,
  Globe,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportedPassword {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  selected: boolean;
  strength: number;
}

const importSources = [
  { id: 'chrome', name: 'Google Chrome', icon: Chrome, format: 'CSV', instructions: 'chrome://settings/passwords → Export passwords' },
  { id: 'firefox', name: 'Firefox', icon: Globe, format: 'CSV', instructions: 'about:logins → ... → Export Logins' },
  { id: '1password', name: '1Password', icon: Key, format: 'CSV/1PUX', instructions: 'File → Export → All Items' },
  { id: 'lastpass', name: 'LastPass', icon: Shield, format: 'CSV', instructions: 'Account Settings → Advanced → Export' },
  { id: 'bitwarden', name: 'Bitwarden', icon: Shield, format: 'JSON/CSV', instructions: 'Tools → Export Vault' },
  { id: 'dashlane', name: 'Dashlane', icon: Shield, format: 'CSV', instructions: 'File → Export → Unsecured archive (CSV)' },
];

export default function SafePassImport() {
  const { createEntry, createVault, vaults, loadVaults } = useSafePass();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  const [selectedSource, setSelectedSource] = useState<string>('chrome');
  const [importedPasswords, setImportedPasswords] = useState<ImportedPassword[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

  const parseCSV = (content: string): ImportedPassword[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file appears to be empty');

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Detect column mappings based on common export formats
    const nameIndex = headers.findIndex(h => ['name', 'title', 'entry'].includes(h));
    const urlIndex = headers.findIndex(h => ['url', 'website', 'login_uri', 'login uri'].includes(h));
    const usernameIndex = headers.findIndex(h => ['username', 'user', 'email', 'login_username', 'login username'].includes(h));
    const passwordIndex = headers.findIndex(h => ['password', 'pass', 'login_password', 'login password'].includes(h));

    if (passwordIndex === -1) {
      throw new Error('Could not find password column in CSV');
    }

    const passwords: ImportedPassword[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const password = values[passwordIndex] || '';
      if (!password) continue;

      passwords.push({
        id: `import-${i}`,
        name: values[nameIndex] || extractDomain(values[urlIndex]) || `Entry ${i}`,
        url: values[urlIndex] || '',
        username: values[usernameIndex] || '',
        password: password,
        selected: true,
        strength: calculatePasswordStrength(password)
      });
    }

    return passwords;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
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

  const extractDomain = (url: string): string => {
    if (!url) return '';
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setParseError(null);
    setImportedPasswords([]);

    try {
      const content = await file.text();
      
      if (file.name.endsWith('.csv')) {
        const passwords = parseCSV(content);
        setImportedPasswords(passwords);
        toast.success(`Found ${passwords.length} passwords to import`);
      } else if (file.name.endsWith('.json')) {
        // Handle JSON imports (Bitwarden, etc.)
        const data = JSON.parse(content);
        const passwords: ImportedPassword[] = [];
        
        // Bitwarden format
        if (data.items) {
          data.items.forEach((item: any, i: number) => {
            if (item.login?.password) {
              passwords.push({
                id: `import-${i}`,
                name: item.name || 'Untitled',
                url: item.login.uris?.[0]?.uri || '',
                username: item.login.username || '',
                password: item.login.password,
                selected: true,
                strength: calculatePasswordStrength(item.login.password)
              });
            }
          });
        }
        
        setImportedPasswords(passwords);
        toast.success(`Found ${passwords.length} passwords to import`);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }
    } catch (error: any) {
      setParseError(error.message);
      toast.error(error.message || 'Failed to parse file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const togglePasswordSelection = (id: string) => {
    setImportedPasswords(prev => 
      prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p)
    );
  };

  const toggleAllPasswords = (selected: boolean) => {
    setImportedPasswords(prev => prev.map(p => ({ ...p, selected })));
  };

  const handleImport = async () => {
    if (!isUnlocked) {
      toast.error('Please unlock your vault first');
      return;
    }

    const selectedPasswords = importedPasswords.filter(p => p.selected);
    if (selectedPasswords.length === 0) {
      toast.error('Please select at least one password to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Create an "Imported" vault if none exists
      let targetVaultId = vaults[0]?.id;
      
      if (!targetVaultId) {
        const newVault = await createVault({ 
          name: 'Imported Passwords', 
          description: 'Passwords imported from browser' 
        });
        if (newVault) {
          targetVaultId = newVault.id;
        }
      }

      if (!targetVaultId) {
        throw new Error('Failed to create vault for imported passwords');
      }

      let imported = 0;
      for (const password of selectedPasswords) {
        await createEntry({
          vault_id: targetVaultId,
          title: password.name,
          username: password.username,
          password: password.password,
          website: password.url,
          category: 'login'
        });
        
        imported++;
        setImportProgress(Math.round((imported / selectedPasswords.length) * 100));
      }

      toast.success(`Successfully imported ${imported} passwords`);
      setImportedPasswords([]);
      loadVaults();
    } catch (error: any) {
      toast.error(error.message || 'Failed to import passwords');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const selectedCount = importedPasswords.filter(p => p.selected).length;
  const weakCount = importedPasswords.filter(p => p.selected && p.strength < 60).length;

  return (
    <FeatureGate feature="safepass">
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Passwords</h1>
        <p className="text-muted-foreground">
          Import passwords from your browser or other password managers
        </p>
      </div>

      {/* Source Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {importSources.map((source) => (
          <Card 
            key={source.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSource === source.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedSource(source.id)}
          >
            <CardContent className="p-4 text-center">
              <source.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium text-sm">{source.name}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {source.format}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            How to export from {importSources.find(s => s.id === selectedSource)?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Export your passwords</p>
              <p className="text-sm text-muted-foreground">
                {importSources.find(s => s.id === selectedSource)?.instructions}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 mt-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Upload the exported file below</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select your CSV or JSON file
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the file here...</p>
            ) : (
              <>
                <p className="text-lg font-medium">Drag & drop your export file here</p>
                <p className="text-muted-foreground mt-1">or click to select a file</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supported formats: CSV, JSON
                </p>
              </>
            )}
          </div>

          {parseError && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{parseError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview & Import */}
      {importedPasswords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Import</CardTitle>
                <CardDescription>
                  {selectedCount} of {importedPasswords.length} passwords selected
                  {weakCount > 0 && (
                    <span className="text-yellow-500 ml-2">
                      ({weakCount} weak passwords)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllPasswords(selectedCount !== importedPasswords.length)}
                >
                  {selectedCount === importedPasswords.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || selectedCount === 0 || !isUnlocked}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {selectedCount} Passwords
                    </>
                  )}
                </Button>
              </div>
            </div>
            {isImporting && (
              <Progress value={importProgress} className="mt-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Strength</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedPasswords.slice(0, 100).map((password) => (
                    <TableRow key={password.id}>
                      <TableCell>
                        <Checkbox
                          checked={password.selected}
                          onCheckedChange={() => togglePasswordSelection(password.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{password.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {password.url ? extractDomain(password.url) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {password.username || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            password.strength >= 80 ? 'bg-primary' :
                            password.strength >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                          }`} />
                          <span className={`text-sm ${
                            password.strength >= 80 ? 'text-primary' :
                            password.strength >= 60 ? 'text-yellow-500' : 'text-destructive'
                          }`}>
                            {password.strength >= 80 ? 'Strong' :
                             password.strength >= 60 ? 'Medium' : 'Weak'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importedPasswords.length > 100 && (
                <p className="text-center text-muted-foreground text-sm mt-4">
                  Showing first 100 of {importedPasswords.length} passwords
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Shield className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Your data is secure</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Imported passwords are encrypted with your master password before being stored. 
                The import file is processed locally and never uploaded to our servers.
                Remember to delete the export file from your computer after importing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </FeatureGate>
  );
}

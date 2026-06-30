/**
 * Password Import Step — file picker + live progress bound to
 * runRayOnboardingPipeline. Real data, real progress, real persistence.
 */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Upload, FileText, ShieldCheck } from 'lucide-react';
import type { ImportSource } from '@/lib/import/passwordParsers';
import type { PipelineProgress } from '@/lib/import/onboardingPipeline';

const SOURCES: { value: ImportSource; label: string; hint: string }[] = [
  { value: 'chrome', label: 'Chrome', hint: 'Settings → Autofill → Passwords → Export' },
  { value: 'edge', label: 'Edge', hint: 'Settings → Profiles → Passwords → Export' },
  { value: 'firefox', label: 'Firefox', hint: 'about:logins → ⋯ → Export logins' },
  { value: 'safari', label: 'Safari', hint: 'File → Export → Passwords' },
  { value: 'bitwarden', label: 'Bitwarden', hint: 'Tools → Export Vault (JSON or CSV)' },
  { value: '1password', label: '1Password', hint: 'File → Export → CSV or 1pif' },
  { value: 'keeper', label: 'Keeper', hint: 'Settings → Export → CSV' },
  { value: 'lastpass', label: 'LastPass', hint: 'Account → Advanced → Export → CSV' },
  { value: 'dashlane', label: 'Dashlane', hint: 'My Account → Settings → Export → CSV' },
  { value: 'csv', label: 'Generic CSV', hint: 'Any CSV with name, url, username, password' },
];

interface Props {
  defaultSource?: ImportSource;
  busy: boolean;
  progress: PipelineProgress | null;
  onImport: (source: ImportSource, text: string) => void;
  onSkip: () => void;
}

export function PasswordImportStep({ defaultSource, busy, progress, onImport, onSkip }: Props) {
  const [source, setSource] = useState<ImportSource>(defaultSource ?? 'chrome');
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setFileName(file.name);
    const content = await file.text();
    setText(content);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-[72px]">
        {SOURCES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSource(s.value)}
            disabled={busy}
            className={cn(
              'text-left rounded-sm border px-3 py-2 text-sm transition-colors',
              source === s.value
                ? 'border-[hsl(262_60%_64%)] bg-[hsl(262_60%_64%/0.06)] text-foreground'
                : 'border-border bg-card/40 text-foreground/80 hover:bg-card',
            )}
          >
            <div className="font-medium">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="ml-[72px] rounded-sm border border-border bg-card/40 p-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground mb-1">How to export from {SOURCES.find((s) => s.value === source)?.label}</div>
        <div>{SOURCES.find((s) => s.value === source)?.hint}</div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" />
          <span>Your file is parsed in your browser, encrypted with your master password, then deleted from memory.</span>
        </div>
      </div>

      <div className="ml-[72px] flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,.1pif,.txt"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
        <Button
          variant="outline"
          size="lg"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-sm"
        >
          <Upload className="mr-2 h-4 w-4" />
          {fileName ? 'Choose a different file' : 'Choose your export file'}
        </Button>
        {fileName && (
          <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {fileName}
          </span>
        )}
      </div>

      <div className="ml-[72px] flex flex-wrap gap-3">
        <Button
          size="lg"
          onClick={() => onImport(source, text)}
          disabled={busy || !text}
          className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Import & analyze
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={onSkip}
          disabled={busy}
          className="rounded-sm"
        >
          Skip — just baseline what's already in my vault
        </Button>
      </div>

      {progress && (
        <div className="ml-[72px] rounded-sm border border-border bg-card/40 p-4">
          <div className="text-sm text-foreground">{progress.message}</div>
          {progress.total > 1 && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-border/60">
              <div
                className="h-full bg-[hsl(262_60%_64%)] transition-all"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

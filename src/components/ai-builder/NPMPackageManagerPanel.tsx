import { useState, useCallback } from 'react';
import { X, Search, Package, Plus, Trash2, ExternalLink, Download, Loader2, Star, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InstalledPackage {
  name: string;
  version: string;
  description?: string;
  isDevDep?: boolean;
}

interface NPMSearchResult {
  name: string;
  version: string;
  description: string;
  downloads: number;
  score: number;
}

interface NPMPackageManagerPanelProps {
  open: boolean;
  onClose: () => void;
  installedPackages: InstalledPackage[];
  onInstall: (name: string, version?: string, isDev?: boolean) => void;
  onUninstall: (name: string) => void;
  onUpdateVersion: (name: string, version: string) => void;
}

export function NPMPackageManagerPanel({ open, onClose, installedPackages, onInstall, onUninstall, onUpdateVersion }: NPMPackageManagerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NPMSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'search'>('installed');
  const [installingPkg, setInstallingPkg] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'version'>('name');

  const searchNPM = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`);
      const data = await res.json();
      setSearchResults(
        (data.objects || []).map((obj: any) => ({
          name: obj.package.name,
          version: obj.package.version,
          description: obj.package.description || '',
          downloads: obj.package.downloads || 0,
          score: obj.score?.final || 0,
        }))
      );
    } catch (e) {
      toast.error('Failed to search npm');
      setSearchResults([]);
    }
    setIsSearching(false);
  }, []);

  const handleSearch = useCallback(() => searchNPM(searchQuery), [searchNPM, searchQuery]);

  const handleInstall = useCallback(async (name: string, version?: string) => {
    setInstallingPkg(name);
    try {
      onInstall(name, version);
      toast.success(`Installed ${name}${version ? '@' + version : ''}`);
      setActiveTab('installed');
    } catch (e) {
      toast.error(`Failed to install ${name}`);
    }
    setInstallingPkg(null);
  }, [onInstall]);

  const filteredInstalled = installedPackages
    .filter(p => !filterText || p.name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a.version.localeCompare(b.version));

  const isInstalled = (name: string) => installedPackages.some(p => p.name === name);

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0a0a12] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-semibold text-white/80">Package Manager</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        <button onClick={() => setActiveTab('installed')} className={cn("flex-1 py-2 text-[11px] font-medium transition-colors border-b-2", activeTab === 'installed' ? 'text-white/80 border-sky-500' : 'text-white/35 border-transparent hover:text-white/55')}>
          Installed ({installedPackages.length})
        </button>
        <button onClick={() => setActiveTab('search')} className={cn("flex-1 py-2 text-[11px] font-medium transition-colors border-b-2", activeTab === 'search' ? 'text-white/80 border-sky-500' : 'text-white/35 border-transparent hover:text-white/55')}>
          Search npm
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-2 border-b border-white/[0.04] shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search packages..."
                className="w-full h-7 pl-7 pr-2 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded-lg text-white/70 placeholder:text-white/20 outline-none focus:border-sky-500/40"
              />
            </div>
            <button onClick={handleSearch} disabled={isSearching} className="h-7 px-3 rounded-lg bg-sky-500/20 text-sky-400 text-[11px] font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50 flex items-center gap-1">
              {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchResults.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center h-40 text-white/15 text-xs gap-2">
                <Package className="h-8 w-8 text-white/10" />
                <span>Search for npm packages</span>
              </div>
            )}
            {searchResults.map(pkg => (
              <div key={pkg.name} className="px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12px] font-medium text-white/80 truncate">{pkg.name}</span>
                    <span className="text-[10px] text-white/25 font-mono">{pkg.version}</span>
                  </div>
                  {isInstalled(pkg.name) ? (
                    <span className="text-[10px] text-emerald-400/70 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10">Installed</span>
                  ) : (
                    <button
                      onClick={() => handleInstall(pkg.name, pkg.version)}
                      disabled={installingPkg === pkg.name}
                      className="h-6 px-2 rounded bg-sky-500/20 text-sky-400 text-[10px] font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {installingPkg === pkg.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      Install
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-white/35 leading-relaxed line-clamp-2">{pkg.description}</p>
                <a href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-[9px] text-sky-400/50 hover:text-sky-400/80 transition-colors">
                  <ExternalLink className="h-2.5 w-2.5" /> npm
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Installed Tab */}
      {activeTab === 'installed' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-2 border-b border-white/[0.04] shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
              <input
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Filter installed..."
                className="w-full h-7 pl-7 pr-2 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded-lg text-white/70 placeholder:text-white/20 outline-none focus:border-white/[0.12]"
              />
            </div>
            <button onClick={() => setSortBy(s => s === 'name' ? 'version' : 'name')} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors" title="Sort">
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredInstalled.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/15 text-xs gap-2">
                <Package className="h-8 w-8 text-white/10" />
                <span>No packages installed</span>
              </div>
            ) : (
              filteredInstalled.map(pkg => (
                <div key={pkg.name} className="flex items-center justify-between px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-white/70 truncate">{pkg.name}</span>
                      {pkg.isDevDep && <span className="text-[8px] text-violet-400/60 font-medium px-1 py-px rounded bg-violet-500/10">DEV</span>}
                    </div>
                    <span className="text-[10px] text-white/25 font-mono">{pkg.version}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noopener noreferrer" className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button onClick={() => { onUninstall(pkg.name); toast.success(`Uninstalled ${pkg.name}`); }} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick install */}
          <div className="px-2 py-2 border-t border-white/[0.06] shrink-0">
            <QuickInstall onInstall={handleInstall} />
          </div>
        </div>
      )}
    </div>
  );
}

function QuickInstall({ onInstall }: { onInstall: (name: string, version?: string) => void }) {
  const [input, setInput] = useState('');

  const handle = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const [name, version] = trimmed.split('@');
    onInstall(name, version);
    setInput('');
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handle()}
        placeholder="package@version"
        className="flex-1 h-7 px-2 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded-lg text-white/70 placeholder:text-white/20 outline-none focus:border-sky-500/40 font-mono"
      />
      <button onClick={handle} className="h-7 px-2.5 rounded-lg bg-sky-500/20 text-sky-400 text-[10px] font-medium hover:bg-sky-500/30 transition-colors flex items-center gap-1">
        <Download className="h-3 w-3" /> Add
      </button>
    </div>
  );
}

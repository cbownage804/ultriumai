import { useState, useCallback, useRef } from 'react';
import { Search, Package, Plus, X, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CDNPackage {
  name: string;
  version: string;
  description: string;
  cdnUrl: string;
}

interface PackageManagerProps {
  packages: CDNPackage[];
  onAddPackage: (pkg: CDNPackage) => void;
  onRemovePackage: (name: string) => void;
}

const CDN_BASE = 'https://esm.sh';

export function PackageManager({ packages, onAddPackage, onRemovePackage }: PackageManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CDNPackage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const searchPackages = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const resp = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=8`);
      if (!resp.ok) throw new Error('Search failed');
      const data = await resp.json();
      
      const results: CDNPackage[] = data.objects?.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description?.slice(0, 80) || '',
        cdnUrl: `${CDN_BASE}/${obj.package.name}@${obj.package.version}`,
      })) || [];

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPackages(value), 300);
  }, [searchPackages]);

  const handleAdd = useCallback((pkg: CDNPackage) => {
    if (packages.some(p => p.name === pkg.name)) {
      toast.info(`${pkg.name} is already installed`);
      return;
    }
    onAddPackage(pkg);
    toast.success(`Added ${pkg.name}@${pkg.version}`);
    setSearchQuery('');
    setSearchResults([]);
  }, [packages, onAddPackage]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-white/[0.06] shrink-0">
        <Package className="h-3.5 w-3.5 text-white/30" />
        <span className="text-[11px] font-medium text-white/50">Packages</span>
        <span className="text-[9px] text-white/20 ml-auto">{packages.length} installed</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
          <input
            value={searchQuery}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search npm packages..."
            className="w-full h-7 pl-7 pr-2 text-[11px] bg-white/[0.03] border border-white/[0.06] rounded-md text-white/70 outline-none focus:border-white/[0.12] placeholder:text-white/15"
          />
          {isSearching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 animate-spin" />
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-1.5 max-h-40 overflow-auto rounded-md border border-white/[0.06] bg-black/30">
            {searchResults.map(pkg => (
              <button
                key={pkg.name}
                onClick={() => handleAdd(pkg)}
                className="w-full flex items-start gap-2 px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors text-left"
              >
                <Plus className="h-3 w-3 text-emerald-400/50 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/70 font-medium truncate">{pkg.name}</span>
                    <span className="text-[9px] text-white/20">{pkg.version}</span>
                  </div>
                  <p className="text-[9px] text-white/30 truncate">{pkg.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Installed packages */}
      <div className="flex-1 overflow-auto">
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Package className="h-8 w-8 text-white/5 mb-2" />
            <p className="text-[10px] text-white/20">No packages installed</p>
            <p className="text-[9px] text-white/10 mt-0.5">Search above to add CDN packages</p>
          </div>
        ) : (
          <div className="py-1">
            {packages.map(pkg => (
              <div
                key={pkg.name}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.02] group"
              >
                <Package className="h-3 w-3 text-cyan-400/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/60 font-mono truncate">{pkg.name}</span>
                    <span className="text-[9px] text-white/15">{pkg.version}</span>
                  </div>
                </div>
                <a
                  href={`https://www.npmjs.com/package/${pkg.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-5 w-5 rounded flex items-center justify-center text-white/10 hover:text-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <button
                  onClick={() => { onRemovePackage(pkg.name); toast.success(`Removed ${pkg.name}`); }}
                  className="h-5 w-5 rounded flex items-center justify-center text-white/10 hover:text-red-400/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

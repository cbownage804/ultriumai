import { useState, Suspense, lazy } from 'react';
import { X, Database, Users, HardDrive, Zap, KeyRound, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy imports for each sub-panel
const CloudDatabasePanel = lazy(() => import('./cloud/CloudDatabasePanel'));
const AuthUsersPanel = lazy(() => import('./cloud/AuthUsersPanel'));
import { StorageBrowser, EdgeFunctionEditorPanel, SecretsManagerPanel } from './lazyPanels';

interface CloudViewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConfig: any;
  onOpenPanel: (key: string) => void;
}

type CloudTab = 'database' | 'users' | 'storage' | 'edge-functions' | 'secrets';

const TABS: { id: CloudTab; label: string; icon: React.ElementType }[] = [
  { id: 'database', label: 'Database', icon: Database },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'edge-functions', label: 'Edge Functions', icon: Zap },
  { id: 'secrets', label: 'Secrets', icon: KeyRound },
];

function PanelFallback() {
  return (
    <div className="flex items-center justify-center h-full text-white/30">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export function CloudViewPanel({ isOpen, onClose, supabaseConfig, onOpenPanel }: CloudViewPanelProps) {
  const [activeTab, setActiveTab] = useState<CloudTab>('database');

  if (!isOpen) return null;

  const hasSupabase = !!supabaseConfig?.supabaseUrl;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-5xl h-full flex bg-[#0c0c0c] border-l border-white/[0.08] shadow-2xl">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white/80">Cloud</h2>
            <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                      : "text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!hasSupabase ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-3">
                <Database className="h-10 w-10 text-white/10 mx-auto" />
                <h3 className="text-sm font-medium text-white/50">No Supabase Connected</h3>
                <p className="text-xs text-white/30 max-w-xs">
                  Connect a Supabase project to access database, storage, edge functions, and more.
                </p>
              </div>
            </div>
          ) : (
            <Suspense fallback={<PanelFallback />}>
              <div className="flex-1 overflow-auto">
                {activeTab === 'database' && (
                  <CloudDatabasePanel
                    supabaseUrl={supabaseConfig.supabaseUrl}
                    supabaseKey={supabaseConfig.supabaseKey}
                  />
                )}
                {activeTab === 'users' && (
                  <AuthUsersPanel
                    supabaseUrl={supabaseConfig.supabaseUrl}
                    supabaseKey={supabaseConfig.supabaseKey}
                  />
                )}
                {activeTab === 'storage' && (
                  <StorageBrowser
                    supabaseUrl={supabaseConfig.supabaseUrl}
                    supabaseKey={supabaseConfig.supabaseKey}
                  />
                )}
                {activeTab === 'edge-functions' && (
                  <EdgeFunctionEditorPanel
                    supabaseUrl={supabaseConfig.supabaseUrl}
                    supabaseKey={supabaseConfig.supabaseKey}
                    onInsertCode={() => {}}
                  />
                )}
                {activeTab === 'secrets' && (
                  <SecretsManagerPanel
                    supabaseUrl={supabaseConfig.supabaseUrl}
                    supabaseKey={supabaseConfig.supabaseKey}
                  />
                )}
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default CloudViewPanel;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Package, Search, Grid3X3, List, Download, CheckCircle2, 
  Shield, Monitor, Database, Cloud, Lock, Zap, Settings, Star, Loader2, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';

const initialApps = [
  { id: '1', name: 'SafePass', description: 'Enterprise password manager for teams', icon: Lock, category: 'security', installed: true, rating: 4.9, installs: '10k+', route: '/safepass' },
  { id: '2', name: 'SafeScan', description: 'Vulnerability scanning & remediation', icon: Shield, category: 'security', installed: true, rating: 4.8, installs: '8k+', route: '/safescan' },
  { id: '3', name: 'MeshCentral', description: 'Zero-touch browser-based remote desktop', icon: Monitor, category: 'remote', installed: true, rating: 4.9, installs: '15k+', route: null },
  { id: '4', name: 'Backup Pro', description: 'Cloud backup and disaster recovery', icon: Cloud, category: 'backup', installed: true, rating: 4.6, installs: '12k+', route: '/backups' },
  { id: '5', name: 'SIEM Connect', description: 'Security event correlation engine', icon: Database, category: 'security', installed: false, rating: 4.5, installs: '5k+', route: '/siem' },
  { id: '6', name: 'Patch Manager', description: 'Automated patch deployment', icon: Zap, category: 'management', installed: true, rating: 4.8, installs: '20k+', route: '/patches' },
  { id: '7', name: 'Network Monitor', description: 'Real-time network monitoring', icon: Monitor, category: 'monitoring', installed: false, rating: 4.4, installs: '7k+', route: '/network' },
  { id: '8', name: 'Config Backup', description: 'Device configuration backup', icon: Settings, category: 'backup', installed: false, rating: 4.3, installs: '3k+', route: null },
];

const categories = ['all', 'security', 'remote', 'backup', 'management', 'monitoring'];

export default function VanguardAppCenter() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [apps, setApps] = useState(initialApps);
  const [installingApp, setInstallingApp] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<typeof initialApps[0] | null>(null);

  useEffect(() => {
    document.title = 'App Center | Vanguard';
  }, []);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const installedCount = apps.filter(a => a.installed).length;
  const updatesAvailable = 2;

  const handleInstall = async (appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    setInstallingApp(appId);
    
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setApps(apps.map(a => 
      a.id === appId ? { ...a, installed: true } : a
    ));
    setInstallingApp(null);
    toast.success(`${app.name} installed successfully`);
  };

  const handleManage = (app: typeof initialApps[0]) => {
    if (app.route) {
      navigate(`${basePath}${app.route}`);
    } else {
      setSelectedApp(app);
    }
  };

  const handleUninstall = async (appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    setApps(apps.map(a => 
      a.id === appId ? { ...a, installed: false } : a
    ));
    setSelectedApp(null);
    toast.success(`${app.name} uninstalled`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Package className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">App Center</h1>
            <p className="text-white/60 text-sm">Install and manage integrations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={`border-cyan-500/20 ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`border-cyan-500/20 ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{apps.length}</p>
                <p className="text-white/60 text-sm">Available Apps</p>
              </div>
              <Package className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-400">{installedCount}</p>
                <p className="text-white/60 text-sm">Installed</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-amber-400">{updatesAvailable}</p>
                <p className="text-white/60 text-sm">Updates Available</p>
              </div>
              <Download className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-400">5</p>
                <p className="text-white/60 text-sm">New This Month</p>
              </div>
              <Star className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Categories */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input 
            placeholder="Search apps..." 
            className="pl-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-black/40 border border-cyan-500/20 flex-wrap h-auto gap-1 p-1">
          {categories.map(cat => (
            <TabsTrigger 
              key={cat} 
              value={cat}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 capitalize"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
            {filteredApps.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {viewMode === 'grid' ? (
                  <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                          <app.icon className="h-8 w-8 text-cyan-400" />
                        </div>
                        {app.installed && (
                          <Badge className="bg-emerald-500/20 text-emerald-400">Installed</Badge>
                        )}
                      </div>
                      <CardTitle className="text-white mt-3">{app.name}</CardTitle>
                      <CardDescription className="text-white/60">{app.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-white/80 text-sm">{app.rating}</span>
                        </div>
                        <span className="text-white/60 text-sm">{app.installs} installs</span>
                      </div>
                      <Button 
                        className={app.installed 
                          ? "w-full bg-slate-700 hover:bg-slate-600 text-white" 
                          : "w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                        }
                        onClick={() => app.installed ? handleManage(app) : handleInstall(app.id)}
                        disabled={installingApp === app.id}
                      >
                        {installingApp === app.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Installing...
                          </>
                        ) : app.installed ? (
                          <>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Install
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                          <app.icon className="h-8 w-8 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium">{app.name}</h3>
                            {app.installed && (
                              <Badge className="bg-emerald-500/20 text-emerald-400">Installed</Badge>
                            )}
                          </div>
                          <p className="text-white/60 text-sm">{app.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <span className="text-white/60 text-xs">{app.rating}</span>
                            </div>
                            <span className="text-white/60 text-xs">{app.installs} installs</span>
                          </div>
                        </div>
                        <Button 
                          className={app.installed 
                            ? "bg-slate-700 hover:bg-slate-600 text-white" 
                            : "bg-cyan-500 hover:bg-cyan-600 text-black"
                          }
                          onClick={() => app.installed ? handleManage(app) : handleInstall(app.id)}
                          disabled={installingApp === app.id}
                        >
                          {installingApp === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : app.installed ? 'Manage' : 'Install'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* App Management Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              {selectedApp && <selectedApp.icon className="h-6 w-6 text-cyan-400" />}
              {selectedApp?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4 py-4">
              <p className="text-white/80">{selectedApp.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="text-white/80">{selectedApp.rating}</span>
                </div>
                <span className="text-white/60">{selectedApp.installs} installs</span>
                <Badge className="capitalize">{selectedApp.category}</Badge>
              </div>
              <div className="pt-4 border-t border-cyan-500/20">
                <h4 className="text-white font-medium mb-2">App Settings</h4>
                <p className="text-white/60 text-sm">Configure {selectedApp.name} settings and preferences.</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              onClick={() => selectedApp && handleUninstall(selectedApp.id)}
            >
              Uninstall
            </Button>
            {selectedApp?.route && (
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
                onClick={() => {
                  if (selectedApp.route) navigate(`${basePath}${selectedApp.route}`);
                  setSelectedApp(null);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open App
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

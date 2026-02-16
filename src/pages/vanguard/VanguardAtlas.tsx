/**
 * Vanguard Atlas - IT Documentation System
 * Full IT Glue-style interface with vertical sidebar navigation
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Key, Shield, Server, BookOpen, Clock, Building2,
  ChevronRight, ArrowLeft, Users, Box, ListChecks, Link2, History,
  Search, Wand2, Sparkles,
} from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { ModuleIntroBanner, ModuleGettingStarted } from '@/components/vanguard/shared/ModuleInstructions';
import { useVanguardAtlas } from '@/hooks/useVanguardAtlas';
import { useMSP } from '@/hooks/useMSP';
import { useCortexFeatures } from '@/hooks/useCortexFeatures';
import { AtlasSidebar, type AtlasSidebarGroup } from '@/components/vanguard-atlas/AtlasSidebar';
import { AtlasDocuments } from '@/components/vanguard-atlas/AtlasDocuments';
import { AtlasPasswords } from '@/components/vanguard-atlas/AtlasPasswords';
import { AtlasSSL } from '@/components/vanguard-atlas/AtlasSSL';
import { AtlasConfigurations } from '@/components/vanguard-atlas/AtlasConfigurations';
import { AtlasRunbooks } from '@/components/vanguard-atlas/AtlasRunbooks';
import { AtlasExpirations } from '@/components/vanguard-atlas/AtlasExpirations';
import { AtlasContacts } from '@/components/vanguard-atlas/AtlasContacts';
import { AtlasFlexibleAssets } from '@/components/vanguard-atlas/AtlasFlexibleAssets';
import { AtlasChecklists } from '@/components/vanguard-atlas/AtlasChecklists';
import { AtlasRelatedItems } from '@/components/vanguard-atlas/AtlasRelatedItems';
import { AtlasActivityLog } from '@/components/vanguard-atlas/AtlasActivityLog';
import { AtlasAISearch } from '@/components/vanguard-atlas/AtlasAISearch';
import { AtlasAIDocGenerator } from '@/components/vanguard-atlas/AtlasAIDocGenerator';
import { CortexGatedSection } from '@/components/vanguard/CortexGatedSection';
import { Loader2 } from 'lucide-react';

const KBArticleGenerator = lazy(() => import('@/components/vanguard/cortex/KBArticleGenerator').then(m => ({ default: m.KBArticleGenerator })));
const ScreenRecordingKBGenerator = lazy(() => import('@/components/vanguard/cortex/ScreenRecordingKBGenerator').then(m => ({ default: m.ScreenRecordingKBGenerator })));

export default function VanguardAtlas() {
  const [activeItem, setActiveItem] = useState('overview');
  const [selectedOrg, setSelectedOrg] = useState<string | undefined>();
  const { clients } = useMSP();
  const { stats, isLoading, refetch } = useVanguardAtlas(selectedOrg);
  const { isFeatureEnabled } = useCortexFeatures();

  const selectedClient = clients.find(c => c.id === selectedOrg);

  const sidebarGroups: AtlasSidebarGroup[] = useMemo(() => {
    const aiItems = [];
    if (isFeatureEnabled('atlas-ai-search')) aiItems.push({ id: 'ai_search', label: 'AI Search & Q&A', icon: Search });
    if (isFeatureEnabled('atlas-doc-generator')) aiItems.push({ id: 'ai_doc_gen', label: 'AI Doc Generator', icon: Wand2 });

    const groups: AtlasSidebarGroup[] = [
      {
        id: 'main',
        label: 'Dashboard',
        icon: Building2,
        items: [{ id: 'overview', label: 'Overview', icon: Building2 }],
        defaultOpen: true,
      },
      {
        id: 'documentation',
        label: 'Documentation',
        icon: FileText,
        items: [
          { id: 'documents', label: 'Documents', icon: FileText, badge: stats.documents },
          { id: 'runbooks', label: 'Runbooks', icon: BookOpen, badge: stats.runbooks },
          { id: 'checklists', label: 'Checklists', icon: ListChecks },
        ],
        defaultOpen: true,
      },
      {
        id: 'credentials',
        label: 'Credentials',
        icon: Key,
        items: [
          { id: 'passwords', label: 'Passwords', icon: Key, badge: stats.passwords },
          { id: 'ssl', label: 'SSL Certificates', icon: Shield, badge: stats.sslCertificates },
        ],
      },
      {
        id: 'assets',
        label: 'Assets',
        icon: Server,
        items: [
          { id: 'configurations', label: 'Configurations', icon: Server, badge: stats.configurations },
          { id: 'flexible_assets', label: 'Flexible Assets', icon: Box },
          { id: 'contacts', label: 'Contacts', icon: Users },
        ],
      },
      {
        id: 'tracking',
        label: 'Tracking',
        icon: Clock,
        items: [
          { id: 'expirations', label: 'Expirations', icon: Clock, badge: stats.expiringItems },
          { id: 'related_items', label: 'Related Items', icon: Link2 },
        ],
      },
    ];

    // Always show AI tools section — gating happens inline via CortexGatedSection
    groups.push({
      id: 'ai',
      label: 'AI Tools (Cortex)',
      icon: Sparkles,
      items: [
        ...(isFeatureEnabled('atlas-ai-search') ? [{ id: 'ai_search', label: 'AI Search & Q&A', icon: Search }] : []),
        ...(isFeatureEnabled('atlas-doc-generator') ? [{ id: 'ai_doc_gen', label: 'AI Doc Generator', icon: Wand2 }] : []),
        { id: 'cortex_kb', label: 'KB from Tickets', icon: Sparkles },
        { id: 'cortex_screen_docs', label: 'Screen to Docs', icon: Wand2 },
      ],
    });

    groups.push({
      id: 'audit',
      label: 'Audit',
      icon: History,
      items: [{ id: 'activity_log', label: 'Activity Log', icon: History }],
    });

    return groups;
  }, [stats, isFeatureEnabled]);

  // Organization picker (no org selected)
  if (!selectedOrg) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <ModuleLogo module="atlas" size="lg" glow />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
              Vanguard Atlas
            </h1>
            <p className="text-muted-foreground">IT Documentation & Knowledge Management</p>
          </div>
        </div>

        <ModuleIntroBanner
          title="Welcome to Vanguard Atlas"
          description="Your full IT documentation platform — like IT Glue, built into Vanguard. Store passwords, SSL certificates, configurations, flexible assets, runbooks, checklists, and more."
          features={['Password Vault', 'Flexible Assets', 'AI Search & Q&A', 'Checklists & Workflows', 'Related Items', 'Activity Logs']}
          accentColor="cyan"
          storageKey="atlas-intro"
        />

        {clients.length === 0 && (
          <ModuleGettingStarted
            moduleName="Atlas"
            accentColor="cyan"
            steps={[
              { title: 'Add your first customer', description: 'Create a client in the Customers section to organize their documentation.', completed: false },
              { title: 'Create documentation', description: 'Add SOPs, passwords, and configurations for each organization.', completed: false },
              { title: 'Track SSL certificates', description: 'Add SSL certs and get automatic expiration alerts.', completed: false },
            ]}
          />
        )}

        <Card className="bg-card/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Building2 className="h-5 w-5" />
              Select an Organization
            </CardTitle>
            <CardDescription>Choose an organization to view and manage its documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client, i) => (
                <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card
                    className="cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                    onClick={() => { setSelectedOrg(client.id); setActiveItem('overview'); }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Building2 className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{client.company_name}</p>
                            <p className="text-sm text-muted-foreground">Organization</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {clients.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  No organizations found. Add clients in the Customers section first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render active module content
  const renderContent = () => {
    switch (activeItem) {
      case 'overview':
        return <OverviewDashboard stats={stats} isLoading={isLoading} onNavigate={setActiveItem} />;
      case 'documents':
        return <AtlasDocuments organizationId={selectedOrg} />;
      case 'passwords':
        return <AtlasPasswords organizationId={selectedOrg} />;
      case 'ssl':
        return <AtlasSSL organizationId={selectedOrg} />;
      case 'configurations':
        return <AtlasConfigurations organizationId={selectedOrg} />;
      case 'runbooks':
        return <AtlasRunbooks organizationId={selectedOrg} />;
      case 'expirations':
        return <AtlasExpirations organizationId={selectedOrg} />;
      case 'contacts':
        return <AtlasContacts organizationId={selectedOrg} />;
      case 'flexible_assets':
        return <AtlasFlexibleAssets organizationId={selectedOrg} />;
      case 'checklists':
        return <AtlasChecklists organizationId={selectedOrg} />;
      case 'related_items':
        return <AtlasRelatedItems organizationId={selectedOrg} />;
      case 'activity_log':
        return <AtlasActivityLog organizationId={selectedOrg} />;
      case 'ai_search':
        return <AtlasAISearch organizationId={selectedOrg} />;
      case 'ai_doc_gen':
        return <AtlasAIDocGenerator organizationId={selectedOrg} onDocCreated={refetch} />;
      case 'cortex_kb':
        return (
          <CortexGatedSection
            featureName="KB Article Generator"
            description="Automatically generate polished knowledge base articles from resolved tickets and incidents."
            icon={<Sparkles className="h-5 w-5 text-violet-400" />}
          >
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>}>
              <KBArticleGenerator />
            </Suspense>
          </CortexGatedSection>
        );
      case 'cortex_screen_docs':
        return (
          <CortexGatedSection
            featureName="Screen to Docs"
            description="Convert screen recordings and screenshots into structured, editable documentation automatically."
            icon={<Wand2 className="h-5 w-5 text-violet-400" />}
          >
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>}>
              <ScreenRecordingKBGenerator />
            </Suspense>
          </CortexGatedSection>
        );
      default:
        return <OverviewDashboard stats={stats} isLoading={isLoading} onNavigate={setActiveItem} />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AtlasSidebar groups={sidebarGroups} activeItem={activeItem} onSelect={setActiveItem} />
      <main className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrg(undefined)} className="text-slate-400 hover:text-cyan-400">
            <ArrowLeft className="h-4 w-4 mr-2" />Organizations
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              {selectedClient?.company_name || 'Organization'}
            </h1>
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}

// Overview Dashboard sub-component
function OverviewDashboard({ stats, isLoading, onNavigate }: { stats: any; isLoading: boolean; onNavigate: (id: string) => void }) {
  const statCards = [
    { label: 'Documents', value: stats.documents, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', nav: 'documents' },
    { label: 'Passwords', value: stats.passwords, icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10', nav: 'passwords' },
    { label: 'SSL Certs', value: stats.sslCertificates, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', nav: 'ssl' },
    { label: 'Configs', value: stats.configurations, icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10', nav: 'configurations' },
    { label: 'Runbooks', value: stats.runbooks, icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10', nav: 'runbooks' },
    { label: 'Expiring', value: stats.expiringItems, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', nav: 'expirations' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-card/50 border-border/50 hover:border-border transition-colors cursor-pointer" onClick={() => onNavigate(stat.nav)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {(stats.expiringItems > 0 || stats.sslExpiring > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.expiringItems > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5 cursor-pointer" onClick={() => onNavigate('expirations')}>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium text-amber-400">{stats.expiringItems} items expiring soon</p>
                  <p className="text-sm text-muted-foreground">Click to view expirations</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.sslExpiring > 0 && (
            <Card className="border-red-500/30 bg-red-500/5 cursor-pointer" onClick={() => onNavigate('ssl')}>
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">{stats.sslExpiring} SSL certificates expiring</p>
                  <p className="text-sm text-muted-foreground">Renew before they expire</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick actions */}
      <Card className="border-cyan-500/20">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('ai_search')}><Search className="h-3.5 w-3.5 mr-1" />AI Search</Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('ai_doc_gen')}><Wand2 className="h-3.5 w-3.5 mr-1" />Generate Doc</Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('checklists')}><ListChecks className="h-3.5 w-3.5 mr-1" />Checklists</Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('flexible_assets')}><Box className="h-3.5 w-3.5 mr-1" />Flexible Assets</Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('related_items')}><Link2 className="h-3.5 w-3.5 mr-1" />Related Items</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

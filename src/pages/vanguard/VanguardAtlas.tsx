/**
 * Vanguard Atlas - IT Documentation System
 * Full ITGlue replica for Vanguard MSP
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText, Key, Shield, Server, BookOpen, Clock, Building2,
  Plus, Search, FolderOpen, AlertTriangle, CheckCircle2, Settings, Map
} from 'lucide-react';
import { useVanguardAtlas } from '@/hooks/useVanguardAtlas';
import { AtlasOrganizations } from '@/components/vanguard-atlas/AtlasOrganizations';
import { AtlasDocuments } from '@/components/vanguard-atlas/AtlasDocuments';
import { AtlasPasswords } from '@/components/vanguard-atlas/AtlasPasswords';
import { AtlasSSL } from '@/components/vanguard-atlas/AtlasSSL';
import { AtlasConfigurations } from '@/components/vanguard-atlas/AtlasConfigurations';
import { AtlasRunbooks } from '@/components/vanguard-atlas/AtlasRunbooks';
import { AtlasExpirations } from '@/components/vanguard-atlas/AtlasExpirations';

export default function VanguardAtlas() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrg, setSelectedOrg] = useState<string | undefined>();
  const { stats, organizations, isLoading } = useVanguardAtlas(selectedOrg);

  const statCards = [
    { label: 'Organizations', value: stats.organizations, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Documents', value: stats.documents, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Passwords', value: stats.passwords, icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'SSL Certs', value: stats.sslCertificates, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Configurations', value: stats.configurations, icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Runbooks', value: stats.runbooks, icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Map className="h-6 w-6 text-cyan-500" />
            Vanguard Atlas
          </h1>
          <p className="text-muted-foreground">IT Documentation & Knowledge Management</p>
        </div>
        
        {/* Organization Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedOrg || ''}
            onChange={(e) => setSelectedOrg(e.target.value || undefined)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
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

      {/* Alert Cards */}
      {(stats.expiringItems > 0 || stats.sslExpiring > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.expiringItems > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium text-amber-400">{stats.expiringItems} items expiring soon</p>
                  <p className="text-sm text-muted-foreground">Check the Expirations tab for details</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.sslExpiring > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-background">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="passwords" className="data-[state=active]:bg-background">
            <Key className="h-4 w-4 mr-2" />
            Passwords
          </TabsTrigger>
          <TabsTrigger value="ssl" className="data-[state=active]:bg-background">
            <Shield className="h-4 w-4 mr-2" />
            SSL Certs
          </TabsTrigger>
          <TabsTrigger value="configurations" className="data-[state=active]:bg-background">
            <Server className="h-4 w-4 mr-2" />
            Configurations
          </TabsTrigger>
          <TabsTrigger value="runbooks" className="data-[state=active]:bg-background">
            <BookOpen className="h-4 w-4 mr-2" />
            Runbooks
          </TabsTrigger>
          <TabsTrigger value="expirations" className="data-[state=active]:bg-background">
            <Clock className="h-4 w-4 mr-2" />
            Expirations
            {stats.expiringItems > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">{stats.expiringItems}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard">
            <AtlasOrganizations selectedOrg={selectedOrg} onSelectOrg={setSelectedOrg} />
          </TabsContent>
          
          <TabsContent value="documents">
            <AtlasDocuments organizationId={selectedOrg} />
          </TabsContent>
          
          <TabsContent value="passwords">
            <AtlasPasswords organizationId={selectedOrg} />
          </TabsContent>
          
          <TabsContent value="ssl">
            <AtlasSSL organizationId={selectedOrg} />
          </TabsContent>
          
          <TabsContent value="configurations">
            <AtlasConfigurations organizationId={selectedOrg} />
          </TabsContent>
          
          <TabsContent value="runbooks">
            <AtlasRunbooks organizationId={selectedOrg} />
          </TabsContent>
          
          <TabsContent value="expirations">
            <AtlasExpirations organizationId={selectedOrg} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

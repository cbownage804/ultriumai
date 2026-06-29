import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Eye, CheckCircle, X, Filter, Search } from 'lucide-react';
import { useWatchData } from '@/hooks/useWatchData';
import { toast } from 'sonner';

export const ThreatAnalytics = () => {
  const { threats, loading, updateThreatStatus } = useWatchData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const severityColors = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white'
  };

  const statusColors = {
    new: 'bg-red-100 text-red-800',
    investigating: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    false_positive: 'bg-gray-100 text-gray-800'
  };

  const handleStatusUpdate = async (threatId: string, newStatus: string) => {
    const result = await updateThreatStatus(threatId, newStatus);
    if (result.success) {
      toast.success(`Threat marked as ${newStatus.replace('_', ' ')}`);
    } else {
      toast.error('Failed to update threat status');
    }
  };

  const filteredThreats = threats.filter(threat => {
    const matchesStatus = filterStatus === 'all' || threat.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || threat.severity === filterSeverity;
    const matchesSearch = searchQuery === '' || 
      threat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threat.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const threatStats = {
    total: threats.length,
    new: threats.filter(t => t.status === 'new').length,
    investigating: threats.filter(t => t.status === 'investigating').length,
    resolved: threats.filter(t => t.status === 'resolved').length,
    critical: threats.filter(t => t.severity === 'critical').length,
    high: threats.filter(t => t.severity === 'high').length,
    medium: threats.filter(t => t.severity === 'medium').length,
    low: threats.filter(t => t.severity === 'low').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Threat Analytics</h2>
          <p className="text-muted-foreground">Monitor and manage detected security threats</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threatStats.total}</div>
            <p className="text-xs text-muted-foreground">All detected threats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{threatStats.critical}</div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Investigation</CardTitle>
            <Eye className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{threatStats.investigating}</div>
            <p className="text-xs text-muted-foreground">Currently being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{threatStats.resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully mitigated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Threat Management</CardTitle>
          <CardDescription>Review and manage detected threats across your monitored assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredThreats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Threat</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThreats.map((threat) => (
                  <TableRow key={threat.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{threat.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {threat.description}
                        </p>
                        <div className="flex gap-1">
                          {threat.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[threat.severity as keyof typeof severityColors]}>
                        {threat.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[threat.status as keyof typeof statusColors]}>
                        {threat.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{threat.source_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {threat.confidence_score}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {new Date(threat.first_seen).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(threat.first_seen).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {threat.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(threat.id, 'investigating')}
                          >
                            Investigate
                          </Button>
                        )}
                        {threat.status === 'investigating' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(threat.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(threat.id, 'false_positive')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No threats found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Your monitored assets are secure'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
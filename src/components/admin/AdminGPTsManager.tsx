import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Edit, Trash2, Bot, Users, MessageCircle } from 'lucide-react';

export const AdminGPTsManager = () => {
  const [gpts, setGpts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSharing, setFilterSharing] = useState('all');
  const [selectedGPT, setSelectedGPT] = useState<any>(null);
  const { toast } = useToast();

  const fetchGPTs = async () => {
    try {
      console.log('🔍 Fetching GPTs for admin dashboard...');
      
      // Simplified query to avoid JOIN issues
      const { data, error } = await supabase
        .from('custom_gpts')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🤖 GPTs data:', { count: data?.length, error: error?.message });

      if (error) throw error;
      setGpts(data || []);
      setAnalytics([]); // Simplified - no analytics for now
    } catch (error: any) {
      console.error('❌ Error fetching GPTs:', error);
      toast({
        title: "Error",
        description: `Failed to fetch GPTs: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGPTs();
  }, []);

  const handleDeleteGPT = async (gptId: string) => {
    if (!confirm('Are you sure you want to delete this GPT? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_gpts')
        .delete()
        .eq('id', gptId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GPT deleted successfully",
      });
      
      fetchGPTs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete GPT",
        variant: "destructive",
      });
    }
  };

  const handleToggleGPTStatus = async (gptId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_gpts')
        .update({ is_active: !currentStatus })
        .eq('id', gptId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `GPT ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchGPTs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update GPT status",
        variant: "destructive",
      });
    }
  };

  const getSharingBadge = (sharingLevel: string) => {
    const colors = {
      public: 'bg-green-100 text-green-800',
      private: 'bg-gray-100 text-gray-800',
      team: 'bg-blue-100 text-blue-800'
    };
    return (
      <Badge className={colors[sharingLevel as keyof typeof colors] || colors.private}>
        {sharingLevel?.toUpperCase() || 'PRIVATE'}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getGPTAnalytics = (gptId: string) => {
    const gptAnalytics = analytics.filter(a => a.gpt_id === gptId);
    return {
      totalInteractions: gptAnalytics.length,
      uniqueUsers: new Set(gptAnalytics.map(a => a.user_id)).size,
      avgResponseTime: gptAnalytics.length > 0 ? 
        gptAnalytics.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / gptAnalytics.length : 0
    };
  };

  const filteredGPTs = gpts.filter(gpt => {
    const matchesSearch = gpt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gpt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gpt.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterSharing === 'all') return matchesSearch;
    return matchesSearch && gpt.sharing_level === filterSharing;
  });

  // Calculate statistics
  const totalGPTs = gpts.length;
  const publicGPTs = gpts.filter(g => g.sharing_level === 'public').length;
  const activeGPTs = gpts.filter(g => g.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GPTs</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGPTs}</div>
            <p className="text-xs text-muted-foreground">All custom GPTs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public GPTs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicGPTs}</div>
            <p className="text-xs text-muted-foreground">Publicly accessible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active GPTs</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGPTs}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GPT Management</CardTitle>
          <CardDescription>
            Manage all custom GPTs, monitor usage, and control access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search GPTs by name, description, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSharing} onValueChange={setFilterSharing}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sharing Levels</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GPT</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Sharing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGPTs.map((gpt) => {
                  const gptStats = getGPTAnalytics(gpt.id);
                  return (
                    <TableRow key={gpt.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {gpt.avatar_url ? (
                            <img 
                              src={gpt.avatar_url} 
                              alt={gpt.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{gpt.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {gpt.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{gpt.profiles?.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{gpt.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSharingBadge(gpt.sharing_level)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(gpt.is_active)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{gptStats.totalInteractions} interactions</div>
                          <div className="text-xs text-muted-foreground">
                            {gptStats.uniqueUsers} unique users
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(gpt.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setSelectedGPT(gpt)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>GPT Details: {gpt.name}</DialogTitle>
                                <DialogDescription>
                                  View detailed information about this custom GPT
                                </DialogDescription>
                              </DialogHeader>
                              {selectedGPT && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Basic Information</h4>
                                      <div className="text-sm space-y-1">
                                        <div><strong>Name:</strong> {selectedGPT.name}</div>
                                        <div><strong>Model:</strong> {selectedGPT.ai_model}</div>
                                        <div><strong>Sharing:</strong> {selectedGPT.sharing_level}</div>
                                        <div><strong>API Enabled:</strong> {selectedGPT.api_enabled ? 'Yes' : 'No'}</div>
                                        <div><strong>Embed Enabled:</strong> {selectedGPT.embed_enabled ? 'Yes' : 'No'}</div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Usage Statistics</h4>
                                      <div className="text-sm space-y-1">
                                        <div><strong>Total Chats:</strong> {selectedGPT.chat_count}</div>
                                        <div><strong>Interactions:</strong> {getGPTAnalytics(selectedGPT.id).totalInteractions}</div>
                                        <div><strong>Unique Users:</strong> {getGPTAnalytics(selectedGPT.id).uniqueUsers}</div>
                                        <div><strong>Avg Response:</strong> {Math.round(getGPTAnalytics(selectedGPT.id).avgResponseTime)}ms</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedGPT.description || 'No description provided'}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-medium">System Prompt</h4>
                                    <div className="text-sm bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
                                      {selectedGPT.system_prompt || 'No system prompt'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleGPTStatus(gpt.id, gpt.is_active)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteGPT(gpt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredGPTs.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No GPTs found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
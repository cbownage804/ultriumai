import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, GitMerge, Link2, Plus, ChevronRight, Ticket, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type RelationshipType = 'parent_child' | 'merged' | 'related' | 'duplicate';

export function ParentChildTickets() {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRelation, setNewRelation] = useState({
    parent_ticket_id: '',
    child_ticket_id: '',
    relationship_type: 'parent_child' as RelationshipType,
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['ticket-relationships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ticket_relationships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const linkTicketsMutation = useMutation({
    mutationFn: async (relation: typeof newRelation) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_relationships')
        .insert({
          user_id: user.id,
          parent_ticket_id: relation.parent_ticket_id,
          child_ticket_id: relation.child_ticket_id,
          relationship_type: relation.relationship_type,
          notes: relation.notes || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-relationships'] });
      setIsLinkOpen(false);
      setNewRelation({ parent_ticket_id: '', child_ticket_id: '', relationship_type: 'parent_child', notes: '' });
      toast.success('Tickets linked successfully');
    },
    onError: () => toast.error('Failed to link tickets')
  });

  const deleteRelationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_relationships')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-relationships'] });
      toast.success('Relationship removed');
    }
  });

  const getRelationIcon = (type: string) => {
    switch (type) {
      case 'parent_child': return <GitBranch className="h-4 w-4" />;
      case 'merged': return <GitMerge className="h-4 w-4" />;
      case 'related': return <Link2 className="h-4 w-4" />;
      case 'duplicate': return <Ticket className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  const getRelationColor = (type: string) => {
    switch (type) {
      case 'parent_child': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'merged': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'related': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'duplicate': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Group by relationship type
  const groupedRelations = relationships.reduce((acc, rel) => {
    const type = rel.relationship_type || 'related';
    if (!acc[type]) acc[type] = [];
    acc[type].push(rel);
    return acc;
  }, {} as Record<string, typeof relationships>);

  const filteredRelations = relationships.filter(rel =>
    rel.parent_ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rel.child_ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rel.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticket relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-[300px]"
          />
        </div>

        <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Link Tickets
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ticket Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select
                  value={newRelation.relationship_type}
                  onValueChange={(v) => setNewRelation({ ...newRelation, relationship_type: v as RelationshipType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent_child">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Parent / Child
                      </div>
                    </SelectItem>
                    <SelectItem value="merged">
                      <div className="flex items-center gap-2">
                        <GitMerge className="h-4 w-4" />
                        Merged
                      </div>
                    </SelectItem>
                    <SelectItem value="related">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Related
                      </div>
                    </SelectItem>
                    <SelectItem value="duplicate">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Duplicate
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {newRelation.relationship_type === 'parent_child' ? 'Parent Ticket ID' : 'Primary Ticket ID'}
                </Label>
                <Input
                  value={newRelation.parent_ticket_id}
                  onChange={(e) => setNewRelation({ ...newRelation, parent_ticket_id: e.target.value })}
                  placeholder="TKT-001"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {newRelation.relationship_type === 'parent_child' ? 'Child Ticket ID' : 'Secondary Ticket ID'}
                </Label>
                <Input
                  value={newRelation.child_ticket_id}
                  onChange={(e) => setNewRelation({ ...newRelation, child_ticket_id: e.target.value })}
                  placeholder="TKT-002"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={newRelation.notes}
                  onChange={(e) => setNewRelation({ ...newRelation, notes: e.target.value })}
                  placeholder="Reason for linking these tickets..."
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => linkTicketsMutation.mutate(newRelation)}
                disabled={!newRelation.parent_ticket_id || !newRelation.child_ticket_id}
              >
                Link Tickets
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(['parent_child', 'merged', 'related', 'duplicate'] as const).map((type) => (
          <Card key={type}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getRelationColor(type)}`}>
                  {getRelationIcon(type)}
                </div>
                <div>
                  <p className="text-2xl font-bold">{groupedRelations[type]?.length || 0}</p>
                  <p className="text-sm text-muted-foreground capitalize">{type.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relationships List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading relationships...
          </CardContent>
        </Card>
      ) : filteredRelations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No ticket relationships found. Link your first tickets above.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Relationships</CardTitle>
            <CardDescription>{filteredRelations.length} relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRelations.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={getRelationColor(rel.relationship_type || 'related')}>
                      {getRelationIcon(rel.relationship_type || 'related')}
                      <span className="ml-1 capitalize">{rel.relationship_type?.replace('_', ' ')}</span>
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{rel.parent_ticket_id}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{rel.child_ticket_id}</span>
                    </div>
                    {rel.notes && (
                      <span className="text-sm text-muted-foreground">— {rel.notes}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRelationMutation.mutate(rel.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

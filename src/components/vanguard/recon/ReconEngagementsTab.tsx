import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Target, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { useReconEngagements } from '@/hooks/useReconPentest';

export function ReconEngagementsTab() {
  const { loading, engagements, createEngagement } = useReconEngagements();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    engagement_name: '',
    description: '',
    engagement_type: 'internal' as string,
    rules_of_engagement: '',
  });

  const handleCreate = async () => {
    if (!form.engagement_name) return;
    await createEngagement(form);
    setShowCreate(false);
    setForm({ engagement_name: '', description: '', engagement_type: 'internal', rules_of_engagement: '' });
  };

  const typeLabels: Record<string, string> = {
    internal: 'Internal Network',
    external: 'External/Perimeter',
    wireless: 'Wireless',
    web_app: 'Web Application',
    social_engineering: 'Social Engineering',
    full_scope: 'Full Scope',
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-white/10 text-white/50',
    scoping: 'bg-cyan-500/20 text-cyan-400',
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    reporting: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-blue-500/20 text-blue-400',
    archived: 'bg-white/5 text-white/30',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Pentest Engagements</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" /> New Engagement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f0f14] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create Pentest Engagement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Engagement Name</Label>
                <Input placeholder="Q1 2026 Internal Pentest" value={form.engagement_name}
                  onChange={e => setForm(f => ({ ...f, engagement_name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.engagement_type} onValueChange={v => setForm(f => ({ ...f, engagement_type: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f14] border-white/10">
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Scope and objectives..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label>Rules of Engagement</Label>
                <Textarea placeholder="Testing boundaries, restrictions..." value={form.rules_of_engagement}
                  onChange={e => setForm(f => ({ ...f, rules_of_engagement: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">
                Create Engagement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
      ) : engagements.length === 0 ? (
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12 text-center text-white/30">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No engagements yet. Create one to start a pentest.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {engagements.map(eng => (
            <Card key={eng.id} className="bg-black/40 border-white/10 backdrop-blur-xl hover:border-blue-500/30 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{eng.engagement_name}</h3>
                      <Badge className={`text-xs ${statusColors[eng.status] || ''}`}>{eng.status}</Badge>
                      <Badge variant="outline" className="text-xs border-white/10 text-white/50">
                        {typeLabels[eng.engagement_type] || eng.engagement_type}
                      </Badge>
                    </div>
                    {eng.description && <p className="text-xs text-white/40 mb-2">{eng.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {eng.findings_count} findings
                      </span>
                      {eng.critical_count > 0 && (
                        <span className="text-red-400">{eng.critical_count} critical</span>
                      )}
                      {eng.high_count > 0 && (
                        <span className="text-orange-400">{eng.high_count} high</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(eng.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {eng.vanguard_agents && (
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                      {eng.vanguard_agents.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronUp, Plus, Search, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type RequestStatus = 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'declined';

interface FeatureRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  votes_count: number;
  voted: boolean;
  comments_count: number;
  author_name: string | null;
  created_at: string;
}

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  under_review: { label: 'Under Review', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  planned: { label: 'Planned', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  in_progress: { label: 'In Progress', className: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  shipped: { label: 'Shipped', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  declined: { label: 'Declined', className: 'bg-muted text-muted-foreground border-border' },
};

const FeatureRequestBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    const { data: reqs } = await supabase
      .from('feature_requests')
      .select('*')
      .order('votes_count', { ascending: false });

    if (!reqs) { setLoading(false); return; }

    // Check which ones the current user voted on
    let votedIds = new Set<string>();
    if (user) {
      const { data: votes } = await supabase
        .from('feature_request_votes')
        .select('request_id')
        .eq('user_id', user.id);
      votedIds = new Set((votes || []).map(v => v.request_id));
    }

    setRequests(reqs.map(r => ({ ...r, voted: votedIds.has(r.id) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const toggleVote = async (id: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    const req = requests.find(r => r.id === id);
    if (!req) return;

    // Optimistic update
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, voted: !r.voted, votes_count: r.voted ? r.votes_count - 1 : r.votes_count + 1 } : r
    ));

    if (req.voted) {
      await supabase.from('feature_request_votes').delete().eq('request_id', id).eq('user_id', user.id);
    } else {
      await supabase.from('feature_request_votes').insert({ request_id: id, user_id: user.id });
    }
  };

  const submit = async () => {
    if (!user) { toast.error('Sign in to submit'); return; }
    if (!newTitle.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);

    const { error } = await supabase.from('feature_requests').insert({
      title: newTitle,
      description: newDesc || null,
      user_id: user.id,
      author_name: user.email?.split('@')[0] || 'anonymous',
    });

    if (error) { toast.error('Failed to submit'); setSubmitting(false); return; }
    setNewTitle(''); setNewDesc(''); setShowForm(false); setSubmitting(false);
    toast.success('Request submitted!');
    fetchRequests();
  };

  const filtered = requests
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-8 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Feature Requests</h1>
            <p className="text-lg text-muted-foreground">Vote on ideas or submit your own.</p>
          </div>
          {user && (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <Input placeholder="Feature title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Textarea placeholder="Describe your idea..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Submit
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', ...Object.keys(statusConfig)] as const).map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s as any)} className="capitalize text-xs">
                {s === 'all' ? 'All' : statusConfig[s as RequestStatus].label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const sc = statusConfig[(req.status as RequestStatus)] || statusConfig.under_review;
              return (
                <Card key={req.id} className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="py-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => toggleVote(req.id)}
                        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors shrink-0 ${
                          req.voted ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">{req.votes_count}</span>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-medium text-sm">{req.title}</h3>
                          <Badge variant="outline" className={`text-xs ${sc.className}`}>{sc.label}</Badge>
                        </div>
                        {req.description && <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{req.author_name || 'anonymous'}</span>
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{req.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No matching requests found.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FeatureRequestBoard;

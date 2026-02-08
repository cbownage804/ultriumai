import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronUp, Plus, Search, MessageSquare, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type RequestStatus = 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'declined';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  votes: number;
  voted: boolean;
  comments: number;
  author: string;
  created_at: string;
}

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  under_review: { label: 'Under Review', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  planned: { label: 'Planned', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  in_progress: { label: 'In Progress', className: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  shipped: { label: 'Shipped', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  declined: { label: 'Declined', className: 'bg-muted text-muted-foreground border-border' },
};

const initialRequests: FeatureRequest[] = [
  { id: '1', title: 'Multi-language support for AI Studio GPTs', description: 'Allow GPTs to respond in multiple languages with auto-detection.', status: 'planned', votes: 47, voted: false, comments: 12, author: 'alex.m', created_at: '2026-01-28' },
  { id: '2', title: 'Dark mode for Customer Portal', description: 'End-user portal should respect system theme preferences.', status: 'shipped', votes: 83, voted: true, comments: 6, author: 'sarah.k', created_at: '2026-01-15' },
  { id: '3', title: 'Webhook retry configuration', description: 'Let admins configure retry counts and backoff for outbound webhooks.', status: 'in_progress', votes: 34, voted: false, comments: 8, author: 'dev.ops', created_at: '2026-02-01' },
  { id: '4', title: 'Bulk device actions in Vanguard', description: 'Select multiple devices and run commands (restart, update, scan) in batch.', status: 'under_review', votes: 29, voted: false, comments: 5, author: 'msp.tech', created_at: '2026-02-05' },
  { id: '5', title: 'Export compliance reports as PDF', description: 'One-click PDF export for CIS benchmark and compliance scan results.', status: 'planned', votes: 41, voted: false, comments: 3, author: 'compliance.lead', created_at: '2026-01-20' },
  { id: '6', title: 'SSO/SAML support', description: 'Enterprise SSO integration for larger organizations.', status: 'under_review', votes: 62, voted: false, comments: 15, author: 'enterprise.admin', created_at: '2026-01-10' },
];

const FeatureRequestBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const toggleVote = (id: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, voted: !r.voted, votes: r.voted ? r.votes - 1 : r.votes + 1 } : r
    ));
  };

  const submit = () => {
    if (!newTitle.trim()) { toast.error('Title is required'); return; }
    const req: FeatureRequest = {
      id: Date.now().toString(), title: newTitle, description: newDesc,
      status: 'under_review', votes: 1, voted: true, comments: 0,
      author: user?.email?.split('@')[0] || 'anonymous',
      created_at: new Date().toISOString().split('T')[0],
    };
    setRequests(prev => [req, ...prev]);
    setNewTitle(''); setNewDesc(''); setShowForm(false);
    toast.success('Request submitted!');
  };

  const filtered = requests
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.votes - a.votes);

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
                <Button onClick={submit}>Submit</Button>
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

        <div className="space-y-3">
          {filtered.map(req => (
            <Card key={req.id} className="border-border/50 hover:border-border transition-colors">
              <CardContent className="py-4">
                <div className="flex gap-4">
                  {/* Vote button */}
                  <button
                    onClick={() => toggleVote(req.id)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors shrink-0 ${
                      req.voted ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">{req.votes}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-sm">{req.title}</h3>
                      <Badge variant="outline" className={`text-xs ${statusConfig[req.status].className}`}>
                        {statusConfig[req.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{req.author}</span>
                      <span>{req.created_at}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{req.comments}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No matching requests found.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FeatureRequestBoard;

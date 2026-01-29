import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, FileText, Sparkles, Eye, Edit, Save, 
  Send, Clock, CheckCircle2, Tag, Folder, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface KBDraft {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'review' | 'published';
  generatedFrom: string;
  createdAt: string;
  content: string;
  tags: string[];
}

const DEMO_DRAFTS: KBDraft[] = [
  {
    id: '1',
    title: 'Resolving Outlook Autodiscover Configuration Issues',
    category: 'Email & Collaboration',
    status: 'draft',
    generatedFrom: 'Pattern: Outlook Autodiscover Failures (47 tickets)',
    createdAt: '2025-01-29',
    content: `# Resolving Outlook Autodiscover Configuration Issues

## Problem Description
Users may experience issues connecting Outlook to their mailbox when Autodiscover is not properly configured. Common symptoms include:
- "Cannot connect to server" errors
- Outlook continuously prompting for credentials
- Mobile devices working but desktop Outlook failing

## Root Cause
This issue typically occurs after:
- Domain or DNS migrations
- Changes to MX or CNAME records
- SSL certificate updates

## Resolution Steps

### Step 1: Verify Autodiscover Records
1. Open Command Prompt as Administrator
2. Run: \`nslookup autodiscover.yourdomain.com\`
3. Verify it points to \`autodiscover.outlook.com\`

### Step 2: Clear Outlook Profile
1. Close Outlook completely
2. Open Control Panel > Mail
3. Click "Show Profiles" > Remove existing profile
4. Create a new profile

### Step 3: Test Connectivity
Use Microsoft Remote Connectivity Analyzer to verify configuration.

## Prevention
- Always test Autodiscover after DNS changes
- Document DNS configurations before migrations
- Use monitoring to detect Autodiscover failures`,
    tags: ['outlook', 'autodiscover', 'email', 'dns', 'troubleshooting']
  },
  {
    id: '2',
    title: 'FortiClient VPN Connection Stability Guide',
    category: 'Network & Security',
    status: 'review',
    generatedFrom: 'Pattern: VPN Split Tunnel Issues (31 tickets)',
    createdAt: '2025-01-28',
    content: `# FortiClient VPN Connection Stability Guide

## Overview
This guide addresses intermittent VPN disconnections commonly experienced with FortiClient on Windows systems.

## Common Causes
- MTU size mismatches
- ISP-level UDP throttling
- Windows Defender Firewall conflicts
- Router firmware compatibility

## Quick Fixes...`,
    tags: ['vpn', 'forticlient', 'network', 'security']
  }
];

const CATEGORIES = [
  'Email & Collaboration',
  'Network & Security',
  'Hardware & Devices',
  'Cloud Services',
  'Operating Systems',
  'Applications'
];

export function KBArticleGenerator() {
  const [drafts, setDrafts] = useState<KBDraft[]>(DEMO_DRAFTS);
  const [selectedDraft, setSelectedDraft] = useState<KBDraft | null>(DEMO_DRAFTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast.success('KB article draft generated');
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (selectedDraft) {
      setDrafts(drafts.map(d => 
        d.id === selectedDraft.id ? { ...d, content: editContent } : d
      ));
      setEditMode(false);
      toast.success('Draft saved');
    }
  };

  const handlePublish = () => {
    if (selectedDraft) {
      setDrafts(drafts.map(d =>
        d.id === selectedDraft.id ? { ...d, status: 'published' } : d
      ));
      toast.success('Article published to Knowledge Base');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Published</Badge>;
      case 'review':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">In Review</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Wand2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">KB Article Generator</h2>
            <p className="text-sm text-slate-400">AI-powered Knowledge Base article creation from tickets</p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate from Patterns
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Drafts List */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Article Drafts</CardTitle>
            <CardDescription className="text-slate-500">
              {drafts.length} articles in queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => {
                      setSelectedDraft(draft);
                      setEditContent(draft.content);
                      setEditMode(false);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDraft?.id === draft.id
                        ? 'bg-cyan-500/10 border-cyan-500/40'
                        : 'bg-slate-900/50 border-slate-700 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <FileText className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      {getStatusBadge(draft.status)}
                    </div>
                    <p className="text-sm text-white font-medium line-clamp-2">{draft.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{draft.category}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{draft.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Article Editor/Preview */}
        {selectedDraft && (
          <Card className="bg-black/80 border-cyan-500/30 lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedDraft.status)}
                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                      <Folder className="h-3 w-3 mr-1" />
                      {selectedDraft.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white">{selectedDraft.title}</CardTitle>
                  <CardDescription className="text-slate-500 mt-1">
                    {selectedDraft.generatedFrom}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMode(!editMode);
                    if (!editMode) setEditContent(selectedDraft.content);
                  }}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  {editMode ? <Eye className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                  {editMode ? 'Preview' : 'Edit'}
                </Button>
                {editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Draft
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handlePublish}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 ml-auto"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Publish
                </Button>
              </div>

              {/* Content Area */}
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                {editMode ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[400px] bg-slate-900/50 border-0 text-slate-300 font-mono text-sm"
                  />
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-slate-300 text-sm font-sans">
                        {selectedDraft.content}
                      </pre>
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-slate-500" />
                {selectedDraft.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-purple-500/30 text-purple-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

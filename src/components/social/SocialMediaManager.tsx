import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, Send, History, Trash2, ExternalLink, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AIPostGenerator } from './AIPostGenerator';
import { SocialPostComposer } from './SocialPostComposer';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { format } from 'date-fns';

export function SocialMediaManager() {
  const { posts, postsLoading, deletePost } = useSocialPosts();
  const [composerContent, setComposerContent] = useState('');
  const [composerImage, setComposerImage] = useState<string | undefined>();

  const handleUseContent = (content: string, imageUrl?: string) => {
    setComposerContent(content);
    setComposerImage(imageUrl);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" />Posted</Badge>;
      case 'scheduled':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Media Manager</h1>
        <p className="text-muted-foreground">Create, schedule, and manage social media posts with AI assistance</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid lg:grid-cols-2 gap-6">
            <AIPostGenerator onUseContent={handleUseContent} />
            <SocialPostComposer 
              initialContent={composerContent} 
              initialImageUrl={composerImage} 
            />
          </div>
        </TabsContent>

        <TabsContent value="compose">
          <div className="max-w-2xl">
            <SocialPostComposer 
              initialContent={composerContent} 
              initialImageUrl={composerImage} 
            />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Post History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading posts...
                </div>
              ) : !posts || posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts yet. Create your first post above!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="max-w-[200px] truncate font-medium">
                            {post.title}
                          </div>
                          <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {post.post_content.substring(0, 50)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.platforms.slice(0, 3).map((platform, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {platform.substring(0, 8)}
                              </Badge>
                            ))}
                            {post.platforms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.platforms.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(post.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {post.posted_at 
                            ? format(new Date(post.posted_at), 'MMM d, yyyy')
                            : post.scheduled_at 
                              ? format(new Date(post.scheduled_at), 'MMM d, yyyy')
                              : format(new Date(post.created_at), 'MMM d, yyyy')
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {post.bundle_post_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a 
                                  href={`https://app.bundle.social/posts/${post.bundle_post_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePost.mutate(post.id)}
                              disabled={deletePost.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

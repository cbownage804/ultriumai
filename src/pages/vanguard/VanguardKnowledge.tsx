import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, Search, Plus, FileText, Video, Link2, Star,
  Clock, Eye, ThumbsUp, Folder, ChevronRight
} from 'lucide-react';

const articles = [
  { id: '1', title: 'Setting Up Remote Agents', category: 'Getting Started', type: 'article', views: 1250, likes: 45, time: '5 min read', featured: true },
  { id: '2', title: 'Configuring Alert Rules', category: 'Alerts', type: 'article', views: 890, likes: 32, time: '8 min read', featured: false },
  { id: '3', title: 'Patch Management Best Practices', category: 'Security', type: 'video', views: 2100, likes: 78, time: '12 min', featured: true },
  { id: '4', title: 'Customer Onboarding Guide', category: 'Customers', type: 'article', views: 560, likes: 21, time: '10 min read', featured: false },
  { id: '5', title: 'API Integration Tutorial', category: 'Integrations', type: 'article', views: 430, likes: 15, time: '15 min read', featured: false },
  { id: '6', title: 'Backup Configuration', category: 'Backup', type: 'video', views: 780, likes: 29, time: '8 min', featured: false },
];

const categories = [
  { name: 'Getting Started', count: 12, icon: BookOpen },
  { name: 'Alerts', count: 8, icon: FileText },
  { name: 'Security', count: 15, icon: FileText },
  { name: 'Customers', count: 6, icon: FileText },
  { name: 'Integrations', count: 9, icon: Link2 },
  { name: 'Backup', count: 5, icon: FileText },
];

const typeIcons = {
  article: FileText,
  video: Video,
  link: Link2,
};

export default function VanguardKnowledge() {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Knowledge Base | Ultrium Vanguard';
  }, []);

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticles = articles.filter(a => a.featured);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
            <p className="text-white/60 text-sm">Documentation and tutorials</p>
          </div>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <Input 
          placeholder="Search documentation..." 
          className="pl-12 py-6 text-lg bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Featured Articles */}
      {!searchQuery && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Featured Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredArticles.map((article, i) => {
              const TypeIcon = typeIcons[article.type as keyof typeof typeIcons];
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>
                        <TypeIcon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <CardTitle className="text-white mt-2">{article.title}</CardTitle>
                      <CardDescription className="text-white/60">{article.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.time}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className="bg-black/40 border-cyan-500/20 hover:border-cyan-500/40 transition-colors cursor-pointer"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-cyan-400" />
                      <span className="text-white/80">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-800 text-white/60">
                        {category.count}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {searchQuery ? 'Search Results' : 'All Articles'}
          </h2>
          <div className="space-y-3">
            {filteredArticles.map((article, i) => {
              const TypeIcon = typeIcons[article.type as keyof typeof typeIcons];
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                          <TypeIcon className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium">{article.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                            <Badge variant="secondary" className="bg-slate-800">
                              {article.category}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.time}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-white/40" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

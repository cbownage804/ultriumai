/**
 * Portal Knowledge Base - Synced with SafeDoc
 * Multi-tenant aware KB that syncs with customer's SafeDoc documentation
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  BookOpen, 
  FileText, 
  Star,
  ThumbsUp,
  Eye,
  ChevronRight,
  ExternalLink,
  Folder,
  HelpCircle,
  Lightbulb
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import safedocLogo from '@/assets/logos/logo-safedoc.png';

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  source: 'kb' | 'safedoc';
}

interface PortalKnowledgeBaseProps {
  articles: KBArticle[];
  customerId?: string;
  portalBranding?: {
    companyName: string;
    primaryColor: string;
  };
  onViewArticle?: (article: KBArticle) => void;
  onMarkHelpful?: (articleId: string) => void;
}

const categories = [
  { id: 'all', name: 'All Articles', icon: BookOpen },
  { id: 'getting-started', name: 'Getting Started', icon: Lightbulb },
  { id: 'how-to', name: 'How-To Guides', icon: FileText },
  { id: 'faq', name: 'FAQ', icon: HelpCircle },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: Folder },
];

export function PortalKnowledgeBase({ 
  articles, 
  customerId,
  portalBranding,
  onViewArticle,
  onMarkHelpful
}: PortalKnowledgeBaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  // Featured articles for the hero section
  const featuredArticles = articles.filter(a => a.is_featured).slice(0, 3);
  
  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === "" ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || 
      article.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group articles by category for display
  const groupedArticles = filteredArticles.reduce((acc, article) => {
    const cat = article.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(article);
    return acc;
  }, {} as Record<string, KBArticle[]>);

  if (selectedArticle) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        {/* Article Detail View */}
        <div className="p-6 border-b">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArticle(null)}
            className="mb-4"
          >
            ← Back to Knowledge Base
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{selectedArticle.category}</Badge>
                {selectedArticle.source === 'safedoc' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <img src={safedocLogo} alt="SafeDoc" className="h-3 w-auto" />
                    SafeDoc
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedArticle.view_count} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {selectedArticle.helpful_count} found helpful
                </span>
                <span>
                  Updated {formatDistanceToNow(new Date(selectedArticle.updated_at))} ago
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="prose max-w-none">
            {selectedArticle.content}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Was this article helpful?</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onMarkHelpful?.(selectedArticle.id);
                }}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Yes
              </Button>
              <Button variant="outline" size="sm">
                No
              </Button>
            </div>
          </div>

          {selectedArticle.tags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-8 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">
            {portalBranding?.companyName || 'Knowledge Base'}
          </h1>
          <p className="text-teal-100 mb-6">
            Find answers, how-to guides, and documentation for your IT services
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search for articles, guides, FAQs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-lg bg-white text-gray-900 border-0 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* SafeDoc Integration Notice */}
      {customerId && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <img src={safedocLogo} alt="SafeDoc" className="h-6 w-auto" />
              <div className="flex-1">
                <p className="text-sm font-medium text-teal-900">
                  This knowledge base includes documentation from SafeDoc
                </p>
                <p className="text-xs text-teal-700">
                  Articles marked with SafeDoc are synced from your organization's IT documentation
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-teal-700 border-teal-300">
                <ExternalLink className="h-4 w-4 mr-1" />
                Open SafeDoc
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Category Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isActive 
                          ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-500' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && selectedCategory === 'all' && !searchTerm && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Featured
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {featuredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        setSelectedArticle(article);
                        onViewArticle?.(article);
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {article.view_count} views
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Articles List */}
        <div className="col-span-9">
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No articles found matching your search.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Folder className="h-5 w-5 text-teal-500" />
                    {category}
                    <Badge variant="secondary" className="ml-auto">
                      {categoryArticles.length}
                    </Badge>
                  </h3>
                  <Card>
                    <div className="divide-y">
                      {categoryArticles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => {
                            setSelectedArticle(article);
                            onViewArticle?.(article);
                          }}
                          className="w-full p-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="p-2 bg-teal-50 rounded-lg shrink-0">
                            <FileText className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{article.title}</p>
                              {article.source === 'safedoc' && (
                                <img src={safedocLogo} alt="SafeDoc" className="h-3 w-auto opacity-60" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                              {article.content.substring(0, 150)}...
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{article.view_count} views</span>
                              <span>{article.helpful_count} helpful</span>
                              {article.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

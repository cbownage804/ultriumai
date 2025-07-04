import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { 
  BookOpen, 
  Search, 
  Zap, 
  Shield, 
  Settings, 
  Users, 
  MessageSquare,
  Bot,
  FileText,
  Lock,
  Network,
  Mail,
  Link,
  ChevronRight,
  ExternalLink,
  Code,
  Database,
  Globe,
  BarChart3,
  Palette
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  articles: Article[];
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
}

const docSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of UltriumAI platform",
    icon: Zap,
    articles: [
      {
        id: "quick-start",
        title: "Quick Start Guide",
        description: "Get up and running with UltriumAI in 5 minutes",
        category: "Basics",
        content: "# Quick Start Guide\n\nWelcome to UltriumAI! This guide will help you get started with our AI-powered platform in just a few minutes.\n\n## Step 1: Create Your Account\n1. Click \"Sign In\" in the top navigation\n2. Choose \"Sign Up\" to create a new account\n3. Verify your email address\n4. Complete your profile setup\n\n## Step 2: Explore UltriumGPT\n1. Navigate to the UltriumGPT section\n2. Start a conversation with our AI assistant\n3. Ask questions about IT procedures, cybersecurity, or business processes\n4. Upload documents to create custom knowledge bases\n\n## Step 3: Try Security Apps\n1. Visit the \"AI Security Apps\" section\n2. Choose from 8 different security tools\n3. Try the live demos\n\n## Step 4: Customize Your Experience\n1. Set up API integrations\n2. Configure white-label options\n3. Invite team members\n4. Create custom GPT workflows",
        tags: ["basics", "setup", "account"]
      }
    ]
  },
  {
    id: "ultriumgpt",
    title: "UltriumGPT",
    description: "Master our AI assistant for business workflows",
    icon: Bot,
    articles: [
      {
        id: "ultriumgpt-basics",
        title: "UltriumGPT Basics",
        description: "Learn how to effectively use UltriumGPT",
        category: "Usage",
        content: "# UltriumGPT Basics\n\nUltriumGPT is your intelligent business assistant, trained specifically for MSPs, IT teams, and business professionals.\n\n## What UltriumGPT Can Do\n- Answer technical questions about IT procedures\n- Help with cybersecurity best practices\n- Assist with business process documentation\n- Analyze documents and provide insights\n- Generate reports and summaries\n- Troubleshoot common IT issues",
        tags: ["chat", "ai", "assistant", "usage"]
      }
    ]
  },
  {
    id: "security-apps",
    title: "AI Security Apps",
    description: "Comprehensive guides for all 8 security applications",
    icon: Shield,
    articles: [
      {
        id: "safeemail-guide",
        title: "SafeEmail: Email Security Analysis",
        description: "Detect phishing, malware, and threats in emails",
        category: "Security Apps",
        content: "# Ultrium SafeEmail™ Guide\n\nSafeEmail provides AI-powered email analysis and threat detection to protect against phishing, malware, and social engineering attacks.\n\n## Features\n- Real-time phishing detection\n- Malware scanning\n- Link analysis and safety scoring\n- Social engineering detection\n- Detailed threat reports\n- API integration ready",
        tags: ["email", "security", "phishing", "malware"]
      }
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Common issues and solutions",
    icon: Settings,
    articles: [
      {
        id: "common-issues",
        title: "Common Issues & Solutions",
        description: "Troubleshoot frequent problems",
        category: "Support",
        content: "# Common Issues & Solutions\n\n## Login & Account Issues\n\n### Can't Sign In\n- Check email/password: Ensure correct credentials\n- Reset password: Use \"Forgot Password\" link\n- Clear browser cache: Try incognito/private mode\n- Check email verification: Look for verification email\n\n## Getting Help\n- Email: support@ultriumai.com\n- Phone: 804-821-1410\n- Live chat: Available during business hours",
        tags: ["troubleshooting", "support", "issues", "help"]
      }
    ]
  }
];

const Docs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Flatten all articles for search
  const allArticles = docSections.flatMap(section => section.articles);

  // Filter articles based on search and category
  const filteredArticles = allArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(allArticles.map(article => article.category)))];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BookOpen className="h-12 w-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Knowledge Base
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Complete guides, tutorials, and reference materials for UltriumAI platform. 
              Learn how to maximize your productivity with our AI-powered tools.
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-lg"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm capitalize"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {docSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <div
                          key={section.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCategory(section.articles[0]?.category || "all");
                            setSelectedArticle(null);
                          }}
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{section.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {section.articles.length} articles
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedArticle ? (
                /* Article View */
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <button 
                        onClick={() => setSelectedArticle(null)}
                        className="text-primary hover:underline"
                      >
                        ← Back to articles
                      </button>
                    </div>
                    <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                    <CardDescription>{selectedArticle.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: selectedArticle.content
                          .replace(/^#\s(.+)/gm, '<h1>$1</h1>')
                          .replace(/^##\s(.+)/gm, '<h2>$1</h2>')
                          .replace(/\n/g, '<br>')
                      }} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Articles Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredArticles.map((article) => (
                    <Card 
                      key={article.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2 text-xs">
                              {article.category}
                            </Badge>
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {article.description}
                            </CardDescription>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Docs;
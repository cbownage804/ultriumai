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
  Globe
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
        content: `
# Quick Start Guide

Welcome to UltriumAI! This guide will help you get started with our AI-powered platform in just a few minutes.

## Step 1: Create Your Account
1. Click "Sign In" in the top navigation
2. Choose "Sign Up" to create a new account
3. Verify your email address
4. Complete your profile setup

## Step 2: Explore UltriumGPT
1. Navigate to the UltriumGPT section
2. Start a conversation with our AI assistant
3. Ask questions about IT procedures, cybersecurity, or business processes
4. Upload documents to create custom knowledge bases

## Step 3: Try Security Apps
1. Visit the "AI Security Apps" section
2. Choose from 8 different security tools
3. Try the live demos:
   - SafeEmail for email security
   - SafeLink for URL analysis
   - SafeDoc for document management
   - And more!

## Step 4: Customize Your Experience
1. Set up API integrations
2. Configure white-label options
3. Invite team members
4. Create custom GPT workflows

## Next Steps
- Explore our demo section for hands-on examples
- Check out the API documentation
- Join our community for support and tips
        `,
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
        content: `
# UltriumGPT Basics

UltriumGPT is your intelligent business assistant, trained specifically for MSPs, IT teams, and business professionals.

## What UltriumGPT Can Do
- Answer technical questions about IT procedures
- Help with cybersecurity best practices
- Assist with business process documentation
- Analyze documents and provide insights
- Generate reports and summaries
- Troubleshoot common IT issues

## Starting a Conversation
1. Navigate to the UltriumGPT page
2. Type your question in the chat interface
3. Use specific, detailed questions for better results
4. Upload files for document analysis

## Best Practices
- **Be Specific**: Instead of "Help with security," ask "What are the best practices for implementing multi-factor authentication?"
- **Provide Context**: Mention your industry, company size, or specific environment
- **Upload Documents**: Share policies, procedures, or technical documentation for analysis
- **Follow Up**: Ask clarifying questions to get more detailed information

## File Upload Features
- PDF documents (policies, procedures, manuals)
- Word documents (.docx)
- Text files (.txt, .md)
- Images (screenshots, diagrams)
- Maximum file size: 10MB per file

## Example Queries
- "How do I configure a firewall for a small business?"
- "What should be included in an incident response plan?"
- "Help me create a password policy for my organization"
- "Analyze this security policy document and suggest improvements"
        `,
        tags: ["chat", "ai", "assistant", "usage"]
      },
      {
        id: "document-analysis",
        title: "Document Analysis",
        description: "Upload and analyze documents with UltriumGPT",
        category: "Features",
        content: `
# Document Analysis with UltriumGPT

UltriumGPT can analyze various types of documents to extract insights, answer questions, and provide recommendations.

## Supported File Types
- **PDF**: Policies, procedures, reports, manuals
- **Word Documents**: .docx files
- **Text Files**: .txt, .md, .csv
- **Images**: Screenshots, network diagrams, flowcharts

## How to Upload Documents
1. Click the attachment icon in the chat interface
2. Select your file (max 10MB)
3. Wait for upload confirmation
4. Ask questions about the document content

## What You Can Do
- **Summarize**: "Summarize this policy document"
- **Extract Information**: "What are the key requirements in this compliance document?"
- **Compare**: "Compare this procedure with industry best practices"
- **Generate**: "Create a checklist based on this manual"
- **Analyze**: "What security gaps do you see in this policy?"

## Example Use Cases
- Policy review and compliance checking
- Procedure documentation analysis
- Technical manual summarization
- Incident report analysis
- Contract review and risk assessment

## Tips for Better Results
- Upload high-quality, text-readable documents
- Provide context about what you're looking for
- Ask specific questions about document sections
- Use follow-up questions to dive deeper
        `,
        tags: ["documents", "upload", "analysis", "files"]
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
        content: `
# Ultrium SafeEmail™ Guide

SafeEmail provides AI-powered email analysis and threat detection to protect against phishing, malware, and social engineering attacks.

## Features
- Real-time phishing detection
- Malware scanning
- Link analysis and safety scoring
- Social engineering detection
- Detailed threat reports
- API integration ready

## How to Use SafeEmail
1. Navigate to the SafeEmail demo
2. Paste an email or upload an .eml file
3. Click "Analyze Email"
4. Review the detailed security report

## What SafeEmail Detects
- **Phishing Attempts**: Suspicious sender patterns, domain spoofing
- **Malware**: Malicious attachments and embedded threats
- **Social Engineering**: Pressure tactics and urgency indicators
- **Suspicious Links**: URL reputation and redirection analysis
- **Brand Impersonation**: Logo and content similarity detection

## Risk Levels
- **HIGH**: Immediate threat, block or quarantine
- **MEDIUM**: Suspicious content, review before action
- **LOW**: Minor concerns, proceed with caution
- **SAFE**: No threats detected

## API Integration
Use SafeEmail in your applications:
\`\`\`bash
curl -X POST https://api.ultriumai.com/safeemail/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email_content": "email text here"}'
\`\`\`

## Use Cases
- Corporate email protection
- MSP client security
- Personal email screening
- Compliance monitoring
- Security awareness training
        `,
        tags: ["email", "security", "phishing", "malware"]
      },
      {
        id: "safelink-guide",
        title: "SafeLink: URL Security Analysis",
        description: "Comprehensive URL analysis and safety verification",
        category: "Security Apps",
        content: `
# Ultrium SafeLink™ Guide

SafeLink provides comprehensive URL analysis and safety verification to protect against malicious websites and phishing attempts.

## Features
- URL reputation analysis
- Malware detection
- Phishing site identification
- SSL certificate validation
- Domain age and history check
- Real-time scanning results

## How to Use SafeLink
1. Go to the SafeLink demo
2. Enter any URL you want to analyze
3. Click "Analyze Link"
4. Review the comprehensive safety report

## What SafeLink Checks
- **Domain Reputation**: Historical threat data
- **Content Analysis**: Page content and structure
- **SSL Certificate**: Validity and issuer verification
- **Redirect Analysis**: Hidden redirections and chains
- **Malware Scanning**: Known malicious patterns
- **Phishing Detection**: Brand impersonation indicators

## Safety Ratings
- **SAFE**: Verified safe, proceed normally
- **CAUTION**: Minor concerns, proceed carefully
- **WARNING**: Significant risks identified
- **DANGEROUS**: Known threats, avoid completely

## Integration Options
\`\`\`javascript
// Example API call
const response = await fetch('https://api.ultriumai.com/safelink/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://example.com' })
});
\`\`\`

## Use Cases
- Browser extension integration
- Email link verification
- Social media safety
- Employee training tools
- Automated threat blocking
        `,
        tags: ["url", "links", "security", "phishing"]
      }
    ]
  },
  {
    id: "api-integration",
    title: "API Integration",
    description: "Connect UltriumAI to your applications",
    icon: Code,
    articles: [
      {
        id: "api-getting-started",
        title: "API Getting Started",
        description: "Learn how to integrate UltriumAI APIs",
        category: "Development",
        content: `
# API Integration Guide

UltriumAI provides RESTful APIs for all our security applications and AI services.

## Authentication
All API requests require authentication using API keys:
\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.ultriumai.com/endpoint
\`\`\`

## Getting Your API Key
1. Sign in to your UltriumAI account
2. Navigate to Settings > API Keys
3. Click "Generate New Key"
4. Copy and securely store your API key

## Base URL
All API endpoints use the base URL:
\`https://api.ultriumai.com\`

## Available Endpoints
- **SafeEmail**: \`/safeemail/analyze\`
- **SafeLink**: \`/safelink/analyze\`
- **SafeDoc**: \`/safedoc/analyze\`
- **SafeScan**: \`/safescan/analyze\`
- **SafePass**: \`/safepass/analyze\`
- **SafeNet**: \`/safenet/scan\`
- **SafeComp**: \`/safecomp/audit\`
- **SafeWEB**: \`/safeweb/monitor\`
- **UltriumGPT**: \`/chat/completion\`

## Rate Limits
- Free tier: 100 requests per day
- Premium: 1,000 requests per day
- Enterprise: Unlimited requests

## Error Handling
\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is malformed",
    "details": "Missing required parameter: email_content"
  }
}
\`\`\`

## SDK Libraries
We provide SDKs for popular programming languages:
- JavaScript/Node.js
- Python
- PHP
- C#/.NET
- Java
        `,
        tags: ["api", "integration", "development", "sdk"]
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
        content: `
# Common Issues & Solutions

Here are solutions to the most frequently encountered issues.

## Login & Account Issues

### Can't Sign In
- **Check email/password**: Ensure correct credentials
- **Reset password**: Use "Forgot Password" link
- **Clear browser cache**: Try incognito/private mode
- **Check email verification**: Look for verification email

### Account Locked
- Wait 15 minutes after multiple failed attempts
- Contact support if issue persists
- Check spam folder for unlock emails

## UltriumGPT Issues

### Slow Responses
- Check internet connection
- Try refreshing the page
- Clear browser cache
- Large file uploads may take longer

### File Upload Failures
- **File size**: Maximum 10MB per file
- **File type**: Only PDF, DOCX, TXT, images supported
- **Network**: Check stable internet connection
- **Browser**: Try different browser or incognito mode

## Security Apps Issues

### Demo Not Loading
- Refresh the page
- Check browser compatibility (Chrome, Firefox, Safari)
- Disable ad blockers temporarily
- Clear browser cache and cookies

### Analysis Taking Too Long
- Large files require more processing time
- Network connectivity issues
- Server high load (try again later)

## API Integration Issues

### 401 Unauthorized
- Check API key is correct
- Ensure key hasn't expired
- Verify key has required permissions

### 429 Rate Limited
- You've exceeded rate limits
- Wait before making more requests
- Upgrade plan for higher limits

### 500 Server Error
- Temporary server issue
- Try again in a few minutes
- Contact support if persistent

## Performance Issues

### Slow Page Loading
- Check internet connection speed
- Disable browser extensions
- Clear browser cache
- Try different browser

### Memory Issues
- Close unnecessary browser tabs
- Restart browser
- Check available system memory

## Getting Help
- Email: support@ultriumai.com
- Phone: 804-821-1410
- Live chat: Available during business hours
- Community forum: https://community.ultriumai.com
        `,
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
                Documentation
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
                  placeholder="Search documentation..."
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

                {/* Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a href="/ultriumgpt" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Bot className="h-4 w-4" />
                      Try UltriumGPT
                    </a>
                    <a href="/demos" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Zap className="h-4 w-4" />
                      Live Demos
                    </a>
                    <a href="mailto:support@ultriumai.com" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Mail className="h-4 w-4" />
                      Contact Support
                    </a>
                    <a href="tel:804-821-1410" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Users className="h-4 w-4" />
                      Call: 804-821-1410
                    </a>
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
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedArticle.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: selectedArticle.content
                          .replace(/^#\s(.+)/gm, '<h1>$1</h1>')
                          .replace(/^##\s(.+)/gm, '<h2>$1</h2>')
                          .replace(/^###\s(.+)/gm, '<h3>$1</h3>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`([^`]+)`/g, '<code>$1</code>')
                          .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                          .replace(/^-\s(.+)/gm, '<li>$1</li>')
                          .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                          .replace(/\n/g, '<br>')
                      }} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Articles Grid */
                <>
                  {searchTerm && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">
                        Search Results for "{searchTerm}"
                      </h2>
                      <p className="text-muted-foreground">
                        Found {filteredArticles.length} articles
                      </p>
                    </div>
                  )}

                  {!searchTerm && selectedCategory === "all" ? (
                    /* Category Overview */
                    <div className="space-y-8">
                      {docSections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <div key={section.id}>
                            <div className="flex items-center gap-3 mb-4">
                              <Icon className="h-6 w-6 text-primary" />
                              <h2 className="text-2xl font-bold">{section.title}</h2>
                            </div>
                            <p className="text-muted-foreground mb-6">{section.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {section.articles.map((article) => (
                                <Card 
                                  key={article.id} 
                                  className="hover:shadow-lg transition-shadow cursor-pointer"
                                  onClick={() => setSelectedArticle(article)}
                                >
                                  <CardHeader>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <CardTitle className="text-lg">{article.title}</CardTitle>
                                        <CardDescription className="mt-2">
                                          {article.description}
                                        </CardDescription>
                                      </div>
                                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-3">
                                      {article.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardHeader>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Filtered Articles */
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
                            <div className="flex flex-wrap gap-1 mt-3">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}

                  {filteredArticles.length === 0 && searchTerm && (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or browse by category
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Need More Help?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@ultriumai.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-5 w-5" />
                Email Support
              </a>
              <a 
                href="tel:804-821-1410"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5" />
                Call: 804-821-1410
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Docs;
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FirecrawlService } from '@/services/FirecrawlService';

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  markdown: string;
  crawledAt: string;
  wordCount: number;
}

interface WebCrawlerProps {
  gptId: string;
  onCrawlComplete: (results: CrawlResult[]) => void;
}

export const WebCrawler = ({ gptId, onCrawlComplete }: WebCrawlerProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [apiKey, setApiKey] = useState(FirecrawlService.getApiKey() || '');

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    const isValid = await FirecrawlService.testApiKey(apiKey);
    if (isValid) {
      FirecrawlService.saveApiKey(apiKey);
      toast({
        title: "Success",
        description: "API key validated and saved",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid API key. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResults([]);
    
    try {
      console.log('Starting crawl for URL:', url);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await FirecrawlService.crawlWebsite(url, gptId);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success && result.data) {
        const processedResults: CrawlResult[] = result.data.data?.map((item: any) => ({
          url: item.url || url,
          title: item.metadata?.title || 'Untitled',
          content: item.html || '',
          markdown: item.markdown || '',
          crawledAt: new Date().toISOString(),
          wordCount: item.markdown ? item.markdown.split(' ').length : 0
        })) || [];

        setCrawlResults(processedResults);
        onCrawlComplete(processedResults);
        
        toast({
          title: "Success",
          description: `Successfully crawled ${processedResults.length} page(s)`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to crawl website",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savedApiKey = FirecrawlService.getApiKey();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web Crawler
        </CardTitle>
        <CardDescription>
          Crawl websites to extract content for your knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!savedApiKey && (
          <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
            <h4 className="font-medium text-primary mb-2">🔑 API Key Required</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Enter your Firecrawl API key to enable web crawling. Get one at{' '}
              <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                firecrawl.dev
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="fc-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleApiKeySubmit} variant="outline">
                Save Key
              </Button>
            </div>
          </div>
        )}

        {savedApiKey && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">API key configured</span>
            <Badge variant="outline" className="text-xs">Ready</Badge>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crawl-url">Website URL</Label>
            <Input
              id="crawl-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={!savedApiKey}
            />
            <p className="text-xs text-muted-foreground">
              The crawler will discover and process multiple pages from this domain
            </p>
          </div>
          
          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Crawling website... This may take a few minutes
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={isLoading || !savedApiKey || !url.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Start Crawl
              </>
            )}
          </Button>
        </form>

        {crawlResults.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Crawl Results</h4>
            <div className="space-y-2 max-h-60 overflow-auto">
              {crawlResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {result.wordCount} words
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(result.crawledAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
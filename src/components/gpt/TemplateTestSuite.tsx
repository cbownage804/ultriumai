import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw
} from "lucide-react";
import { gptTemplates } from "@/data/gptTemplates";
import { GPTTemplate } from "@/types/templates";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TemplateTestResult {
  templateId: string;
  templateName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  response?: string;
  error?: string;
  duration?: number;
  testQuestion: string;
}

const TemplateTestSuite = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TemplateTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const initializeTests = () => {
    return gptTemplates.map(template => ({
      templateId: template.id,
      templateName: template.name,
      status: 'pending' as const,
      testQuestion: template.starter_questions[0] || 'Hello, can you help me?'
    }));
  };

  const runSingleTest = async (template: GPTTemplate, testQuestion: string): Promise<TemplateTestResult> => {
    const startTime = Date.now();
    
    try {
      // Use the chat-completion edge function with proper format
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'user', content: testQuestion }
          ],
          customGPT: {
            id: template.id,
            system_prompt: template.system_prompt,
            name: template.name
          },
          modelParams: {
            model: template.config.preferred_model || 'gpt-4o',
            temperature: 0.7,
            max_tokens: 500 // Limit for testing
          }
        }
      });

      const duration = Date.now() - startTime;

      if (error) {
        return {
          templateId: template.id,
          templateName: template.name,
          status: 'failed',
          error: error.message,
          duration,
          testQuestion
        };
      }

      // Check if response is meaningful - handle different response formats
      const response = data?.generatedText || data?.choices?.[0]?.message?.content || data?.response || data?.content || '';
      const isPassed = response.length > 50 && !response.toLowerCase().includes('error');

      return {
        templateId: template.id,
        templateName: template.name,
        status: isPassed ? 'passed' : 'failed',
        response: response.substring(0, 500) + (response.length > 500 ? '...' : ''),
        error: isPassed ? undefined : 'Response too short or contains errors',
        duration,
        testQuestion
      };
    } catch (err) {
      return {
        templateId: template.id,
        templateName: template.name,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        duration: Date.now() - startTime,
        testQuestion
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const initialResults = initializeTests();
    setTestResults(initialResults);

    for (let i = 0; i < gptTemplates.length; i++) {
      const template = gptTemplates[i];
      
      // Update status to running
      setTestResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'running' as const } : r
      ));

      const result = await runSingleTest(template, template.starter_questions[0] || 'Hello, can you help me?');
      
      setTestResults(prev => prev.map((r, idx) => 
        idx === i ? result : r
      ));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    
    const passedCount = testResults.filter(r => r.status === 'passed').length;
    toast({
      title: "Testing Complete",
      description: `${passedCount}/${gptTemplates.length} templates passed`,
    });
  };

  const runSingleTemplateTest = async (templateId: string) => {
    const template = gptTemplates.find(t => t.id === templateId);
    if (!template) return;

    setTestResults(prev => prev.map(r => 
      r.templateId === templateId ? { ...r, status: 'running' as const } : r
    ));

    const result = await runSingleTest(template, template.starter_questions[0] || 'Hello, can you help me?');
    
    setTestResults(prev => prev.map(r => 
      r.templateId === templateId ? result : r
    ));
  };

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
  };

  const getStatusIcon = (status: TemplateTestResult['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'passed': return <Check className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TemplateTestResult['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'running': return <Badge variant="outline" className="border-blue-500 text-blue-500">Running</Badge>;
      case 'passed': return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const passedCount = testResults.filter(r => r.status === 'passed').length;
  const failedCount = testResults.filter(r => r.status === 'failed').length;
  const pendingCount = testResults.filter(r => r.status === 'pending' || r.status === 'running').length;

  // Group templates by category
  const templatesByCategory = gptTemplates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, GPTTemplate[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Test Suite</h2>
          <p className="text-muted-foreground">
            Test all {gptTemplates.length} templates to ensure they work correctly
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-500/10">
              <Check className="h-3 w-3 mr-1" /> {passedCount} Passed
            </Badge>
            <Badge variant="outline" className="bg-red-500/10">
              <X className="h-3 w-3 mr-1" /> {failedCount} Failed
            </Badge>
            <Badge variant="outline">
              <AlertCircle className="h-3 w-3 mr-1" /> {pendingCount} Pending
            </Badge>
          </div>
          <Button onClick={runAllTests} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates ({gptTemplates.length})</TabsTrigger>
          {Object.keys(templatesByCategory).slice(0, 5).map(category => (
            <TabsTrigger key={category} value={category}>
              {category} ({templatesByCategory[category].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {testResults.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Click "Run All Tests" to start testing templates
                  </CardContent>
                </Card>
              ) : (
                testResults.map((result) => (
                  <Collapsible 
                    key={result.templateId}
                    open={expandedTemplates.has(result.templateId)}
                    onOpenChange={() => toggleExpanded(result.templateId)}
                  >
                    <Card className={`${
                      result.status === 'failed' ? 'border-red-500/50' : 
                      result.status === 'passed' ? 'border-green-500/50' : ''
                    }`}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedTemplates.has(result.templateId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {getStatusIcon(result.status)}
                              <div>
                                <CardTitle className="text-sm font-medium">
                                  {result.templateName}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {result.duration ? `${result.duration}ms` : 'Not run yet'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(result.status)}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runSingleTemplateTest(result.templateId);
                                }}
                                disabled={result.status === 'running'}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Test Question:</p>
                            <p className="text-sm bg-muted p-2 rounded">{result.testQuestion}</p>
                          </div>
                          {result.error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                            </div>
                          )}
                          {result.response && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-muted-foreground">Response:</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(result.response || '')}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                                {result.response}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {Object.entries(templatesByCategory).slice(0, 5).map(([category, templates]) => (
          <TabsContent key={category} value={category} className="mt-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {templates.map((template) => {
                  const result = testResults.find(r => r.templateId === template.id);
                  return (
                    <Card key={template.id}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{template.icon}</span>
                            <div>
                              <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                              <CardDescription className="text-xs">{template.description}</CardDescription>
                            </div>
                          </div>
                          {result ? getStatusBadge(result.status) : <Badge variant="secondary">Not Tested</Badge>}
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TemplateTestSuite;

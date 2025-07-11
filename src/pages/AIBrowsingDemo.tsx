import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Brain, Command, Trash2 } from "lucide-react";
import RealTimeAIChat from '@/components/RealTimeAIChat';
import { AIMemoryManager } from '@/components/AIMemoryManager';

const AIBrowsingDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Web Browsing & Memory System
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your AI assistant can now browse the web, learn from websites, and build persistent memory. 
            Use commands to teach your AI about any topic in real-time.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Quick Browse</h3>
              <p className="text-sm text-muted-foreground">Use <code>/browse [url]</code> to instantly learn from any webpage</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Deep Learning</h3>
              <p className="text-sm text-muted-foreground">Use <code>/learn [url]</code> to comprehensively study entire websites</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Command className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Memory View</h3>
              <p className="text-sm text-muted-foreground">Use <code>/memory</code> to see everything your AI has learned</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold mb-2">Selective Forgetting</h3>
              <p className="text-sm text-muted-foreground">Use <code>/forget [topic]</code> to remove specific knowledge</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Available Commands
            </CardTitle>
            <CardDescription>
              Use these commands in the AI chat to control web browsing and memory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Badge variant="secondary" className="mt-0.5">/browse</Badge>
                  <div>
                    <p className="font-medium text-sm">Quick Page Browse</p>
                    <p className="text-xs text-muted-foreground">Instantly scrape and learn from a single webpage</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/browse https://example.com</code>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Badge variant="secondary" className="mt-0.5">/learn</Badge>
                  <div>
                    <p className="font-medium text-sm">Deep Website Learning</p>
                    <p className="text-xs text-muted-foreground">Crawl and comprehensively study an entire website</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/learn https://docs.example.com</code>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Badge variant="secondary" className="mt-0.5">/memory</Badge>
                  <div>
                    <p className="font-medium text-sm">View Current Memory</p>
                    <p className="text-xs text-muted-foreground">See all learned knowledge, topics, and statistics</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/memory</code>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Badge variant="secondary" className="mt-0.5">/forget</Badge>
                  <div>
                    <p className="font-medium text-sm">Selective Forgetting</p>
                    <p className="text-xs text-muted-foreground">Remove specific knowledge by topic or keyword</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/forget react documentation</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Chat */}
          <div>
            <h2 className="text-2xl font-bold mb-4">AI Assistant</h2>
            <RealTimeAIChat 
              context="general" 
              title="Browsing AI Assistant"
            />
          </div>

          {/* Memory Manager */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Memory Manager</h2>
            <AIMemoryManager />
          </div>
        </div>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Try These Examples</CardTitle>
            <CardDescription>
              Copy and paste these commands into the AI chat to see the browsing system in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Learn from Documentation</h4>
                <code className="text-xs block bg-muted p-2 rounded">/learn https://react.dev</code>
                <p className="text-xs text-muted-foreground mt-2">Study React documentation comprehensively</p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Quick News Check</h4>
                <code className="text-xs block bg-muted p-2 rounded">/browse https://news.ycombinator.com</code>
                <p className="text-xs text-muted-foreground mt-2">Get current tech news and trends</p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Check Your Knowledge</h4>
                <code className="text-xs block bg-muted p-2 rounded">/memory</code>
                <p className="text-xs text-muted-foreground mt-2">View everything you've taught the AI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIBrowsingDemo;
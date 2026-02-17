import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Code, Key, Activity, BookOpen, Plus, Zap, Code2 } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { CreateApiKeyDialog } from "./apiManager/CreateApiKeyDialog";
import { ApiKeyList } from "./apiManager/ApiKeyList";
import { ApiUsageDashboard } from "./apiManager/ApiUsageDashboard";
import { ApiDocumentation } from "./apiManager/ApiDocumentation";
import { APIPlayground } from "./apiManager/APIPlayground";
import { SDKSnippets } from "./apiManager/SDKSnippets";

const APIManager = () => {
  const { apiKeys, loading } = useApiKeys();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const activeKeys = apiKeys.filter(key => key.is_active);
  const totalUsage = apiKeys.reduce((sum, key) => sum + key.usage_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Developer Portal</h2>
          <p className="text-muted-foreground">
            API keys, playground, SDK snippets, usage analytics & documentation
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.length - activeKeys.length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all API keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Operational</div>
            <p className="text-xs text-muted-foreground">
              All systems normal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="playground" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="playground" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Playground
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="snippets" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            SDKs
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Docs
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-4">
          <APIPlayground />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <ApiKeyList />
        </TabsContent>

        <TabsContent value="snippets" className="space-y-4">
          <SDKSnippets />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <ApiUsageDashboard />
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <ApiDocumentation />
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Integration examples for popular languages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">JavaScript / Node.js</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`const response = await fetch('https://nsyobmjpdpvesjwdphlh.functions.supabase.co/chat-completion', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gpt_id: 'your-gpt-id',
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const data = await response.json();
console.log(data);`}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Python</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import requests

response = requests.post(
    'https://nsyobmjpdpvesjwdphlh.functions.supabase.co/chat-completion',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'gpt_id': 'your-gpt-id',
        'messages': [
            {'role': 'user', 'content': 'Hello!'}
        ]
    }
)

print(response.json())`}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">cURL</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST https://nsyobmjpdpvesjwdphlh.functions.supabase.co/chat-completion \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gpt_id": "your-gpt-id",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateApiKeyDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
};

export default APIManager;

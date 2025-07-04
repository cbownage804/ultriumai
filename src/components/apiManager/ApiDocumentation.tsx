import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export const ApiDocumentation = () => {
  const baseUrl = "https://nsyobmjpdpvesjwdphlh.functions.supabase.co";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CodeBlock = ({ children, language = "bash" }: { children: string; language?: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
        <code>{children}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(children)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Learn how to integrate with the UltriumGPT API to power your applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <CodeBlock>{baseUrl}</CodeBlock>
          </div>

          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header:
            </p>
            <CodeBlock>Authorization: Bearer YOUR_API_KEY</CodeBlock>
          </div>

          <div>
            <h4 className="font-medium mb-2">Content Type</h4>
            <p className="text-sm text-muted-foreground mb-2">
              All requests should include the content type header:
            </p>
            <CodeBlock>Content-Type: application/json</CodeBlock>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat Completion</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">POST</Badge>
                <CardTitle className="text-lg">/chat-completion</CardTitle>
              </div>
              <CardDescription>
                Send messages to your GPT and receive streaming responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <CodeBlock language="json">
{`{
  "gpt_id": "your-gpt-id",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how can you help me?"
    }
  ],
  "stream": true,
  "max_tokens": 1000,
  "temperature": 0.7
}`}
                </CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <CodeBlock language="json">
{`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm here to help you with..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 20,
    "total_tokens": 32
  }
}`}
                </CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example Request</h4>
                <CodeBlock>
{`curl -X POST ${baseUrl}/chat-completion \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gpt_id": "your-gpt-id",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">GET</Badge>
                <CardTitle className="text-lg">/analytics/{`{gpt_id}`}</CardTitle>
              </div>
              <CardDescription>
                Retrieve usage analytics for your GPT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div><code>start_date</code> - Start date for analytics (YYYY-MM-DD)</div>
                  <div><code>end_date</code> - End date for analytics (YYYY-MM-DD)</div>
                  <div><code>granularity</code> - Data granularity (hour, day, week, month)</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <CodeBlock language="json">
{`{
  "gpt_id": "your-gpt-id",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "metrics": {
    "total_conversations": 1250,
    "total_messages": 5600,
    "total_tokens": 125000,
    "unique_users": 450,
    "average_response_time": 245,
    "satisfaction_rating": 4.6
  },
  "daily_breakdown": [
    {
      "date": "2024-01-01",
      "conversations": 45,
      "messages": 180,
      "tokens": 4500
    }
  ]
}`}
                </CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example Request</h4>
                <CodeBlock>
{`curl -X GET "${baseUrl}/analytics/your-gpt-id?start_date=2024-01-01&end_date=2024-01-31" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">GET</Badge>
                <CardTitle className="text-lg">/gpts</CardTitle>
              </div>
              <CardDescription>
                List all your available GPTs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <CodeBlock language="json">
{`{
  "gpts": [
    {
      "id": "gpt-123",
      "name": "Customer Support Assistant",
      "description": "Handles customer inquiries and support tickets",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "chat_count": 1250
    },
    {
      "id": "gpt-456",
      "name": "Sales Assistant",
      "description": "Helps with sales inquiries and product information",
      "is_active": true,
      "created_at": "2024-01-02T00:00:00Z",
      "chat_count": 890
    }
  ]
}`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">GET</Badge>
                <CardTitle className="text-lg">/gpts/{`{id}`}</CardTitle>
              </div>
              <CardDescription>
                Get detailed information about a specific GPT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <CodeBlock language="json">
{`{
  "id": "gpt-123",
  "name": "Customer Support Assistant",
  "description": "Handles customer inquiries and support tickets",
  "system_prompt": "You are a helpful customer support assistant...",
  "is_active": true,
  "settings": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 1.0
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "chat_count": 1250
}`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle>Error Handling</CardTitle>
          <CardDescription>Understanding API error responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Error Response Format</h4>
            <CodeBlock language="json">
{`{
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_api_key",
    "message": "Invalid API key provided",
    "param": null
  }
}`}
            </CodeBlock>
          </div>

          <div>
            <h4 className="font-medium mb-2">Common Error Codes</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">401</Badge>
                <span>Unauthorized - Invalid API key</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">403</Badge>
                <span>Forbidden - Insufficient permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">429</Badge>
                <span>Rate Limit Exceeded</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">500</Badge>
                <span>Internal Server Error</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>Understanding API rate limiting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rate limits are enforced per API key and are configurable when creating the key.
            When you exceed the limit, you'll receive a 429 status code.
          </p>

          <div>
            <h4 className="font-medium mb-2">Rate Limit Headers</h4>
            <CodeBlock>
{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1677652348`}
            </CodeBlock>
          </div>

          <div>
            <h4 className="font-medium mb-2">Best Practices</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Implement exponential backoff for retries</li>
              <li>Cache responses when possible</li>
              <li>Monitor rate limit headers</li>
              <li>Use multiple API keys for high-volume applications</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
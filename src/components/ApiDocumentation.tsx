import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Code, 
  Copy, 
  Play, 
  Key, 
  Shield, 
  Zap,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Settings,
  Database,
  Webhook
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    example: string;
  };
  responses: Array<{
    code: number;
    description: string;
    example: string;
  }>;
}

const ApiDocumentation = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('chat');
  const [testRequest, setTestRequest] = useState({
    endpoint: '',
    method: 'GET',
    headers: '{"Authorization": "Bearer YOUR_API_KEY"}',
    body: ''
  });

  const apiEndpoints: Record<string, APIEndpoint> = {
    chat: {
      method: 'POST',
      path: '/api/v1/chat',
      title: 'Send Chat Message',
      description: 'Send a message to a GPT and receive a response',
      parameters: [
        { name: 'gpt_id', type: 'string', required: true, description: 'The ID of the GPT to chat with' }
      ],
      requestBody: {
        type: 'application/json',
        example: JSON.stringify({
          message: "Hello, how can you help me with cybersecurity?",
          conversation_id: "optional-conversation-id",
          user_id: "user-123"
        }, null, 2)
      },
      responses: [
        {
          code: 200,
          description: 'Successful response',
          example: JSON.stringify({
            response: "I can help you with various cybersecurity topics...",
            conversation_id: "conv-456",
            tokens_used: 45,
            response_time_ms: 1250
          }, null, 2)
        },
        {
          code: 401,
          description: 'Unauthorized - Invalid API key',
          example: JSON.stringify({ error: "Invalid API key" }, null, 2)
        }
      ]
    },
    scan: {
      method: 'POST',
      path: '/api/v1/security/scan',
      title: 'Security Scan',
      description: 'Perform security scans on documents, emails, or networks',
      parameters: [
        { name: 'scan_type', type: 'string', required: true, description: 'Type of scan: document, email, network' }
      ],
      requestBody: {
        type: 'multipart/form-data',
        example: `{
  "scan_type": "document",
  "file": "<binary_file_data>",
  "options": {
    "deep_scan": true,
    "generate_report": true
  }
}`
      },
      responses: [
        {
          code: 200,
          description: 'Scan completed',
          example: JSON.stringify({
            scan_id: "scan-789",
            status: "completed",
            threat_level: "low",
            threats_found: 0,
            scan_duration_ms: 3500,
            report_url: "https://api.ultrium.ai/reports/scan-789"
          }, null, 2)
        }
      ]
    },
    webhooks: {
      method: 'POST',
      path: '/api/v1/webhooks',
      title: 'Create Webhook',
      description: 'Create a webhook to receive real-time notifications',
      requestBody: {
        type: 'application/json',
        example: JSON.stringify({
          url: "https://your-server.com/webhook",
          events: ["security.threat_detected", "compliance.alert_triggered"],
          secret: "your-webhook-secret"
        }, null, 2)
      },
      responses: [
        {
          code: 201,
          description: 'Webhook created',
          example: JSON.stringify({
            webhook_id: "webhook-123",
            url: "https://your-server.com/webhook",
            events: ["security.threat_detected", "compliance.alert_triggered"],
            created_at: "2024-01-15T10:30:00Z"
          }, null, 2)
        }
      ]
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const executeTestRequest = () => {
    toast({
      title: "Test Request Sent",
      description: "Check the Network tab in your browser dev tools for the actual request",
    });
  };

  const codeExamples = {
    javascript: `// JavaScript/Node.js Example
const response = await fetch('https://api.ultrium.ai/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help with security?',
    gpt_id: 'your-gpt-id'
  })
});

const data = await response.json();
console.log(data.response);`,
    python: `# Python Example
import requests

url = "https://api.ultrium.ai/v1/chat"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "message": "Hello, how can you help with security?",
    "gpt_id": "your-gpt-id"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result["response"])`,
    curl: `# cURL Example
curl -X POST "https://api.ultrium.ai/v1/chat" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help with security?",
    "gpt_id": "your-gpt-id"
  }'`
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Code className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">API Documentation</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Integrate Ultrium's AI and security capabilities into your applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="testing">API Tester</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  All API requests require authentication using API keys.
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-6 w-6 p-0"
                    onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Manage API Keys
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Requests per minute:</span>
                    <Badge variant="secondary">60</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Requests per day:</span>
                    <Badge variant="secondary">1,000</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Concurrent requests:</span>
                    <Badge variant="secondary">10</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rate limits vary by plan. Enterprise customers get higher limits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Base URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <code className="text-sm">https://api.ultrium.ai/v1</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-6 w-6 p-0"
                    onClick={() => copyToClipboard('https://api.ultrium.ai/v1')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  All endpoints are relative to this base URL.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-success">API Status: Operational</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get started with the Ultrium API in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">1</div>
                    <h4 className="font-medium">Get API Key</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Create an account and generate your API key from the dashboard.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">2</div>
                    <h4 className="font-medium">Make Request</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Send your first API request using your preferred programming language.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">3</div>
                    <h4 className="font-medium">Integrate</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Build your application using our SDKs and comprehensive documentation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(apiEndpoints).map(([key, endpoint]) => (
                    <Button
                      key={key}
                      variant={selectedEndpoint === key ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedEndpoint(key)}
                    >
                      <Badge variant="outline" className="mr-2 text-xs">
                        {endpoint.method}
                      </Badge>
                      {endpoint.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {apiEndpoints[selectedEndpoint] && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{apiEndpoints[selectedEndpoint].method}</Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {apiEndpoints[selectedEndpoint].path}
                      </code>
                    </div>
                    <CardTitle>{apiEndpoints[selectedEndpoint].title}</CardTitle>
                    <CardDescription>{apiEndpoints[selectedEndpoint].description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {apiEndpoints[selectedEndpoint].parameters && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Parameters</h4>
                        <div className="space-y-2">
                          {apiEndpoints[selectedEndpoint].parameters!.map((param, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-sm font-mono">{param.name}</code>
                                <Badge variant={param.required ? "default" : "secondary"} className="text-xs">
                                  {param.required ? "required" : "optional"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{param.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apiEndpoints[selectedEndpoint].requestBody && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Request Body</h4>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{apiEndpoints[selectedEndpoint].requestBody!.example}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(apiEndpoints[selectedEndpoint].requestBody!.example)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h4 className="font-semibold">Responses</h4>
                      <div className="space-y-4">
                        {apiEndpoints[selectedEndpoint].responses.map((response, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={response.code === 200 ? "default" : "destructive"}>
                                {response.code}
                              </Badge>
                              <span className="text-sm font-medium">{response.description}</span>
                            </div>
                            <div className="relative">
                              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                <code>{response.example}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => copyToClipboard(response.example)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(codeExamples).map(([language, code]) => (
              <Card key={language}>
                <CardHeader>
                  <CardTitle className="capitalize">{language}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                API Tester
              </CardTitle>
              <CardDescription>Test API endpoints directly from the documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Select value={testRequest.endpoint} onValueChange={(value) => setTestRequest(prev => ({ ...prev, endpoint: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(apiEndpoints).map(([key, endpoint]) => (
                        <SelectItem key={key} value={key}>
                          {endpoint.method} {endpoint.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Input
                    id="method"
                    value={testRequest.method}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, method: e.target.value }))}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={testRequest.headers}
                  onChange={(e) => setTestRequest(prev => ({ ...prev, headers: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={testRequest.body}
                  onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter request body JSON..."
                  rows={8}
                />
              </div>

              <Button onClick={executeTestRequest} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Send Test Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Receive real-time notifications about events in your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Available Events</h4>
                  <div className="space-y-2">
                    {[
                      'security.threat_detected',
                      'security.scan_completed',
                      'compliance.alert_triggered',
                      'compliance.audit_completed',
                      'chat.message_received',
                      'api.rate_limit_exceeded'
                    ].map((event) => (
                      <div key={event} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <code className="text-sm">{event}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Webhook Payload Example</h4>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{JSON.stringify({
                        event: "security.threat_detected",
                        timestamp: "2024-01-15T10:30:00Z",
                        data: {
                          threat_id: "threat-456",
                          threat_type: "malware",
                          severity: "high",
                          affected_resource: "document-789"
                        }
                      }, null, 2)}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => copyToClipboard(JSON.stringify({
                        event: "security.threat_detected",
                        timestamp: "2024-01-15T10:30:00Z",
                        data: {
                          threat_id: "threat-456",
                          threat_type: "malware",
                          severity: "high",
                          affected_resource: "document-789"
                        }
                      }, null, 2))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocumentation;
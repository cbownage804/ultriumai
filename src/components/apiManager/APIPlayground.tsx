import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Play, Copy, Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PlaygroundResponse {
  status: number;
  body: any;
  latency: number;
  headers: Record<string, string>;
}

export const APIPlayground = () => {
  const { gpts } = useCustomGPTs();
  const { apiKeys } = useApiKeys();

  const [selectedGpt, setSelectedGpt] = useState<string>("");
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [message, setMessage] = useState("Hello! Tell me about yourself.");
  const [stream, setStream] = useState(false);
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [activeTab, setActiveTab] = useState("request");

  const activeKeys = apiKeys.filter(k => k.is_active);
  const selectedGptData = gpts.find(g => g.id === selectedGpt);

  const baseUrl = `https://nsyobmjpdpvesjwdphlh.functions.supabase.co`;

  const requestPayload = {
    gpt_id: selectedGpt || "YOUR_GPT_ID",
    messages: [{ role: "user", content: message }],
    stream,
    max_tokens: maxTokens,
    temperature,
  };

  const curlCommand = `curl -X POST ${baseUrl}/chat-completion \\
  -H "Authorization: Bearer ${selectedKeyId ? `${activeKeys.find(k => k.id === selectedKeyId)?.key_prefix}••••••••` : 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestPayload, null, 2)}'`;

  const handleSend = useCallback(async () => {
    if (!selectedGpt) return;
    setIsLoading(true);
    setResponse(null);
    setActiveTab("response");

    const start = performance.now();

    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          gpt_id: selectedGpt,
          messages: [{ role: "user", content: message }],
          max_tokens: maxTokens,
          temperature,
        },
      });

      const latency = Math.round(performance.now() - start);

      if (error) {
        setResponse({
          status: 500,
          body: { error: { message: error.message, type: 'function_error' } },
          latency,
          headers: { 'content-type': 'application/json' },
        });
      } else {
        setResponse({
          status: 200,
          body: data,
          latency,
          headers: {
            'content-type': 'application/json',
            'x-response-time': `${latency}ms`,
          },
        });
      }
    } catch (err: any) {
      setResponse({
        status: 500,
        body: { error: { message: err.message || 'Network error', type: 'network_error' } },
        latency: Math.round(performance.now() - start),
        headers: {},
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGpt, message, maxTokens, temperature]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            API Playground
          </CardTitle>
          <CardDescription>
            Test your GPT API endpoints live — configure parameters and see real responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Request Config */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">POST</Badge>
                <code className="text-sm text-muted-foreground font-mono">/chat-completion</code>
              </div>

              <div>
                <Label>Select GPT</Label>
                <Select value={selectedGpt} onValueChange={setSelectedGpt}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a GPT to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {gpts.map(gpt => (
                      <SelectItem key={gpt.id} value={gpt.id}>
                        {gpt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>API Key (for cURL preview)</Label>
                <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeKeys.map(key => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name} ({key.key_prefix}••••)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Message</Label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Type your test message..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={e => setMaxTokens(Number(e.target.value))}
                    min={1}
                    max={4096}
                  />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    value={temperature}
                    onChange={e => setTemperature(Number(e.target.value))}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="stream-toggle">Stream Response</Label>
                <Switch id="stream-toggle" checked={stream} onCheckedChange={setStream} />
              </div>

              <Button
                onClick={handleSend}
                disabled={!selectedGpt || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> Send Request</>
                )}
              </Button>
            </div>

            {/* Right — Response */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">
                    Response
                    {response && (
                      <span className={cn(
                        "ml-1.5 text-[10px]",
                        response.status < 300 ? "text-green-500" : "text-red-500"
                      )}>
                        {response.status}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="mt-3">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px] font-mono">
                      {JSON.stringify(requestPayload, null, 2)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(JSON.stringify(requestPayload, null, 2))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="response" className="mt-3">
                  {isLoading && (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isLoading && !response && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Play className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">Send a request to see the response</p>
                    </div>
                  )}
                  {!isLoading && response && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {response.status < 300 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={response.status < 300 ? "default" : "destructive"}>
                          {response.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {response.latency}ms
                        </span>
                      </div>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[340px] font-mono whitespace-pre-wrap">
                          {JSON.stringify(response.body, null, 2)}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(JSON.stringify(response.body, null, 2))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="curl" className="mt-3">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px] font-mono whitespace-pre-wrap">
                      {curlCommand}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(curlCommand)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick GPT Info */}
      {selectedGptData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected GPT: {selectedGptData.name}</CardTitle>
            <CardDescription>{selectedGptData.description || 'No description'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Model</span>
                <p className="font-medium">{selectedGptData.ai_model || 'gpt-4o-mini'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">GPT ID</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs font-mono truncate max-w-[120px]">{selectedGptData.id}</code>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(selectedGptData.id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <Badge variant={selectedGptData.is_active ? "default" : "secondary"}>
                  {selectedGptData.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Conversations</span>
                <p className="font-medium">{selectedGptData.chat_count?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

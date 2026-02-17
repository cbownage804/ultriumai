import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { Copy, Check, Code2 } from "lucide-react";

type Language = 'javascript' | 'python' | 'curl' | 'php' | 'ruby' | 'go';

const LANGUAGES: { value: Language; label: string; icon: string }[] = [
  { value: 'javascript', label: 'JavaScript / Node.js', icon: '🟨' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'curl', label: 'cURL', icon: '📟' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'go', label: 'Go', icon: '🔵' },
];

const BASE_URL = "https://nsyobmjpdpvesjwdphlh.functions.supabase.co";

function generateSnippet(language: Language, gptId: string, gptName: string): string {
  switch (language) {
    case 'javascript':
      return `// ${gptName} — JavaScript SDK
const ULTRIUM_API_KEY = 'YOUR_API_KEY';
const GPT_ID = '${gptId}';

async function chat(message) {
  const response = await fetch('${BASE_URL}/chat-completion', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${ULTRIUM_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gpt_id: GPT_ID,
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  return response.json();
}

// Usage
const result = await chat('Hello! How can you help me?');
console.log(result.choices[0].message.content);`;

    case 'python':
      return `# ${gptName} — Python SDK
import requests

ULTRIUM_API_KEY = "YOUR_API_KEY"
GPT_ID = "${gptId}"
BASE_URL = "${BASE_URL}"

def chat(message: str, max_tokens: int = 1000, temperature: float = 0.7):
    response = requests.post(
        f"{BASE_URL}/chat-completion",
        headers={
            "Authorization": f"Bearer {ULTRIUM_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "gpt_id": GPT_ID,
            "messages": [{"role": "user", "content": message}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        },
    )
    response.raise_for_status()
    return response.json()

# Usage
result = chat("Hello! How can you help me?")
print(result["choices"][0]["message"]["content"])`;

    case 'curl':
      return `# ${gptName} — cURL
curl -X POST '${BASE_URL}/chat-completion' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "gpt_id": "${gptId}",
    "messages": [
      {"role": "user", "content": "Hello! How can you help me?"}
    ],
    "max_tokens": 1000,
    "temperature": 0.7
  }'`;

    case 'php':
      return `<?php
// ${gptName} — PHP SDK
$apiKey = 'YOUR_API_KEY';
$gptId = '${gptId}';

$ch = curl_init('${BASE_URL}/chat-completion');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer {$apiKey}",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'gpt_id' => $gptId,
        'messages' => [
            ['role' => 'user', 'content' => 'Hello! How can you help me?']
        ],
        'max_tokens' => 1000,
        'temperature' => 0.7,
    ]),
]);

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

echo $data['choices'][0]['message']['content'];`;

    case 'ruby':
      return `# ${gptName} — Ruby SDK
require 'net/http'
require 'json'

API_KEY = 'YOUR_API_KEY'
GPT_ID = '${gptId}'

uri = URI('${BASE_URL}/chat-completion')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri)
request['Authorization'] = "Bearer #{API_KEY}"
request['Content-Type'] = 'application/json'
request.body = {
  gpt_id: GPT_ID,
  messages: [{ role: 'user', content: 'Hello! How can you help me?' }],
  max_tokens: 1000,
  temperature: 0.7,
}.to_json

response = http.request(request)
data = JSON.parse(response.body)
puts data['choices'][0]['message']['content']`;

    case 'go':
      return `// ${gptName} — Go SDK
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const (
	apiKey  = "YOUR_API_KEY"
	gptID   = "${gptId}"
	baseURL = "${BASE_URL}"
)

func chat(message string) (string, error) {
	payload := map[string]interface{}{
		"gpt_id":      gptID,
		"messages":    []map[string]string{{"role": "user", "content": message}},
		"max_tokens":  1000,
		"temperature": 0.7,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", baseURL+"/chat-completion", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)

	choices := result["choices"].([]interface{})
	msg := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	return msg["content"].(string), nil
}

func main() {
	reply, _ := chat("Hello! How can you help me?")
	fmt.Println(reply)
}`;

    default:
      return '';
  }
}

export const SDKSnippets = () => {
  const { gpts } = useCustomGPTs();
  const [selectedGpt, setSelectedGpt] = useState<string>("");
  const [language, setLanguage] = useState<Language>('javascript');
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const selectedGptData = gpts.find(g => g.id === selectedGpt);
  const snippet = selectedGpt
    ? generateSnippet(language, selectedGpt, selectedGptData?.name || 'My GPT')
    : '';

  const handleCopy = (lang: Language) => {
    const code = generateSnippet(lang, selectedGpt, selectedGptData?.name || 'My GPT');
    navigator.clipboard.writeText(code);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            SDK & Code Snippets
          </CardTitle>
          <CardDescription>
            Auto-generated integration code for your GPTs — copy, paste, and ship
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Select GPT</span>
              <Select value={selectedGpt} onValueChange={setSelectedGpt}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a GPT" />
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
              <span className="text-sm font-medium">Language</span>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.icon} {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedGpt && (
        <>
          {/* Main snippet */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {LANGUAGES.find(l => l.value === language)?.icon}{' '}
                    {LANGUAGES.find(l => l.value === language)?.label}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{selectedGptData?.name}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(language)}
                >
                  {copiedLang === language ? (
                    <><Check className="h-3 w-3 mr-1" /> Copied!</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" /> Copy</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono max-h-[500px]">
                <code>{snippet}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Quick copy all languages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Copy — All Languages</CardTitle>
              <CardDescription>One-click copy for each language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {LANGUAGES.map(lang => (
                  <Button
                    key={lang.value}
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => handleCopy(lang.value)}
                  >
                    <span>{lang.icon}</span>
                    <span className="flex-1 text-left">{lang.label}</span>
                    {copiedLang === lang.value ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

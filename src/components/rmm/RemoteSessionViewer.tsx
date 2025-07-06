import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Monitor, 
  MessageSquare, 
  FileSearch, 
  Key, 
  Shield, 
  Copy, 
  Download,
  Upload,
  Maximize,
  Minimize,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Mouse,
  Keyboard,
  Clipboard,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface RemoteSessionViewerProps {
  sessionId: string;
  deviceName: string;
  deviceType: string;
  onEndSession: () => void;
}

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  documents?: any[];
  passwords?: any[];
}

interface SafeDocAlert {
  id: string;
  fileName: string;
  threatLevel: 'clean' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
}

export const RemoteSessionViewer = ({ sessionId, deviceName, deviceType, onEndSession }: RemoteSessionViewerProps) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const [mouseControl, setMouseControl] = useState(true);
  const [keyboardControl, setKeyboardControl] = useState(true);
  const [clipboardSync, setClipboardSync] = useState(true);
  
  // AI Assistant State
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant for this remote session. I have access to SafeDoc for document security and SafePass for password management. How can I help you today?",
      timestamp: new Date(),
      suggestions: [
        "Scan current document for threats",
        "Find related passwords",
        "Check system security status",
        "Help with file management"
      ]
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // SafeDoc State
  const [safeDocAlerts, setSafeDocAlerts] = useState<SafeDocAlert[]>([
    {
      id: '1',
      fileName: 'document.pdf',
      threatLevel: 'clean',
      description: 'Document scanned successfully - no threats detected',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: '2',
      fileName: 'download.exe',
      threatLevel: 'high',
      description: 'Potentially malicious executable detected - quarantined',
      timestamp: new Date(Date.now() - 600000)
    }
  ]);
  
  // SafePass State
  const [availablePasswords, setAvailablePasswords] = useState([
    {
      id: '1',
      title: 'Company Portal',
      username: 'john.doe@company.com',
      domain: 'portal.company.com',
      lastUsed: '2 hours ago',
      strength: 85
    },
    {
      id: '2',
      title: 'Database Admin',
      username: 'dbadmin',
      domain: 'localhost',
      lastUsed: '1 day ago',
      strength: 92
    }
  ]);

  const [sessionStats, setSessionStats] = useState({
    duration: '00:15:32',
    dataTransferred: '2.3 MB',
    latency: '45ms',
    quality: 'Excellent'
  });

  useEffect(() => {
    // Simulate session stats updates
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
      const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      setSessionStats(prev => ({
        ...prev,
        duration: `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsAiThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: generateAIResponse(currentMessage),
        timestamp: new Date(),
        suggestions: generateSuggestions(currentMessage),
        documents: currentMessage.toLowerCase().includes('document') ? [
          { name: 'User Manual.pdf', relevance: 95, safe: true },
          { name: 'Setup Guide.docx', relevance: 87, safe: true }
        ] : undefined,
        passwords: currentMessage.toLowerCase().includes('password') || currentMessage.toLowerCase().includes('login') ? 
          availablePasswords.slice(0, 2) : undefined
      };

      setAiMessages(prev => [...prev, aiResponse]);
      setIsAiThinking(false);
    }, 2000);
  };

  const generateAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('document') || lowerMessage.includes('file')) {
      return "I can see you're working with documents. I've found some related files and scanned them for security threats. The current document appears to be safe. Would you like me to scan any other files?";
    }
    
    if (lowerMessage.includes('password') || lowerMessage.includes('login')) {
      return "I found some stored passwords that might be relevant. I can auto-fill these credentials for you. Would you like me to fill in the login form with your Company Portal credentials?";
    }
    
    if (lowerMessage.includes('security') || lowerMessage.includes('threat')) {
      return "I'm continuously monitoring this system for security threats through SafeDoc integration. Currently, I've detected one high-risk file that has been quarantined. The system appears secure overall.";
    }
    
    return "I'm here to help with document security, password management, and system administration. I can scan files, manage credentials, and assist with security tasks. What would you like me to help you with?";
  };

  const generateSuggestions = (message: string): string[] => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('document') || lowerMessage.includes('file')) {
      return [
        "Scan all files in current folder",
        "Check document for sensitive data",
        "Show file security history"
      ];
    }
    
    if (lowerMessage.includes('password') || lowerMessage.includes('login')) {
      return [
        "Auto-fill saved credentials",
        "Generate new secure password",
        "Check password strength"
      ];
    }
    
    return [
      "Scan current screen for threats",
      "Check clipboard for sensitive data",
      "Generate system security report"
    ];
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      case 'clean': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Remote Desktop Area */}
      <div className="flex-1 flex flex-col">
        {/* Remote Session Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <span className="font-semibold">{deviceName}</span>
              <Badge variant="outline">{deviceType}</Badge>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Duration: {sessionStats.duration}</span>
              <span>•</span>
              <span>Latency: {sessionStats.latency}</span>
              <span>•</span>
              <span>Quality: {sessionStats.quality}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMicEnabled(!micEnabled)}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            
            <Button variant="destructive" size="sm" onClick={onEndSession}>
              End Session
            </Button>
          </div>
        </div>

        {/* Simulated Remote Desktop Screen */}
        <div className="flex-1 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/70">
              <Monitor className="h-24 w-24 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Remote Desktop Active</h3>
              <p className="text-sm">Connected to {deviceName}</p>
              <p className="text-xs mt-2">AI Assistant available in sidebar →</p>
            </div>
          </div>
          
          {/* Session Controls Overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button
              variant={mouseControl ? "default" : "outline"}
              size="sm"
              onClick={() => setMouseControl(!mouseControl)}
            >
              <Mouse className="h-4 w-4 mr-1" />
              Mouse
            </Button>
            
            <Button
              variant={keyboardControl ? "default" : "outline"}
              size="sm"
              onClick={() => setKeyboardControl(!keyboardControl)}
            >
              <Keyboard className="h-4 w-4 mr-1" />
              Keyboard
            </Button>
            
            <Button
              variant={clipboardSync ? "default" : "outline"}
              size="sm"
              onClick={() => setClipboardSync(!clipboardSync)}
            >
              <Clipboard className="h-4 w-4 mr-1" />
              Clipboard
            </Button>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-96 border-l bg-background flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            AI Remote Assistant
          </h2>
          <p className="text-sm text-muted-foreground">
            Integrated with SafeDoc & SafePass
          </p>
        </div>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="safedoc">
              <FileSearch className="h-4 w-4 mr-1" />
              SafeDoc
            </TabsTrigger>
            <TabsTrigger value="safepass">
              <Key className="h-4 w-4 mr-1" />
              SafePass
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col p-4 pt-2">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.suggestions && (
                        <div className="mt-2 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-1 mr-1 mb-1"
                              onClick={() => setCurrentMessage(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      {message.documents && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium">Related Documents:</p>
                          {message.documents.map((doc, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <FileSearch className="h-3 w-3" />
                              <span>{doc.name}</span>
                              {doc.safe && <CheckCircle className="h-3 w-3 text-green-500" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.passwords && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium">Available Passwords:</p>
                          {message.passwords.map((pwd: any, index: number) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-1 mr-1 mb-1 flex items-center gap-1"
                            >
                              <Key className="h-3 w-3" />
                              {pwd.title}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask about security, passwords, or files..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                Send
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="safedoc" className="flex-1 p-4 pt-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Document Security</h3>
                <Button size="sm" variant="outline">
                  <Shield className="h-4 w-4 mr-1" />
                  Scan All
                </Button>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {safeDocAlerts.map((alert) => (
                    <Card key={alert.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileSearch className="h-4 w-4" />
                            <span className="font-medium text-sm">{alert.fileName}</span>
                            <Badge className={getThreatColor(alert.threatLevel)}>
                              {alert.threatLevel.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {alert.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  Export Report
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="safepass" className="flex-1 p-4 pt-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Password Manager</h3>
                <Button size="sm" variant="outline">
                  <Key className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {availablePasswords.map((password) => (
                    <Card key={password.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Key className="h-4 w-4" />
                            <span className="font-medium text-sm">{password.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {password.username} • {password.domain}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last used: {password.lastUsed}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline">
                            {password.strength}% strong
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Copy className="h-3 w-3 mr-1" />
                            Fill
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-1" />
                  Vault
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
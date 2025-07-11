import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, VolumeX, Play, RotateCcw, Mic, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VoiceControls from './VoiceControls';
import { ModeSelector, AIMode, AI_MODES } from './ModeSelector';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AIVoiceInterface = () => {
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(75);
  const [selectedMode, setSelectedMode] = useState<AIMode>(AI_MODES[0]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const { toast } = useToast();

  // Load chat history on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('ai-chat-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(parsed);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save chat history when it changes
  React.useEffect(() => {
    localStorage.setItem('ai-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Save current conversation when it changes
  React.useEffect(() => {
    if (currentChatId && conversation.length > 0) {
      setChatHistory(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: conversation, updatedAt: new Date() }
          : chat
      ));
    }
  }, [conversation, currentChatId]);

  const startNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatHistory = {
      id: newChatId,
      title: `Chat with ${selectedMode.name}`,
      messages: [],
      mode: selectedMode.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setConversation([]);
    setTextInput('');
    
    toast({
      title: "New Chat Started",
      description: `Started new ${selectedMode.name} conversation`,
    });
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setConversation(chat.messages);
      setCurrentChatId(chatId);
      
      // Switch to the mode used in this chat
      const mode = AI_MODES.find(m => m.id === chat.mode) || AI_MODES[0];
      setSelectedMode(mode);
      setShowChatHistory(false);
      
      toast({
        title: "Chat Loaded",
        description: `Loaded chat: ${chat.title}`,
      });
    }
  };

  const deleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setConversation([]);
    }
    
    toast({
      title: "Chat Deleted",
      description: "Chat has been removed from history",
      variant: "destructive",
    });
  };

  const handleVoiceTranscription = (text: string) => {
    setTextInput(text);
  };

  const processMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    // Start new chat if none exists
    if (!currentChatId) {
      startNewChat();
    }

    setIsProcessing(true);
    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      type: 'user', 
      content: message,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMessage]);
    setTextInput('');

    try {
      // Send to AI chat function with selected mode context
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: message,
          model: 'gpt-4o-mini',
          context: selectedMode.id,
          systemPrompt: selectedMode.systemPrompt,
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        content: data.response,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiMessage]);

      // Auto-speak response if volume is enabled
      if (volume > 0) {
        speakText(data.response);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice: 'CwhRBWXzGAHq8TQ4Fs17' } // Roger voice
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.volume = volume / 100;
      await audio.play();
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      toast({
        title: "Text-to-Speech Failed",
        description: "Could not generate speech. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetConversation = () => {
    setConversation([]);
    setTextInput('');
    setCurrentChatId(null);
    
    toast({
      title: "Conversation Cleared",
      description: "Started fresh conversation",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processMessage(textInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              AI Voice Interface
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showChatHistory ? 'Hide History' : 'Chat History'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showModeSelector ? 'Hide Modes' : 'Change Mode'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Current mode:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedMode.icon}
              {selectedMode.name}
            </Badge>
          </CardDescription>
        </CardHeader>
        {showChatHistory && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chat History</h3>
                <Button onClick={startNewChat} size="sm">
                  New Chat
                </Button>
              </div>
              
              {chatHistory.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                        currentChatId === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => loadChat(chat.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{chat.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {chat.messages.length} messages • {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="ml-2 h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No chat history yet. Start a new conversation!
                </p>
              )}
            </div>
          </CardContent>
        )}
        
        {showModeSelector && (
          <CardContent>
            <ModeSelector 
              selectedMode={selectedMode}
              onModeChange={(mode) => {
                setSelectedMode(mode);
                setShowModeSelector(false);
                toast({
                  title: "Mode Changed",
                  description: `Switched to ${mode.name} mode`,
                });
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Voice Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VoiceControls 
            onTranscription={handleVoiceTranscription}
            disabled={isProcessing}
          />
          
          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{volume}%</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Text Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Text Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or use voice input above..."
              className="flex-1"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={startNewChat}
              className="flex items-center gap-2"
            >
              New Chat
            </Button>
            <Button
              variant="outline"
              onClick={resetConversation}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
            <Button
              onClick={() => processMessage(textInput)}
              disabled={!textInput.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? 'Processing...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Display */}
      {conversation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Conversation
              <Badge variant="outline">{conversation.length} messages</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/20">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 break-words ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap overflow-wrap-anywhere">{message.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    {message.type === 'ai' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => speakText(message.content)}
                        className="mt-2 h-6 px-2 text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Speak
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {selectedMode.icon}
            {selectedMode.name} Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Core Features</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMode.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-sm">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Voice Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• High-quality speech-to-text</li>
                <li>• Natural voice responses (ElevenLabs)</li>
                <li>• Real-time conversations</li>
                <li>• Mode-specific responses</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, VolumeX, Play, RotateCcw, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VoiceControls from './VoiceControls';

export const AIVoiceInterface = () => {
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<Array<{id: string, type: 'user' | 'ai', content: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(75);
  const { toast } = useToast();

  const handleVoiceTranscription = (text: string) => {
    setTextInput(text);
  };

  const processMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage = { id: Date.now().toString(), type: 'user' as const, content: message };
    setConversation(prev => [...prev, userMessage]);
    setTextInput('');

    try {
      // Send to AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: message,
          model: 'gpt-4o-mini',
          context: 'general',
        }
      });

      if (error) throw error;

      const aiMessage = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai' as const, 
        content: data.response 
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
      const { data, error } = await supabase.functions.invoke('ai-voice-tts', {
        body: { text, voice: 'alloy' }
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processMessage(textInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            AI Voice Interface
          </CardTitle>
          <CardDescription>
            Interact with AI using voice commands and natural language
          </CardDescription>
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
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
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
          <CardTitle className="text-lg">Voice AI Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Speech Recognition</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• High-quality speech-to-text</li>
                <li>• Real-time transcription</li>
                <li>• Multiple audio formats</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Voice Synthesis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Natural-sounding voices</li>
                <li>• Adjustable volume control</li>
                <li>• Instant AI responses</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
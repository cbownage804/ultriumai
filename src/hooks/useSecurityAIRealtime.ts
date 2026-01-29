import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { devLog } from '@/lib/logger';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseSecurityAIRealtimeReturn {
  messages: AIMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  isTyping: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
}

export function useSecurityAIRealtime(): UseSecurityAIRealtimeReturn {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const currentMessageRef = useRef<string>('');

  const connect = useCallback(async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      devLog.log('Already connected');
      return;
    }

    setIsConnecting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Include auth token in WebSocket URL query params
      const wsUrl = `wss://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/security-ai-realtime?token=${session.access_token}`;
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        devLog.log('Security AI Realtime connected');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `🛡️ **UltriumDefender AI Online**

I'm your real-time security analyst. I can help you with:
- **Threat Analysis**: Analyze scan results and security events
- **Risk Assessment**: Evaluate security posture and vulnerabilities
- **Incident Response**: Guide you through security incidents
- **Compliance**: Check against security frameworks
- **Recommendations**: Provide actionable security advice

How can I assist with your security today?`,
          timestamp: new Date()
        }]);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          devLog.log('AI Response:', data.type);

          if (data.type === 'response.text.delta') {
            setIsTyping(true);
            currentMessageRef.current += data.delta?.text || '';
            
            // Update streaming message
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: currentMessageRef.current }
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: currentMessageRef.current,
                    timestamp: new Date(),
                    isStreaming: true
                  }
                ];
              }
            });
          }

          if (data.type === 'response.text.done' || data.type === 'response.done') {
            setIsTyping(false);
            
            // Finalize message
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, isStreaming: false }
                ];
              }
              return prev;
            });
            
            currentMessageRef.current = '';
          }

          if (data.type === 'error') {
            devLog.error('AI Error:', data.error);
            toast({
              title: 'AI Error',
              description: data.error?.message || 'An error occurred',
              variant: 'destructive'
            });
          }
        } catch (e) {
          devLog.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        devLog.error('WebSocket error:', error);
        setIsConnecting(false);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to AI service',
          variant: 'destructive'
        });
      };

      ws.onclose = () => {
        devLog.log('WebSocket closed');
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
      };

    } catch (error: any) {
      devLog.error('Connection error:', error);
      setIsConnecting(false);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Could not connect to AI service',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to the AI service first',
        variant: 'destructive'
      });
      return;
    }

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Send to WebSocket
    socketRef.current.send(JSON.stringify({
      type: 'send_text',
      text: message
    }));

    setIsTyping(true);
    currentMessageRef.current = '';
  }, [toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    isConnected,
    isConnecting,
    isTyping,
    connect,
    disconnect,
    sendMessage,
    clearMessages
  };
}

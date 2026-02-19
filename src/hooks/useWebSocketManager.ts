import { useState, useCallback } from 'react';

export interface WSChannel {
  id: string;
  name: string;
  path: string;
  eventTypes: string[];
  authRequired: boolean;
  maxClients: number;
  isActive: boolean;
}

export interface WSMessage {
  id: string;
  channelId: string;
  direction: 'inbound' | 'outbound';
  event: string;
  payload: string;
  timestamp: Date;
}

export function useWebSocketManager() {
  const [channels, setChannels] = useState<WSChannel[]>([]);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const createChannel = useCallback((name: string, path: string) => {
    const ch: WSChannel = {
      id: crypto.randomUUID(), name, path: path || `/${name.toLowerCase().replace(/\s+/g, '-')}`,
      eventTypes: ['message', 'join', 'leave'], authRequired: false, maxClients: 100, isActive: true,
    };
    setChannels(prev => [...prev, ch]);
    setActiveChannelId(ch.id);
  }, []);

  const updateChannel = useCallback((id: string, update: Partial<WSChannel>) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...update } : c));
  }, []);

  const removeChannel = useCallback((id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
    setMessages(prev => prev.filter(m => m.channelId !== id));
  }, []);

  const addEvent = useCallback((channelId: string, event: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, eventTypes: [...new Set([...c.eventTypes, event])] } : c));
  }, []);

  const removeEvent = useCallback((channelId: string, event: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, eventTypes: c.eventTypes.filter(e => e !== event) } : c));
  }, []);

  const simulateMessage = useCallback((channelId: string, event: string, payload: string) => {
    const msg: WSMessage = { id: crypto.randomUUID(), channelId, direction: 'inbound', event, payload, timestamp: new Date() };
    setMessages(prev => [msg, ...prev].slice(0, 200));
    // Simulate echo response
    setTimeout(() => {
      const echo: WSMessage = { id: crypto.randomUUID(), channelId, direction: 'outbound', event: `${event}:ack`, payload: JSON.stringify({ received: true, originalEvent: event }), timestamp: new Date() };
      setMessages(prev => [echo, ...prev].slice(0, 200));
    }, 300);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const getActiveChannel = useCallback(() => channels.find(c => c.id === activeChannelId) || null, [channels, activeChannelId]);

  const generateServerCode = useCallback((channelId: string): string => {
    const ch = channels.find(c => c.id === channelId);
    if (!ch) return '';
    return `// WebSocket server for "${ch.name}" channel
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const clients = new Map<string, WebSocket>();

serve((req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  const clientId = crypto.randomUUID();
  
  socket.onopen = () => {
    clients.set(clientId, socket);
    broadcast({ event: "join", clientId, clients: clients.size });
  };
  
  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
${ch.eventTypes.map(ev => `      if (data.event === "${ev}") {\n        // Handle ${ev}\n        broadcast({ event: "${ev}:ack", payload: data.payload });\n      }`).join('\n')}
    } catch (err) {
      socket.send(JSON.stringify({ error: "Invalid message format" }));
    }
  };
  
  socket.onclose = () => {
    clients.delete(clientId);
    broadcast({ event: "leave", clientId, clients: clients.size });
  };
  
  return response;
});

function broadcast(data: unknown) {
  const msg = JSON.stringify(data);
  for (const [, ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}`;
  }, [channels]);

  const generateClientCode = useCallback((channelId: string): string => {
    const ch = channels.find(c => c.id === channelId);
    if (!ch) return '';
    return `// WebSocket client hook for "${ch.name}"
import { useEffect, useRef, useState, useCallback } from 'react';

export function use${ch.name.replace(/\s+/g, '')}Socket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (e) => {
      try { setLastMessage(JSON.parse(e.data)); } catch {}
    };
    return () => ws.close();
  }, [url]);

  const send = useCallback((event: string, payload: unknown) => {
    wsRef.current?.send(JSON.stringify({ event, payload }));
  }, []);

  return { isConnected, lastMessage, send };
}`;
  }, [channels]);

  return {
    channels, messages, activeChannelId, setActiveChannelId, getActiveChannel,
    createChannel, updateChannel, removeChannel, addEvent, removeEvent,
    simulateMessage, clearMessages, generateServerCode, generateClientCode,
  };
}

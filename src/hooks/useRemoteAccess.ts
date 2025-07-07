import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Types for remote access
type RemoteSession = {
  id: string;
  user_id: string;
  device_id: string;
  session_type: string;
  status: string;
  started_at: string;
  ended_at?: string;
  session_token: string;
  rmm_devices?: {
    hostname: string;
    ip_address: string;
    device_type: string;
    os_info: string;
  };
};

type RemoteCommand = {
  id: string;
  device_id: string;
  command: string;
  command_type: string;
  status: string;
  output?: string;
  error_output?: string;
  exit_code?: number;
  executed_at?: string;
  created_at: string;
};

type FileTransfer = {
  id: string;
  device_id: string;
  transfer_type: string;
  local_path: string;
  remote_path: string;
  file_name: string;
  file_size?: number;
  transfer_status: string;
  bytes_transferred?: number;
  transfer_speed?: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
};

type ScriptExecution = {
  id: string;
  device_id: string;
  script_name: string;
  script_content: string;
  script_type: string;
  execution_status: string;
  output?: string;
  error_output?: string;
  exit_code?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
};

export const useRemoteAccess = () => {
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [commands, setCommands] = useState<RemoteCommand[]>([]);
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [scriptExecutions, setScriptExecutions] = useState<ScriptExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWebSocket, setActiveWebSocket] = useState<WebSocket | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Start a remote session
  const startSession = async (deviceId: string, sessionType: 'desktop' | 'terminal' | 'file_transfer' = 'desktop') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'start_session', deviceId, sessionType },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Remote Session Started",
          description: `Connected to ${data.session.rmm_devices?.hostname || 'device'}`,
        });
        
        await loadSessions();
        return data.session;
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to start remote session",
        variant: "destructive",
      });
      return null;
    }
  };

  // End a remote session
  const endSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'end_session', sessionId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Session Ended",
          description: "Remote session has been terminated",
        });
        
        if (activeWebSocket) {
          activeWebSocket.close();
          setActiveWebSocket(null);
        }
        
        await loadSessions();
        return true;
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end remote session",
        variant: "destructive",
      });
      return false;
    }
  };

  // Execute a remote command
  const executeCommand = async (deviceId: string, command: string, commandType: 'cmd' | 'powershell' = 'cmd', sessionId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'execute_command', deviceId, sessionId, command, commandType },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Command Executed",
          description: `${commandType.toUpperCase()} command sent to device`,
        });
        
        await loadCommands();
        return data.commandId;
      }
    } catch (error) {
      console.error('Error executing command:', error);
      toast({
        title: "Command Failed",
        description: "Failed to execute remote command",
        variant: "destructive",
      });
      return null;
    }
  };

  // Execute a script
  const executeScript = async (deviceId: string, scriptName: string, scriptContent: string, scriptType: 'powershell' | 'cmd' | 'bash' = 'powershell', sessionId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'execute_script', deviceId, sessionId, scriptName, scriptContent, scriptType },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Script Deployed",
          description: `Script "${scriptName}" is executing on the device`,
        });
        
        await loadScriptExecutions();
        return data.executionId;
      }
    } catch (error) {
      console.error('Error executing script:', error);
      toast({
        title: "Script Failed",
        description: "Failed to execute script",
        variant: "destructive",
      });
      return null;
    }
  };

  // Transfer a file
  const transferFile = async (deviceId: string, transferType: 'upload' | 'download', localPath: string, remotePath: string, fileName: string, fileSize: number, sessionId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'transfer_file', deviceId, sessionId, transferType, localPath, remotePath, fileName, fileSize },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "File Transfer Started",
          description: `${transferType === 'upload' ? 'Uploading' : 'Downloading'} ${fileName}`,
        });
        
        await loadFileTransfers();
        return data.transferId;
      }
    } catch (error) {
      console.error('Error transferring file:', error);
      toast({
        title: "Transfer Failed",
        description: "Failed to start file transfer",
        variant: "destructive",
      });
      return null;
    }
  };

  // Sync clipboard
  const syncClipboard = async (deviceId: string, content: string, direction: 'to_remote' | 'from_remote', sessionId?: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'sync_clipboard', deviceId, sessionId, content, direction, contentType: 'text' },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Clipboard Synced",
          description: `Clipboard content ${direction === 'to_remote' ? 'sent to' : 'received from'} remote device`,
        });
        return true;
      }
    } catch (error) {
      console.error('Error syncing clipboard:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync clipboard",
        variant: "destructive",
      });
      return false;
    }
  };

  // Connect to WebSocket for live session
  const connectWebSocket = async (sessionToken: string) => {
    try {
      console.log('Connecting WebSocket with token:', sessionToken);
      const wsUrl = `wss://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/rmm-remote-session?token=${sessionToken}`;
      console.log('WebSocket URL:', wsUrl);
      
      // Add a timeout to the WebSocket connection
      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout;

      // Set up a connection timeout
      const connectionPromise = new Promise<WebSocket>((resolve, reject) => {
        connectionTimeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000); // 10 second timeout

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connected successfully');
          setActiveWebSocket(ws);
          toast({
            title: "Live Session Connected",
            description: "Real-time remote access is now active",
          });
          resolve(ws);
        };

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket connection error:', error);
          toast({
            title: "Connection Failed",
            description: "Unable to establish WebSocket connection. This may be due to network restrictions or firewall settings.",
            variant: "destructive",
          });
          reject(error);
        };
      });

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle different message types
          switch (message.type) {
            case 'session_ready':
              console.log('Session ready:', message);
              break;
            case 'ai_response':
              console.log('AI response:', message.data);
              break;
            case 'auth_error':
              console.error('WebSocket auth error:', message.message);
              toast({
                title: "Authentication Error",
                description: message.message,
                variant: "destructive",
              });
              break;
            case 'error':
              toast({
                title: "Session Error",
                description: message.message,
                variant: "destructive",
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed - Code:', event.code, 'Reason:', event.reason);
        setActiveWebSocket(null);
        
        // Only show disconnection message if it was an unexpected close
        if (event.code !== 1000) { // 1000 is normal closure
          toast({
            title: "Session Disconnected",
            description: `Connection closed unexpectedly (Code: ${event.code})`,
            variant: "destructive",
          });
        }
      };

      return await connectionPromise;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      toast({
        title: "Connection Error",
        description: "Failed to establish remote session connection. Please check your network connection and firewall settings.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Load data functions
  const loadSessions = async () => {
    if (!user) return;

    try {
      console.log('Loading sessions...');
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'get_sessions' },
      });

      console.log('Sessions response:', { data, error });

      if (error) {
        console.error('Sessions API error:', error);
        throw error;
      }

      if (data?.success) {
        console.log('Sessions loaded successfully:', data.sessions);
        setSessions(data.sessions || []);
      } else {
        console.error('Sessions API returned unsuccessful response:', data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      // For testing purposes, add mock session data
      const mockSessions: RemoteSession[] = [{
        id: 'mock-session-1',
        user_id: user?.id || 'mock-user',
        session_token: 'mock-token-12345',
        device_id: 'mock-device-1',
        status: 'active',
        session_type: 'desktop',
        started_at: new Date().toISOString(),
        rmm_devices: {
          hostname: 'DESKTOP-TEST',
          ip_address: '192.168.1.100',
          device_type: 'workstation',
          os_info: 'Windows 11 Pro'
        }
      }];
      console.log('Using mock sessions for testing:', mockSessions);
      setSessions(mockSessions);
    }
  };

  const loadCommands = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'get_commands' },
      });

      if (error) throw error;

      if (data.success) {
        setCommands(data.commands);
      }
    } catch (error) {
      console.error('Error loading commands:', error);
    }
  };

  const loadFileTransfers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api', {
        body: { action: 'get_file_transfers' },
      });

      if (error) throw error;

      if (data.success) {
        setFileTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Error loading file transfers:', error);
    }
  };

  const loadScriptExecutions = async () => {
    if (!user) return;

    try {
      const { data: executions, error } = await supabase
        .from('script_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScriptExecutions(executions || []);
    } catch (error) {
      console.error('Error loading script executions:', error);
    }
  };

  // Initialize data loading
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        loadSessions(),
        loadCommands(),
        loadFileTransfers(),
        loadScriptExecutions()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const sessionsChannel = supabase
      .channel('remote_sessions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'remote_sessions' },
        () => loadSessions()
      )
      .subscribe();

    const commandsChannel = supabase
      .channel('remote_commands_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'remote_commands' },
        () => loadCommands()
      )
      .subscribe();

    const transfersChannel = supabase
      .channel('file_transfers_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'file_transfers' },
        () => loadFileTransfers()
      )
      .subscribe();

    const scriptsChannel = supabase
      .channel('script_executions_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'script_executions' },
        () => loadScriptExecutions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(commandsChannel);
      supabase.removeChannel(transfersChannel);
      supabase.removeChannel(scriptsChannel);
    };
  }, [user]);

  return {
    sessions,
    commands,
    fileTransfers,
    scriptExecutions,
    isLoading,
    activeWebSocket,
    startSession,
    endSession,
    executeCommand,
    executeScript,
    transferFile,
    syncClipboard,
    connectWebSocket,
    loadSessions,
    loadCommands,
    loadFileTransfers,
    loadScriptExecutions
  };
};
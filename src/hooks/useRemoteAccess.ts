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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=start_session', {
        body: { deviceId, sessionType },
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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=end_session', {
        body: { sessionId },
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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=execute_command', {
        body: { deviceId, sessionId, command, commandType },
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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=execute_script', {
        body: { deviceId, sessionId, scriptName, scriptContent, scriptType },
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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=transfer_file', {
        body: { deviceId, sessionId, transferType, localPath, remotePath, fileName, fileSize },
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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=sync_clipboard', {
        body: { deviceId, sessionId, content, direction, contentType: 'text' },
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
      const wsUrl = `wss://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/rmm-remote-session?token=${sessionToken}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setActiveWebSocket(ws);
        toast({
          title: "Live Session Connected",
          description: "Real-time remote access is now active",
        });
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        
        // Handle different message types
        switch (message.type) {
          case 'session_ready':
            console.log('Session ready:', message);
            break;
          case 'ai_response':
            console.log('AI response:', message.data);
            break;
          case 'error':
            toast({
              title: "Session Error",
              description: message.message,
              variant: "destructive",
            });
            break;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setActiveWebSocket(null);
        toast({
          title: "Session Disconnected",
          description: "Live remote session has ended",
        });
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "WebSocket connection failed",
          variant: "destructive",
        });
      };

      return ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      return null;
    }
  };

  // Load data functions
  const loadSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=get_sessions', {
        body: {},
      });

      if (error) throw error;

      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadCommands = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=get_commands', {
        body: {},
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
      const { data, error } = await supabase.functions.invoke('rmm-remote-api?action=get_file_transfers', {
        body: {},
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get the authorization header and validate the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Create a new supabase client with the user's token
    const supabaseWithAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user } } = await supabaseWithAuth.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    console.log(`Remote API action: ${action}`)

    switch (action) {
      case 'start_session':
        return await startRemoteSession(req, supabaseWithAuth, user.id)
      case 'end_session':
        return await endRemoteSession(req, supabaseWithAuth, user.id)
      case 'execute_command':
        return await executeRemoteCommand(req, supabaseWithAuth, user.id)
      case 'execute_script':
        return await executeScript(req, supabaseWithAuth, user.id)
      case 'transfer_file':
        return await handleFileTransfer(req, supabaseWithAuth, user.id)
      case 'sync_clipboard':
        return await syncClipboard(req, supabaseWithAuth, user.id)
      case 'get_sessions':
        return await getActiveSessions(req, supabaseWithAuth, user.id)
      case 'get_commands':
        return await getCommandHistory(req, supabaseWithAuth, user.id)
      case 'get_file_transfers':
        return await getFileTransfers(req, supabaseWithAuth, user.id)
      default:
        return new Response('Invalid action', { status: 400, headers: corsHeaders })
    }
  } catch (error) {
    console.error('Remote API error:', error)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})

async function startRemoteSession(req: Request, supabase: any, userId: string) {
  const { deviceId, sessionType = 'desktop' } = await req.json()

  // Generate session token
  const sessionToken = crypto.randomUUID()
  
  // Create session record
  const { data: session, error } = await supabase
    .from('remote_sessions')
    .insert({
      user_id: userId,
      device_id: deviceId,
      session_type: sessionType,
      session_token: sessionToken,
      status: 'connecting',
      client_ip: req.headers.get('x-forwarded-for') || 'unknown'
    })
    .select(`
      *,
      rmm_devices (
        hostname,
        ip_address,
        device_type,
        os_info
      )
    `)
    .single()

  if (error) {
    console.error('Failed to create session:', error)
    return new Response('Failed to create session', { status: 500, headers: corsHeaders })
  }

  // Simulate connection establishment
  setTimeout(async () => {
    await supabase
      .from('remote_sessions')
      .update({ status: 'active' })
      .eq('id', session.id)
  }, 2000)

  return new Response(JSON.stringify({
    success: true,
    session: session,
    wsUrl: `wss://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/rmm-remote-session?token=${sessionToken}`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function endRemoteSession(req: Request, supabase: any, userId: string) {
  const { sessionId } = await req.json()

  const { error } = await supabase
    .from('remote_sessions')
    .update({ 
      status: 'ended',
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to end session:', error)
    return new Response('Failed to end session', { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function executeRemoteCommand(req: Request, supabase: any, userId: string) {
  const { deviceId, sessionId, command, commandType = 'cmd' } = await req.json()

  // Insert command record
  const { data: cmdRecord, error } = await supabase
    .from('remote_commands')
    .insert({
      user_id: userId,
      device_id: deviceId,
      remote_session_id: sessionId,
      command: command,
      command_type: commandType,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create command:', error)
    return new Response('Failed to create command', { status: 500, headers: corsHeaders })
  }

  // Simulate command execution
  setTimeout(async () => {
    const mockOutput = commandType === 'powershell' 
      ? `PS C:\\> ${command}\n${generateMockPowerShellOutput(command)}`
      : `C:\\> ${command}\n${generateMockCmdOutput(command)}`

    await supabase
      .from('remote_commands')
      .update({
        status: 'completed',
        output: mockOutput,
        exit_code: 0,
        executed_at: new Date().toISOString()
      })
      .eq('id', cmdRecord.id)
  }, 1000 + Math.random() * 2000)

  return new Response(JSON.stringify({
    success: true,
    commandId: cmdRecord.id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function executeScript(req: Request, supabase: any, userId: string) {
  const { deviceId, sessionId, scriptName, scriptContent, scriptType = 'powershell' } = await req.json()

  const { data: scriptExecution, error } = await supabase
    .from('script_executions')
    .insert({
      user_id: userId,
      device_id: deviceId,
      remote_session_id: sessionId,
      script_name: scriptName,
      script_content: scriptContent,
      script_type: scriptType,
      execution_status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create script execution:', error)
    return new Response('Failed to create script execution', { status: 500, headers: corsHeaders })
  }

  // Simulate script execution
  setTimeout(async () => {
    await supabase
      .from('script_executions')
      .update({
        execution_status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', scriptExecution.id)

    // Complete after additional delay
    setTimeout(async () => {
      const mockOutput = `Script '${scriptName}' executed successfully\n${generateScriptOutput(scriptContent, scriptType)}`
      
      await supabase
        .from('script_executions')
        .update({
          execution_status: 'completed',
          output: mockOutput,
          exit_code: 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', scriptExecution.id)
    }, 3000)
  }, 1000)

  return new Response(JSON.stringify({
    success: true,
    executionId: scriptExecution.id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleFileTransfer(req: Request, supabase: any, userId: string) {
  const { deviceId, sessionId, transferType, localPath, remotePath, fileName, fileSize } = await req.json()

  const { data: transfer, error } = await supabase
    .from('file_transfers')
    .insert({
      user_id: userId,
      device_id: deviceId,
      remote_session_id: sessionId,
      transfer_type: transferType,
      local_path: localPath,
      remote_path: remotePath,
      file_name: fileName,
      file_size: fileSize,
      transfer_status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create file transfer:', error)
    return new Response('Failed to create file transfer', { status: 500, headers: corsHeaders })
  }

  // Simulate file transfer with progress updates
  setTimeout(async () => {
    await supabase
      .from('file_transfers')
      .update({
        transfer_status: 'transferring',
        started_at: new Date().toISOString(),
        transfer_speed: Math.floor(1024 * 1024 * (0.5 + Math.random())) // 0.5-1.5 MB/s
      })
      .eq('id', transfer.id)

    // Complete transfer
    setTimeout(async () => {
      await supabase
        .from('file_transfers')
        .update({
          transfer_status: 'completed',
          bytes_transferred: fileSize,
          completed_at: new Date().toISOString()
        })
        .eq('id', transfer.id)
    }, Math.min(5000, (fileSize / (1024 * 1024)) * 1000)) // Simulate based on file size
  }, 500)

  return new Response(JSON.stringify({
    success: true,
    transferId: transfer.id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function syncClipboard(req: Request, supabase: any, userId: string) {
  const { deviceId, sessionId, content, contentType = 'text', direction } = await req.json()

  const { error } = await supabase
    .from('clipboard_syncs')
    .insert({
      user_id: userId,
      device_id: deviceId,
      remote_session_id: sessionId,
      content: content,
      content_type: contentType,
      direction: direction
    })

  if (error) {
    console.error('Failed to sync clipboard:', error)
    return new Response('Failed to sync clipboard', { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getActiveSessions(req: Request, supabase: any, userId: string) {
  const { data: sessions, error } = await supabase
    .from('remote_sessions')
    .select(`
      *,
      rmm_devices (
        hostname,
        ip_address,
        device_type,
        os_info
      )
    `)
    .eq('user_id', userId)
    .in('status', ['connecting', 'active'])
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Failed to get sessions:', error)
    return new Response('Failed to get sessions', { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({
    success: true,
    sessions: sessions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getCommandHistory(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const deviceId = url.searchParams.get('deviceId')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabase
    .from('remote_commands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }

  const { data: commands, error } = await query

  if (error) {
    console.error('Failed to get command history:', error)
    return new Response('Failed to get command history', { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({
    success: true,
    commands: commands
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getFileTransfers(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const deviceId = url.searchParams.get('deviceId')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabase
    .from('file_transfers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }

  const { data: transfers, error } = await query

  if (error) {
    console.error('Failed to get file transfers:', error)
    return new Response('Failed to get file transfers', { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({
    success: true,
    transfers: transfers
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Mock output generators
function generateMockPowerShellOutput(command: string): string {
  const cmd = command.toLowerCase()
  if (cmd.includes('get-process')) {
    return `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
    463      19     2468       5060       0.03   1234   1 chrome
    234      12     1876       3456       0.01   5678   1 notepad
    123       8      956       2134       0.00   9012   1 explorer`
  } else if (cmd.includes('get-service')) {
    return `Status   Name               DisplayName
------   ----               -----------
Running  Dhcp               DHCP Client
Stopped  Fax                Fax
Running  LanmanServer       Server
Running  Spooler            Print Spooler`
  } else if (cmd.includes('get-childitem') || cmd.includes('dir') || cmd.includes('ls')) {
    return `Directory: C:\\Users\\Administrator\\Desktop

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        12/1/2023   3:45 PM                Documents
d-----        12/1/2023   2:30 PM                Downloads
-a----        12/1/2023   4:15 PM           1024 notes.txt
-a----        11/30/2023  9:20 AM         524288 report.pdf`
  }
  return `Command completed successfully.\nOperation finished at ${new Date().toLocaleString()}`
}

function generateMockCmdOutput(command: string): string {
  const cmd = command.toLowerCase()
  if (cmd.includes('dir')) {
    return ` Volume in drive C has no label.
 Volume Serial Number is 1234-5678

 Directory of C:\\Users\\Administrator

12/01/2023  03:45 PM    <DIR>          Documents
12/01/2023  02:30 PM    <DIR>          Downloads
12/01/2023  04:15 PM             1,024 notes.txt
11/30/2023  09:20 AM           524,288 report.pdf
               2 File(s)        525,312 bytes
               2 Dir(s)  15,728,640,000 bytes free`
  } else if (cmd.includes('tasklist')) {
    return `Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
chrome.exe                    1234 Console                    1     50,432 K
notepad.exe                   5678 Console                    1      5,124 K
explorer.exe                  9012 Console                    1     25,648 K`
  } else if (cmd.includes('ipconfig')) {
    return `Windows IP Configuration

Ethernet adapter Local Area Connection:

   Connection-specific DNS Suffix  . : domain.local
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1`
  }
  return `Command completed successfully.`
}

function generateScriptOutput(scriptContent: string, scriptType: string): string {
  const lines = scriptContent.split('\n').length
  return `Script executed successfully.
Total lines processed: ${lines}
Execution time: ${Math.floor(Math.random() * 5) + 1} seconds
No errors encountered.

${scriptType === 'powershell' ? 'PowerShell' : 'Command'} script completed at ${new Date().toLocaleString()}`
}
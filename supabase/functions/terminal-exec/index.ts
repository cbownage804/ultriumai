import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED_COMMANDS: Record<string, string> = {
  'echo': 'echo',
  'cat': 'cat',
  'ls': 'ls',
  'pwd': 'pwd',
  'date': 'date',
  'whoami': 'whoami',
  'node': 'node',
  'npx': 'npx',
  'deno': 'deno',
  'grep': 'grep',
  'head': 'head',
  'tail': 'tail',
  'wc': 'wc',
  'sort': 'sort',
  'uniq': 'uniq',
  'find': 'find',
  'which': 'which',
};

const MAX_EXEC_MS = 30_000;
const MAX_OUTPUT_BYTES = 100 * 1024; // 100KB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();

    if (!command || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Command string is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmed = command.trim();
    
    // Block dangerous patterns
    const dangerous = /[;&|`$()]|\bsudo\b|\brm\s+-rf\b|\bchmod\b|\bchown\b|\bkill\b|\bshutdown\b|\breboot\b/i;
    if (dangerous.test(trimmed)) {
      return new Response(
        JSON.stringify({ success: false, error: `Blocked: command contains restricted patterns` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse command and args
    const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    if (parts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Empty command' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle npm/npx specially
    let baseCmd = parts[0].toLowerCase();
    let cmdArgs = parts.slice(1);

    // npm run X -> use npm
    if (baseCmd === 'npm') {
      baseCmd = 'npm';
    }

    if (!ALLOWED_COMMANDS[baseCmd]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Command "${baseCmd}" is not in the allowed list. Allowed: ${Object.keys(ALLOWED_COMMANDS).join(', ')}` 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[terminal-exec] Running: ${baseCmd} ${cmdArgs.join(' ')}`);

    // Special handling for node --eval
    if (baseCmd === 'node' && cmdArgs[0] === '--eval') {
      // Already fine
    }

    const cmd = new Deno.Command(baseCmd, {
      args: cmdArgs.map(a => a.replace(/^["']|["']$/g, '')), // Strip quotes
      stdout: 'piped',
      stderr: 'piped',
    });

    // Race against timeout
    const processPromise = cmd.output();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Command timed out after ${MAX_EXEC_MS / 1000}s`)), MAX_EXEC_MS)
    );

    const output = await Promise.race([processPromise, timeoutPromise]);

    const decoder = new TextDecoder();
    let stdout = decoder.decode(output.stdout);
    let stderr = decoder.decode(output.stderr);

    // Truncate if too large
    if (stdout.length > MAX_OUTPUT_BYTES) {
      stdout = stdout.slice(0, MAX_OUTPUT_BYTES) + '\n... (output truncated at 100KB)';
    }
    if (stderr.length > MAX_OUTPUT_BYTES) {
      stderr = stderr.slice(0, MAX_OUTPUT_BYTES) + '\n... (output truncated at 100KB)';
    }

    return new Response(
      JSON.stringify({
        success: output.code === 0,
        exitCode: output.code,
        stdout,
        stderr,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[terminal-exec] Error:', error);
    const msg = error instanceof Error ? error.message : 'Command execution failed';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

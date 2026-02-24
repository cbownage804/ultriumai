import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

// ── Tool Schema Definitions ──
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: string;
  success: boolean;
}

// Tool definitions exposed to the AI model
export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a specific file in the project',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files in the project or a specific directory',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Directory path to list (empty for root)' },
      },
      required: [],
    },
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file in the project',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Complete file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_files',
    description: 'Search for a pattern across all project files',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search string or regex pattern' },
        filePattern: { type: 'string', description: 'File extension filter e.g. ".tsx"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for documentation, examples, or solutions',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
];

// Build the tool schema block for the system prompt
export function buildToolSchemaPrompt(): string {
  const toolsJson = AGENT_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));

  return `\n\n[AVAILABLE TOOLS]
You can call tools by returning JSON tool_calls in your response:

\`\`\`json
{"tool_calls": [{"id": "call_1", "name": "tool_name", "arguments": {...}}]}
\`\`\`

Tools:
${JSON.stringify(toolsJson, null, 2)}

After tool results are provided, continue with your response. You may call multiple tools in a single response.
[/AVAILABLE TOOLS]`;
}

/**
 * Parse tool_call JSON blocks from AI response text.
 * Looks for {"tool_calls": [...]} patterns.
 */
export function parseToolCalls(responseText: string): ToolCall[] {
  const calls: ToolCall[] = [];

  // Try JSON code blocks first
  const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"tool_calls"[\s\S]*?\})\s*```/g;
  let match;
  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed.tool_calls)) {
        calls.push(...parsed.tool_calls);
      }
    } catch { /* skip malformed */ }
  }

  // Also try inline JSON (no code fences)
  if (calls.length === 0) {
    const inlineRegex = /\{"tool_calls"\s*:\s*\[[\s\S]*?\]\s*\}/g;
    while ((match = inlineRegex.exec(responseText)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.tool_calls)) {
          calls.push(...parsed.tool_calls);
        }
      } catch { /* skip */ }
    }
  }

  return calls;
}

/**
 * Hook that provides tool execution capabilities for the agent.
 */
export function useAgentTools() {
  const webSearchCacheRef = useRef<Map<string, string>>(new Map());

  /**
   * Execute a single tool call against the current project files.
   */
  const executeTool = useCallback(async (
    call: ToolCall,
    currentFiles: ProjectFile[],
  ): Promise<ToolResult> => {
    const { id, name, arguments: args } = call;

    try {
      switch (name) {
        case 'read_file': {
          const file = currentFiles.find(f => f.path === args.path);
          if (!file) {
            return { toolCallId: id, name, result: `Error: File not found: ${args.path}`, success: false };
          }
          // Truncate very large files
          const content = file.content.length > 15000
            ? file.content.slice(0, 15000) + '\n... (truncated)'
            : file.content;
          return { toolCallId: id, name, result: content, success: true };
        }

        case 'list_files': {
          const dir = args.directory || '';
          const paths = currentFiles
            .filter(f => !dir || f.path.startsWith(dir))
            .map(f => f.path)
            .sort();
          return { toolCallId: id, name, result: paths.join('\n'), success: true };
        }

        case 'write_file': {
          // Return the write instruction — the agent loop will apply it
          return {
            toolCallId: id,
            name,
            result: `File write queued: ${args.path} (${args.content?.length || 0} chars)`,
            success: true,
          };
        }

        case 'delete_file': {
          return {
            toolCallId: id,
            name,
            result: `File deletion queued: ${args.path}`,
            success: true,
          };
        }

        case 'search_files': {
          const query = args.query as string;
          const pattern = args.filePattern as string | undefined;
          const results: string[] = [];

          for (const f of currentFiles) {
            if (pattern && !f.path.endsWith(pattern)) continue;
            const lines = f.content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(query) || new RegExp(query, 'i').test(lines[i])) {
                results.push(`${f.path}:${i + 1}: ${lines[i].trim()}`);
                if (results.length >= 30) break;
              }
            }
            if (results.length >= 30) break;
          }

          return {
            toolCallId: id,
            name,
            result: results.length > 0 ? results.join('\n') : `No matches for "${query}"`,
            success: true,
          };
        }

        case 'web_search': {
          const query = args.query as string;
          const cached = webSearchCacheRef.current.get(query);
          if (cached) {
            return { toolCallId: id, name, result: cached, success: true };
          }
          // Web search is handled by the agent's existing research hook
          // Return a placeholder — the agent loop will intercept and use useAgentWebResearch
          return {
            toolCallId: id,
            name,
            result: `[WEB_SEARCH_PENDING: ${query}]`,
            success: true,
          };
        }

        default:
          return { toolCallId: id, name, result: `Unknown tool: ${name}`, success: false };
      }
    } catch (err) {
      return {
        toolCallId: id,
        name,
        result: `Tool error: ${(err as Error).message}`,
        success: false,
      };
    }
  }, []);

  /**
   * Execute multiple tool calls in parallel.
   */
  const executeToolBatch = useCallback(async (
    calls: ToolCall[],
    currentFiles: ProjectFile[],
  ): Promise<ToolResult[]> => {
    return Promise.all(calls.map(call => executeTool(call, currentFiles)));
  }, [executeTool]);

  /**
   * Format tool results as a context message for the AI.
   */
  const formatToolResults = useCallback((results: ToolResult[]): string => {
    return results.map(r =>
      `[TOOL_RESULT: ${r.name} (${r.toolCallId})]\n${r.result}\n[/TOOL_RESULT]`
    ).join('\n\n');
  }, []);

  return {
    executeTool,
    executeToolBatch,
    formatToolResults,
    parseToolCalls,
    buildToolSchemaPrompt,
    AGENT_TOOLS,
  };
}

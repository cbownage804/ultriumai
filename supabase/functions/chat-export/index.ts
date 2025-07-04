import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  conversation_ids: string[];
  format: 'txt' | 'json' | 'csv' | 'pdf';
  include_metadata?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { conversation_ids, format, include_metadata }: ExportRequest = await req.json();

    if (!conversation_ids || conversation_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No conversation IDs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch conversations and messages
    const { data: conversations, error: conversationsError } = await supabaseClient
      .from('conversations')
      .select('*')
      .in('id', conversation_ids)
      .eq('user_id', user.id);

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch conversations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch messages for all conversations
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('*')
      .in('conversation_id', conversation_ids)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group messages by conversation
    const conversationData = conversations.map(conv => ({
      ...conv,
      messages: messages.filter(msg => msg.conversation_id === conv.id)
    }));

    let content: string;
    let contentType: string;

    switch (format) {
      case 'txt':
        content = generateTextExport(conversationData, include_metadata);
        contentType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify(conversationData, null, 2);
        contentType = 'application/json';
        break;
      case 'csv':
        content = generateCSVExport(conversationData, include_metadata);
        contentType = 'text/csv';
        break;
      case 'pdf':
        // For PDF, we'd need additional libraries - for now, return rich text
        content = generateRichTextExport(conversationData, include_metadata);
        contentType = 'text/html';
        break;
      default:
        content = generateTextExport(conversationData, include_metadata);
        contentType = 'text/plain';
    }

    return new Response(JSON.stringify({ content, format }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateTextExport(conversationData: any[], includeMetadata = false): string {
  let output = '';
  
  conversationData.forEach((conversation, index) => {
    output += `\n=== CONVERSATION ${index + 1}: ${conversation.title} ===\n\n`;
    
    if (includeMetadata) {
      output += `Created: ${new Date(conversation.created_at).toLocaleString()}\n`;
      output += `Updated: ${new Date(conversation.updated_at).toLocaleString()}\n`;
      output += `Messages: ${conversation.messages.length}\n\n`;
    }
    
    conversation.messages.forEach((message: any) => {
      const timestamp = includeMetadata ? `[${new Date(message.created_at).toLocaleString()}] ` : '';
      output += `${timestamp}${message.role.toUpperCase()}: ${message.content}\n\n`;
    });
    
    output += '\n' + '='.repeat(50) + '\n';
  });
  
  return output;
}

function generateCSVExport(conversationData: any[], includeMetadata = false): string {
  const headers = ['Conversation Title', 'Message Role', 'Message Content'];
  if (includeMetadata) {
    headers.push('Conversation Created', 'Message Timestamp');
  }
  
  let csv = headers.join(',') + '\n';
  
  conversationData.forEach(conversation => {
    conversation.messages.forEach((message: any) => {
      const row = [
        `"${conversation.title.replace(/"/g, '""')}"`,
        `"${message.role}"`,
        `"${message.content.replace(/"/g, '""')}"`
      ];
      
      if (includeMetadata) {
        row.push(
          `"${new Date(conversation.created_at).toISOString()}"`,
          `"${new Date(message.created_at).toISOString()}"`
        );
      }
      
      csv += row.join(',') + '\n';
    });
  });
  
  return csv;
}

function generateRichTextExport(conversationData: any[], includeMetadata = false): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Conversation Export</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .conversation { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .conversation-title { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        .message { margin: 15px 0; padding: 10px; border-radius: 5px; }
        .user { background-color: #e3f2fd; }
        .assistant { background-color: #f5f5f5; }
        .system { background-color: #fff3e0; }
        .role { font-weight: bold; margin-bottom: 5px; }
        .timestamp { font-size: 0.8em; color: #666; }
        .metadata { font-size: 0.9em; color: #666; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Conversation Export</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
`;

  conversationData.forEach((conversation, index) => {
    html += `
    <div class="conversation">
        <h2 class="conversation-title">${conversation.title}</h2>
        ${includeMetadata ? `
        <div class="metadata">
            Created: ${new Date(conversation.created_at).toLocaleString()} | 
            Updated: ${new Date(conversation.updated_at).toLocaleString()} | 
            Messages: ${conversation.messages.length}
        </div>
        ` : ''}
`;

    conversation.messages.forEach((message: any) => {
      html += `
        <div class="message ${message.role}">
            <div class="role">${message.role.toUpperCase()}</div>
            ${includeMetadata ? `<div class="timestamp">${new Date(message.created_at).toLocaleString()}</div>` : ''}
            <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
        </div>
`;
    });

    html += '</div>';
  });

  html += '</body></html>';
  return html;
}
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebBrowseRequest {
  message: string;
  context?: string;
  systemPrompt?: string;
  model?: string;
}

interface KnowledgeDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  summary: string;
  topics: string[];
  importance_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context = 'general', systemPrompt, model = 'google/gemini-3-flash-preview' } = await req.json() as WebBrowseRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }

    // Parse commands
    const command = parseCommand(message);
    
    if (command) {
      return await handleCommand(command, supabase, userId, req);
    }

    // Search existing knowledge for context
    const relevantKnowledge = await searchKnowledge(message, supabase, userId);
    
    // Enhance system prompt with knowledge context
    const enhancedSystemPrompt = createEnhancedSystemPrompt(systemPrompt, relevantKnowledge, context);

    // Call OpenAI with enhanced context
    const openaiResponse = await callOpenAI(message, enhancedSystemPrompt, model);

    return new Response(JSON.stringify(openaiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-web-browser function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'I encountered an error processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseCommand(message: string) {
  const trimmed = message.trim();
  
  if (trimmed.startsWith('/browse ')) {
    return { type: 'browse', url: trimmed.slice(8).trim() };
  }
  
  if (trimmed.startsWith('/learn ')) {
    return { type: 'learn', url: trimmed.slice(7).trim() };
  }
  
  if (trimmed === '/memory') {
    return { type: 'memory' };
  }
  
  if (trimmed.startsWith('/forget ')) {
    return { type: 'forget', topic: trimmed.slice(8).trim() };
  }
  
  return null;
}

async function handleCommand(command: any, supabase: any, userId: string, req: Request) {
  switch (command.type) {
    case 'browse':
      return await handleBrowse(command.url, supabase, userId);
    case 'learn':
      return await handleLearn(command.url, supabase, userId);
    case 'memory':
      return await handleMemory(supabase, userId);
    case 'forget':
      return await handleForget(command.topic, supabase, userId);
    default:
      return new Response(JSON.stringify({ 
        response: 'Unknown command. Available commands: /browse [url], /learn [url], /memory, /forget [topic]' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handleBrowse(url: string, supabase: any, userId: string) {
  try {
    // Call the existing web-crawler function for scraping
    const result = await supabase.functions.invoke('web-crawler', {
      body: { action: 'scrape', url }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const scrapedData = result.data;
    
    if (scrapedData.success && scrapedData.data) {
      // Create crawl job record
      const { data: crawlJob } = await supabase
        .from('web_crawl_jobs')
        .insert({
          user_id: userId,
          url,
          crawl_type: 'scrape',
          status: 'completed',
          pages_found: 1,
          pages_processed: 1,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      // Store as knowledge document
      const content = scrapedData.data.markdown || scrapedData.data.html || '';
      const title = scrapedData.data.metadata?.title || 'Scraped Page';
      
      await supabase
        .from('knowledge_documents')
        .insert({
          user_id: userId,
          crawl_job_id: crawlJob.id,
          url,
          title,
          content,
          word_count: content.split(' ').length,
          summary: content.slice(0, 500) + '...',
          topics: extractTopics(content),
          importance_score: 70
        });

      return new Response(JSON.stringify({ 
        response: `✅ Successfully browsed and learned from: **${title}**\n\nPage content has been added to my knowledge base. I can now reference this information in our conversation.`,
        data: { title, url, wordCount: content.split(' ').length }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Failed to scrape the webpage');
    }
  } catch (error) {
    console.error('Browse error:', error);
    return new Response(JSON.stringify({ 
      response: `❌ Failed to browse ${url}: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleLearn(url: string, supabase: any, userId: string) {
  try {
    // Call the existing web-crawler function for crawling
    const result = await supabase.functions.invoke('web-crawler', {
      body: { 
        action: 'crawl', 
        url,
        options: {
          limit: 50,
          scrapeOptions: {
            formats: ['markdown', 'html']
          }
        }
      }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const crawlData = result.data;
    
    if (crawlData.success && crawlData.data) {
      // Create crawl job record
      const { data: crawlJob } = await supabase
        .from('web_crawl_jobs')
        .insert({
          user_id: userId,
          url,
          crawl_type: 'crawl',
          status: 'completed',
          pages_found: crawlData.data.length,
          pages_processed: crawlData.data.length,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      // Store each page as knowledge document
      let totalWords = 0;
      for (const page of crawlData.data) {
        const content = page.markdown || page.html || '';
        const title = page.metadata?.title || page.url;
        const wordCount = content.split(' ').length;
        totalWords += wordCount;
        
        await supabase
          .from('knowledge_documents')
          .insert({
            user_id: userId,
            crawl_job_id: crawlJob.id,
            url: page.url,
            title,
            content,
            word_count: wordCount,
            summary: content.slice(0, 500) + '...',
            topics: extractTopics(content),
            importance_score: Math.min(100, Math.max(50, wordCount / 10))
          });
      }

      return new Response(JSON.stringify({ 
        response: `🧠 **Deep learning completed!**\n\nCrawled **${crawlData.data.length} pages** from the domain (${totalWords.toLocaleString()} words total).\n\nI now have comprehensive knowledge about this website and can answer detailed questions about its content.`,
        data: { 
          pagesLearned: crawlData.data.length, 
          totalWords,
          domain: new URL(url).hostname 
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Failed to crawl the website');
    }
  } catch (error) {
    console.error('Learn error:', error);
    return new Response(JSON.stringify({ 
      response: `❌ Failed to learn from ${url}: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleMemory(supabase: any, userId: string) {
  try {
    const { data: documents } = await supabase
      .from('knowledge_documents')
      .select('url, title, word_count, topics, created_at, importance_score')
      .eq('user_id', userId)
      .order('importance_score', { ascending: false })
      .limit(20);

    if (!documents || documents.length === 0) {
      return new Response(JSON.stringify({ 
        response: "🧠 **My Memory is Empty**\n\nI haven't learned from any websites yet. Use `/browse [url]` to quickly learn from a single page, or `/learn [url]` to deeply study an entire website."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalWords = documents.reduce((sum, doc) => sum + doc.word_count, 0);
    const topTopics = [...new Set(documents.flatMap(doc => doc.topics || []))].slice(0, 10);

    let memoryReport = `🧠 **My Current Memory**\n\n`;
    memoryReport += `📊 **Stats:** ${documents.length} documents, ${totalWords.toLocaleString()} words learned\n\n`;
    memoryReport += `🏷️ **Top Topics:** ${topTopics.join(', ')}\n\n`;
    memoryReport += `📚 **Recent Knowledge:**\n`;
    
    documents.slice(0, 10).forEach((doc, i) => {
      const domain = new URL(doc.url).hostname;
      const age = Math.floor((Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24));
      memoryReport += `${i + 1}. **${doc.title}** (${domain}) - ${doc.word_count} words, ${age}d ago\n`;
    });

    return new Response(JSON.stringify({ 
      response: memoryReport,
      data: { totalDocuments: documents.length, totalWords, topTopics }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Memory error:', error);
    return new Response(JSON.stringify({ 
      response: `❌ Failed to access memory: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleForget(topic: string, supabase: any, userId: string) {
  try {
    const { data: deleted } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('user_id', userId)
      .or(`title.ilike.%${topic}%, topics.cs.{${topic}}, url.ilike.%${topic}%`)
      .select('title');

    const count = deleted?.length || 0;
    
    return new Response(JSON.stringify({ 
      response: count > 0 
        ? `🗑️ **Forgotten!** Removed ${count} document(s) related to "${topic}" from my memory.`
        : `🤔 I couldn't find any knowledge related to "${topic}" in my memory.`,
      data: { deletedCount: count }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Forget error:', error);
    return new Response(JSON.stringify({ 
      response: `❌ Failed to forget "${topic}": ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function searchKnowledge(query: string, supabase: any, userId: string): Promise<KnowledgeDocument[]> {
  if (!userId) return [];
  
  try {
    // Simple text search - in production, you'd want vector search
    const { data: documents } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('user_id', userId)
      .or(`content.ilike.%${query}%, title.ilike.%${query}%, summary.ilike.%${query}%`)
      .order('importance_score', { ascending: false })
      .limit(5);

    // Update last_accessed for retrieved documents
    if (documents && documents.length > 0) {
      const docIds = documents.map(doc => doc.id);
      await supabase
        .from('knowledge_documents')
        .update({ last_accessed: new Date().toISOString() })
        .in('id', docIds);
    }

    return documents || [];
  } catch (error) {
    console.error('Knowledge search error:', error);
    return [];
  }
}

function createEnhancedSystemPrompt(originalPrompt: string, knowledge: KnowledgeDocument[], context: string): string {
  let enhancedPrompt = originalPrompt || `You are UltriumGPT's intelligent assistant. You help users with cybersecurity, MSP operations, helpdesk management, and business technology questions. Be concise and direct in your responses.`;

  if (knowledge.length > 0) {
    enhancedPrompt += `\n\n**RELEVANT KNOWLEDGE FROM MY MEMORY:**\n`;
    knowledge.forEach((doc, i) => {
      enhancedPrompt += `\n${i + 1}. From "${doc.title}" (${doc.url}):\n${doc.summary}\n`;
    });
    enhancedPrompt += `\n**Instructions:** Use this knowledge when relevant to the user's question. Always cite sources when referencing learned information.`;
  }

  enhancedPrompt += `\n\n**Available Commands:**
- /browse [url] - Quickly learn from a single webpage
- /learn [url] - Deeply study an entire website
- /memory - View my current knowledge
- /forget [topic] - Remove specific knowledge

If users ask about web content I haven't learned yet, suggest using these commands.`;

  return enhancedPrompt;
}

async function callOpenAI(message: string, systemPrompt: string, model: string) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add more credits to continue.');
    }
    const errorText = await response.text();
    console.error('Lovable AI Gateway error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    model: data.model,
    usage: data.usage
  };
}

function extractTopics(content: string): string[] {
  // Simple topic extraction - in production, use NLP libraries
  const words = content.toLowerCase().split(/\W+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those']);
  
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
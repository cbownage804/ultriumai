import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-ticket-patterns] Starting analysis for user: ${user.id}`);

    // Fetch recent tickets for analysis (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: tickets, error: ticketError } = await supabase
      .from('vanguard_service_tickets')
      .select('id, subject, description, category, priority, status, client_id, created_at, resolved_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    if (ticketError) {
      console.error('[analyze-ticket-patterns] Failed to fetch tickets:', ticketError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tickets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tickets || tickets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tickets to analyze', patterns_found: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-ticket-patterns] Analyzing ${tickets.length} tickets`);

    // Group tickets by category and keywords
    const patternGroups: Record<string, any[]> = {};
    const keywordPatterns: Record<string, any[]> = {};

    // Common issue keywords for pattern detection
    const issueKeywords = [
      { pattern: /password|login|auth|sign.?in/i, name: 'Authentication Issues', category: 'Security' },
      { pattern: /slow|performance|lag|freeze/i, name: 'Performance Problems', category: 'Performance' },
      { pattern: /crash|error|fail|not.?work/i, name: 'Application Errors', category: 'Errors' },
      { pattern: /network|connect|internet|wifi/i, name: 'Network Connectivity', category: 'Network' },
      { pattern: /email|outlook|mail/i, name: 'Email Issues', category: 'Email' },
      { pattern: /print|printer|scan/i, name: 'Printing Problems', category: 'Hardware' },
      { pattern: /vpn|remote|access/i, name: 'Remote Access Issues', category: 'Access' },
      { pattern: /update|patch|install/i, name: 'Software Updates', category: 'Updates' },
      { pattern: /backup|restore|recover/i, name: 'Backup & Recovery', category: 'Backup' },
      { pattern: /virus|malware|security/i, name: 'Security Threats', category: 'Security' },
    ];

    // Analyze each ticket
    for (const ticket of tickets) {
      const text = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
      
      // Category-based grouping
      const cat = ticket.category || 'General';
      if (!patternGroups[cat]) {
        patternGroups[cat] = [];
      }
      patternGroups[cat].push(ticket);

      // Keyword-based pattern detection
      for (const kw of issueKeywords) {
        if (kw.pattern.test(text)) {
          if (!keywordPatterns[kw.name]) {
            keywordPatterns[kw.name] = [];
          }
          keywordPatterns[kw.name].push(ticket);
        }
      }
    }

    // Merge and calculate pattern statistics
    const detectedPatterns: any[] = [];

    // Process keyword-based patterns (more specific)
    for (const [patternName, patternTickets] of Object.entries(keywordPatterns)) {
      if (patternTickets.length >= 2) { // Minimum 2 occurrences for a pattern
        const kw = issueKeywords.find(k => k.name === patternName);
        const uniqueClients = new Set(patternTickets.map((t: any) => t.client_id).filter(Boolean));
        
        // Calculate average resolution time
        const resolvedTickets = patternTickets.filter((t: any) => t.resolved_at);
        let avgResolutionMinutes = null;
        if (resolvedTickets.length > 0) {
          const totalMinutes = resolvedTickets.reduce((sum: number, t: any) => {
            const created = new Date(t.created_at).getTime();
            const resolved = new Date(t.resolved_at).getTime();
            return sum + (resolved - created) / 60000;
          }, 0);
          avgResolutionMinutes = Math.round(totalMinutes / resolvedTickets.length);
        }

        // Determine trend (compare first half vs second half of time period)
        const mid = Math.floor(patternTickets.length / 2);
        const firstHalf = patternTickets.slice(mid);
        const secondHalf = patternTickets.slice(0, mid);
        let trend = 'stable';
        let trendPercent = 0;
        
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const ratio = secondHalf.length / firstHalf.length;
          if (ratio > 1.2) {
            trend = 'rising';
            trendPercent = Math.round((ratio - 1) * 100);
          } else if (ratio < 0.8) {
            trend = 'declining';
            trendPercent = Math.round((1 - ratio) * 100);
          }
        }

        // Determine severity based on count and priority
        const highPriorityCount = patternTickets.filter((t: any) => 
          ['critical', 'high', 'urgent'].includes((t.priority || '').toLowerCase())
        ).length;
        let severity = 'low';
        if (patternTickets.length >= 10 || highPriorityCount >= 3) severity = 'critical';
        else if (patternTickets.length >= 5 || highPriorityCount >= 2) severity = 'high';
        else if (patternTickets.length >= 3 || highPriorityCount >= 1) severity = 'medium';

        detectedPatterns.push({
          pattern_name: patternName,
          category: kw?.category || 'General',
          occurrences: patternTickets.length,
          affected_clients: uniqueClients.size,
          avg_resolution_time_minutes: avgResolutionMinutes,
          trend,
          trend_percent: trendPercent,
          severity,
          suggested_kb: patternTickets.length >= 3,
          first_seen_at: patternTickets[patternTickets.length - 1]?.created_at,
          last_seen_at: patternTickets[0]?.created_at,
          root_cause: null, // Could be enhanced with AI analysis
          user_id: user.id,
        });
      }
    }

    console.log(`[analyze-ticket-patterns] Found ${detectedPatterns.length} patterns`);

    // Upsert patterns into database
    if (detectedPatterns.length > 0) {
      // Delete old patterns for this user first
      await supabase
        .from('vanguard_detected_patterns')
        .delete()
        .eq('user_id', user.id);

      // Insert new patterns
      const { error: insertError } = await supabase
        .from('vanguard_detected_patterns')
        .insert(detectedPatterns);

      if (insertError) {
        console.error('[analyze-ticket-patterns] Failed to insert patterns:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save patterns', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Pattern analysis complete',
        tickets_analyzed: tickets.length,
        patterns_found: detectedPatterns.length,
        patterns: detectedPatterns.map(p => ({ name: p.pattern_name, occurrences: p.occurrences, severity: p.severity }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-ticket-patterns] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportConfig, dateRange, recipientList, reportType } = await req.json();

    const prompt = `You are a business intelligence report generator for an MSP. Generate a comprehensive report based on the configuration.

REPORT CONFIGURATION:
- Report Type: ${reportType}
- Date Range: ${dateRange.start} to ${dateRange.end}
- Include Sections: ${JSON.stringify(reportConfig.sections)}
- Metrics: ${JSON.stringify(reportConfig.metrics)}
- Grouping: ${reportConfig.groupBy || 'none'}

Generate a JSON report structure:
{
  "report_title": "Generated title based on type",
  "report_period": "${dateRange.start} - ${dateRange.end}",
  "generated_at": "${new Date().toISOString()}",
  "executive_summary": {
    "highlights": ["key highlight 1", "key highlight 2"],
    "concerns": ["concern if any"],
    "recommendations": ["recommendation 1"]
  },
  "kpi_dashboard": {
    "total_tickets": {"value": 245, "change": 12, "trend": "up"},
    "resolution_time_avg": {"value": "4.2 hours", "change": -15, "trend": "down"},
    "customer_satisfaction": {"value": 4.6, "change": 5, "trend": "up"},
    "sla_compliance": {"value": "96%", "change": 2, "trend": "up"},
    "first_contact_resolution": {"value": "78%", "change": 3, "trend": "up"}
  },
  "ticket_analysis": {
    "by_category": [{"category": "Network", "count": 45, "percentage": 18}],
    "by_priority": [{"priority": "Critical", "count": 12, "percentage": 5}],
    "by_status": [{"status": "Resolved", "count": 180, "percentage": 73}],
    "resolution_times": {"critical": "2h", "high": "4h", "medium": "8h", "low": "24h"}
  },
  "technician_performance": [
    {
      "name": "John Smith",
      "tickets_resolved": 45,
      "avg_resolution_time": "3.5h",
      "csat_score": 4.8,
      "utilization": "85%"
    }
  ],
  "client_health": [
    {
      "client": "Acme Corp",
      "tickets": 15,
      "satisfaction": 4.5,
      "sla_met": "100%",
      "risk_level": "low"
    }
  ],
  "trends_and_insights": [
    "Insight about patterns",
    "Forecast or prediction"
  ],
  "action_items": [
    {"item": "Review network infrastructure", "priority": "high", "owner": "IT Manager"}
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('AI_GATEWAY_API_KEY') || Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      report_title: "Generated Report",
      executive_summary: { highlights: [content] }
    };

    return new Response(JSON.stringify({
      success: true,
      report: reportData,
      recipients: recipientList,
      delivery_status: "pending",
      processed_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scheduled Report Generator Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

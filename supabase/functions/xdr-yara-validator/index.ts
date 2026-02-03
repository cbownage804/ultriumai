import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  rule_content: string;
  rule_name?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed?: ParsedRule;
}

interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  severity: 'error';
}

interface ValidationWarning {
  line?: number;
  message: string;
  severity: 'warning';
}

interface ParsedRule {
  name: string;
  meta: Record<string, string>;
  strings: { identifier: string; type: string; value: string }[];
  condition: string;
}

// YARA syntax validation
function validateYaraRule(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let parsed: ParsedRule | undefined;

  const lines = content.split('\n');
  
  // Track parsing state
  let inRule = false;
  let inMeta = false;
  let inStrings = false;
  let inCondition = false;
  let braceCount = 0;
  let ruleName = '';
  let ruleStartLine = 0;

  const meta: Record<string, string> = {};
  const strings: { identifier: string; type: string; value: string }[] = [];
  let condition = '';

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      continue;
    }

    // Check for rule declaration
    const ruleMatch = trimmedLine.match(/^(private\s+|global\s+)*rule\s+(\w+)(\s*:\s*[\w\s]+)?\s*\{?$/);
    if (ruleMatch) {
      if (inRule) {
        errors.push({
          line: lineNum,
          message: `Nested rule declaration not allowed. Previous rule '${ruleName}' not closed.`,
          severity: 'error'
        });
      }
      inRule = true;
      ruleName = ruleMatch[2];
      ruleStartLine = lineNum;
      
      // Validate rule name
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ruleName)) {
        errors.push({
          line: lineNum,
          message: `Invalid rule name '${ruleName}'. Must start with letter/underscore and contain only alphanumeric/underscore.`,
          severity: 'error'
        });
      }
      
      if (trimmedLine.includes('{')) braceCount++;
      continue;
    }

    // Track braces
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    if (braceCount === 0 && inRule) {
      inRule = false;
      inMeta = false;
      inStrings = false;
      inCondition = false;
    }

    // Check for section keywords
    if (inRule) {
      if (trimmedLine === 'meta:') {
        inMeta = true;
        inStrings = false;
        inCondition = false;
        continue;
      }
      if (trimmedLine === 'strings:') {
        inMeta = false;
        inStrings = true;
        inCondition = false;
        continue;
      }
      if (trimmedLine === 'condition:') {
        inMeta = false;
        inStrings = false;
        inCondition = true;
        continue;
      }

      // Parse meta section
      if (inMeta) {
        const metaMatch = trimmedLine.match(/^(\w+)\s*=\s*(.+)$/);
        if (metaMatch) {
          meta[metaMatch[1]] = metaMatch[2].replace(/^["']|["']$/g, '');
        } else if (trimmedLine !== '}') {
          warnings.push({
            line: lineNum,
            message: `Invalid meta entry format: ${trimmedLine}`,
            severity: 'warning'
          });
        }
      }

      // Parse strings section
      if (inStrings) {
        // Text string
        const textMatch = trimmedLine.match(/^\$(\w+)\s*=\s*"([^"]*)"(\s+(nocase|wide|ascii|fullword|private))*$/);
        if (textMatch) {
          strings.push({ identifier: '$' + textMatch[1], type: 'text', value: textMatch[2] });
          continue;
        }

        // Hex string
        const hexMatch = trimmedLine.match(/^\$(\w+)\s*=\s*\{([^}]+)\}$/);
        if (hexMatch) {
          const hexContent = hexMatch[2].replace(/\s/g, '');
          if (!/^([0-9A-Fa-f?]{2}\s*)+$/.test(hexMatch[2].trim())) {
            errors.push({
              line: lineNum,
              message: `Invalid hex string format for $${hexMatch[1]}`,
              severity: 'error'
            });
          }
          strings.push({ identifier: '$' + hexMatch[1], type: 'hex', value: hexMatch[2] });
          continue;
        }

        // Regex string
        const regexMatch = trimmedLine.match(/^\$(\w+)\s*=\s*\/(.+)\/([is]*)$/);
        if (regexMatch) {
          try {
            new RegExp(regexMatch[2]);
          } catch (e) {
            errors.push({
              line: lineNum,
              message: `Invalid regex pattern for $${regexMatch[1]}: ${e.message}`,
              severity: 'error'
            });
          }
          strings.push({ identifier: '$' + regexMatch[1], type: 'regex', value: regexMatch[2] });
          continue;
        }

        if (trimmedLine !== '}' && !trimmedLine.startsWith('//')) {
          warnings.push({
            line: lineNum,
            message: `Unrecognized string definition: ${trimmedLine.substring(0, 50)}`,
            severity: 'warning'
          });
        }
      }

      // Parse condition section
      if (inCondition && trimmedLine !== '}') {
        condition += ' ' + trimmedLine;
      }
    }
  }

  // Check unclosed rule
  if (inRule || braceCount !== 0) {
    errors.push({
      message: `Unclosed rule '${ruleName}' starting at line ${ruleStartLine}`,
      severity: 'error'
    });
  }

  // Validate condition references
  if (condition) {
    const conditionRefs = condition.match(/\$\w+/g) || [];
    for (const ref of conditionRefs) {
      if (!strings.some(s => s.identifier === ref) && ref !== '$*') {
        errors.push({
          message: `Condition references undefined string '${ref}'`,
          severity: 'error'
        });
      }
    }
  }

  // Check for required sections
  if (ruleName && !condition.trim()) {
    errors.push({
      message: `Rule '${ruleName}' missing condition section`,
      severity: 'error'
    });
  }

  // Performance warnings
  if (strings.some(s => s.type === 'regex' && s.value.includes('.*'))) {
    warnings.push({
      message: `Regex with '.*' can cause performance issues. Consider using more specific patterns.`,
      severity: 'warning'
    });
  }

  if (strings.filter(s => s.type === 'text').length > 20) {
    warnings.push({
      message: `Rule has many text strings (${strings.length}). This may impact scanning performance.`,
      severity: 'warning'
    });
  }

  // Best practice warnings
  if (!meta['description'] && !meta['desc']) {
    warnings.push({
      message: `Missing 'description' in meta section. Good practice to document rule purpose.`,
      severity: 'warning'
    });
  }

  if (!meta['author']) {
    warnings.push({
      message: `Missing 'author' in meta section.`,
      severity: 'warning'
    });
  }

  parsed = {
    name: ruleName,
    meta,
    strings,
    condition: condition.trim()
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed: errors.length === 0 ? parsed : undefined
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: ValidationRequest = await req.json();
    const { rule_content, rule_name } = body;

    if (!rule_content) {
      return new Response(JSON.stringify({ error: 'rule_content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Validating YARA rule${rule_name ? `: ${rule_name}` : ''}`);

    const result = validateYaraRule(rule_content);

    // Log validation
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'yara_validation',
      resource_type: 'yara_rule',
      resource_id: rule_name,
      details: {
        valid: result.valid,
        error_count: result.errors.length,
        warning_count: result.warnings.length
      }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('YARA validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

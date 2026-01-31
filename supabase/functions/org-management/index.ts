import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrgHierarchy {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  children?: OrgHierarchy[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();
    console.log(`[org-management] Action: ${action}`);

    switch (action) {
      case 'create_sub_org': {
        const { parent_org_id, name, settings, user_id, msp_id } = params;
        
        let parentLevel = 0;
        if (parent_org_id) {
          const { data: parentOrg } = await supabase
            .from('msp_clients')
            .select('id, company_name, integration_settings')
            .eq('id', parent_org_id)
            .single();

          const parentSettings = parentOrg?.integration_settings as Record<string, any> | null;
          parentLevel = parentSettings?.hierarchy_level || 0;
        }
        
        const { data: newOrg, error } = await supabase
          .from('msp_clients')
          .insert({
            company_name: name,
            msp_id: msp_id || user_id,
            contact_name: 'Admin',
            contact_email: 'admin@' + name.toLowerCase().replace(/\s+/g, '') + '.com',
            monthly_rate: 0,
            is_active: true,
            integration_settings: {
              parent_org_id,
              hierarchy_level: parentLevel + 1,
              settings: settings || {},
              created_from: 'sub_org'
            }
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          organization: newOrg,
          hierarchy_level: parentLevel + 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_hierarchy': {
        const { msp_id, user_id } = params;
        
        const { data: allOrgs } = await supabase
          .from('msp_clients')
          .select('*')
          .eq('msp_id', msp_id || user_id)
          .order('created_at', { ascending: true });

        const buildTree = (orgs: any[], parentId: string | null = null, level = 0): OrgHierarchy[] => {
          return orgs
            .filter(org => {
              const settings = org.integration_settings as Record<string, any> | null;
              if (parentId === null) {
                return !settings?.parent_org_id;
              }
              return settings?.parent_org_id === parentId;
            })
            .map(org => ({
              id: org.id,
              name: org.company_name,
              parent_id: (org.integration_settings as any)?.parent_org_id || null,
              level,
              children: buildTree(orgs, org.id, level + 1)
            }));
        };

        const hierarchy = buildTree(allOrgs || []);

        return new Response(JSON.stringify({ 
          success: true, 
          hierarchy,
          total_orgs: allOrgs?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'add_member': {
        const { org_id, email, role, permissions, user_id } = params;
        
        const { data, error } = await supabase
          .from('helpdesk_technicians')
          .insert({
            user_id,
            name: email.split('@')[0],
            email,
            role: role === 'technician' ? 'technician' : 'admin',
            is_active: true,
            metadata: {
              org_id,
              org_role: role,
              permissions: permissions || getDefaultPermissions(role)
            }
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          member: data 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_members': {
        const { org_id, user_id } = params;
        
        const { data: members } = await supabase
          .from('helpdesk_technicians')
          .select('*')
          .eq('user_id', user_id);

        const orgMembers = (members || []).filter(m => {
          const metadata = m.metadata as any;
          return metadata?.org_id === org_id;
        });

        return new Response(JSON.stringify({ 
          success: true, 
          members: orgMembers 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_member_permissions': {
        const { member_id, permissions, role } = params;
        
        const { data: member } = await supabase
          .from('helpdesk_technicians')
          .select('metadata')
          .eq('id', member_id)
          .single();

        const existingMetadata = (member?.metadata as any) || {};
        
        const { error } = await supabase
          .from('helpdesk_technicians')
          .update({
            metadata: {
              ...existingMetadata,
              org_role: role,
              permissions
            }
          })
          .eq('id', member_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'transfer_assets': {
        const { from_org_id, to_org_id, asset_ids, user_id } = params;
        
        const { error: assetError } = await supabase
          .from('assets')
          .update({ client_id: to_org_id })
          .in('id', asset_ids)
          .eq('user_id', user_id);

        const { error: deviceError } = await supabase
          .from('vanguard_agents')
          .update({ org_id: to_org_id })
          .in('id', asset_ids)
          .eq('user_id', user_id);

        if (assetError && deviceError) {
          throw new Error('Failed to transfer assets');
        }

        return new Response(JSON.stringify({ 
          success: true,
          transferred: asset_ids.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[org-management] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'owner':
      return ['*'];
    case 'admin':
      return ['read', 'write', 'delete', 'manage_users', 'manage_billing'];
    case 'technician':
      return ['read', 'write', 'manage_tickets', 'manage_devices'];
    case 'viewer':
      return ['read'];
    default:
      return ['read'];
  }
}

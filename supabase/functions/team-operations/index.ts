import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamInviteRequest {
  team_id: string;
  email: string;
  role: 'member' | 'admin';
}

interface TeamInviteResponse {
  token: string;
  expires_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'invite':
        return await handleTeamInvite(req, supabaseClient, user);
      case 'accept':
        return await handleAcceptInvite(req, supabaseClient, user);
      case 'remove':
        return await handleRemoveMember(req, supabaseClient, user);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Team operations error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleTeamInvite(req: Request, supabaseClient: any, user: any) {
  const { team_id, email, role }: TeamInviteRequest = await req.json();

  // Verify user is team owner
  const { data: team, error: teamError } = await supabaseClient
    .from('teams')
    .select('*')
    .eq('id', team_id)
    .eq('owner_id', user.id)
    .single();

  if (teamError || !team) {
    return new Response(JSON.stringify({ error: 'Team not found or unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate invitation token
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation record
  const { data: invitation, error: inviteError } = await supabaseClient
    .from('team_invitations')
    .insert({
      team_id,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (inviteError) {
    console.error('Error creating invitation:', inviteError);
    return new Response(JSON.stringify({ error: 'Failed to create invitation' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Send invitation email (mock for now)
  const inviteUrl = `${Deno.env.get('SITE_URL')}/accept-invite?token=${token}`;
  
  // Here you would integrate with your email service
  console.log(`Invitation sent to ${email}: ${inviteUrl}`);

  return new Response(JSON.stringify({ 
    success: true, 
    invitation_id: invitation.id,
    invite_url: inviteUrl
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleAcceptInvite(req: Request, supabaseClient: any, user: any) {
  const { token } = await req.json();

  // Find valid invitation
  const { data: invitation, error: inviteError } = await supabaseClient
    .from('team_invitations')
    .select('*, teams(*)')
    .eq('token', token)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError || !invitation) {
    return new Response(JSON.stringify({ error: 'Invalid or expired invitation' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if user email matches invitation email
  if (user.email !== invitation.email) {
    return new Response(JSON.stringify({ error: 'Email mismatch' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Add user to team
  const { error: memberError } = await supabaseClient
    .from('team_memberships')
    .insert({
      team_id: invitation.team_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by
    });

  if (memberError) {
    console.error('Error adding team member:', memberError);
    return new Response(JSON.stringify({ error: 'Failed to join team' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Deactivate invitation
  await supabaseClient
    .from('team_invitations')
    .update({ 
      is_active: false, 
      accepted_at: new Date().toISOString() 
    })
    .eq('id', invitation.id);

  return new Response(JSON.stringify({ 
    success: true, 
    team: invitation.teams 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleRemoveMember(req: Request, supabaseClient: any, user: any) {
  const { team_id, user_id } = await req.json();

  // Verify user is team owner
  const { data: team, error: teamError } = await supabaseClient
    .from('teams')
    .select('*')
    .eq('id', team_id)
    .eq('owner_id', user.id)
    .single();

  if (teamError || !team) {
    return new Response(JSON.stringify({ error: 'Team not found or unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Remove team member
  const { error: removeError } = await supabaseClient
    .from('team_memberships')
    .update({ is_active: false })
    .eq('team_id', team_id)
    .eq('user_id', user_id);

  if (removeError) {
    console.error('Error removing team member:', removeError);
    return new Response(JSON.stringify({ error: 'Failed to remove team member' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
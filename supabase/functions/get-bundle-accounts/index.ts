import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BundleChannel {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
}

interface BundleSocialAccount {
  type: string;
  name?: string;
  channels?: BundleChannel[];
}

interface BundleAccount {
  id: string;
  platform: string;
  name: string;
  username?: string;
  avatar?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('BUNDLE_SOCIAL_API_KEY');
    const teamId = Deno.env.get('BUNDLE_SOCIAL_TEAM_ID');
    
    if (!apiKey || !teamId) {
      throw new Error('Bundle.Social credentials not configured. Please add BUNDLE_SOCIAL_API_KEY and BUNDLE_SOCIAL_TEAM_ID secrets.');
    }

    console.log('Fetching Bundle.Social team data for team:', teamId);

    const response = await fetch(`https://api.bundle.social/api/v1/team/${teamId}`, {
      headers: { 
        'x-api-key': apiKey, 
        'Content-Type': 'application/json' 
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bundle.Social API error:', response.status, errorText);
      throw new Error(`Failed to fetch team data: ${response.status}`);
    }

    const teamData = await response.json();
    console.log('Bundle.Social accounts found:', teamData.socialAccounts?.length || 0);

    // Map social accounts to a flat list of channels/accounts
    const accounts: BundleAccount[] = (teamData.socialAccounts || []).flatMap((account: BundleSocialAccount) =>
      (account.channels || []).map((channel: BundleChannel) => ({
        id: channel.id,
        platform: account.type,
        name: channel.name || account.name || 'Unknown',
        username: channel.username,
        avatar: channel.avatar,
      }))
    );

    return new Response(JSON.stringify({ accounts }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('get-bundle-accounts error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

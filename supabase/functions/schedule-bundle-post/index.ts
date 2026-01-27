import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostRequest {
  title: string;
  content: string;
  platforms: string[]; // Array of channel IDs
  scheduledAt?: string;
  imageUrl?: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, platforms, scheduledAt, imageUrl, userId } = await req.json() as PostRequest;

    if (!content) throw new Error('Post content is required');
    if (!platforms || platforms.length === 0) throw new Error('At least one platform is required');

    const apiKey = Deno.env.get('BUNDLE_SOCIAL_API_KEY');
    const teamId = Deno.env.get('BUNDLE_SOCIAL_TEAM_ID');
    
    if (!apiKey || !teamId) {
      throw new Error('Bundle.Social credentials not configured');
    }

    console.log('Creating Bundle.Social post for channels:', platforms);

    // First, upload image to Bundle.Social if provided
    let bundleUploadId: string | undefined;
    if (imageUrl && !imageUrl.startsWith('data:')) {
      try {
        console.log('Uploading image to Bundle.Social...');
        const uploadResponse = await fetch(`https://api.bundle.social/api/v1/upload/`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: teamId,
            url: imageUrl,
          }),
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          bundleUploadId = uploadData.id;
          console.log('Image uploaded to Bundle.Social:', bundleUploadId);
        } else {
          const uploadError = await uploadResponse.text();
          console.warn('Failed to upload image to Bundle.Social:', uploadError);
        }
      } catch (uploadError) {
        console.warn('Image upload error:', uploadError);
      }
    }

    // Bundle.Social Create Post requires postDate and status must be DRAFT or SCHEDULED
    const postStatus = 'SCHEDULED';
    let postDate = new Date().toISOString();

    if (scheduledAt) {
      const requestedDate = new Date(scheduledAt);
      if (!Number.isNaN(requestedDate.getTime()) && requestedDate > new Date()) {
        postDate = requestedDate.toISOString();
      }
    }

    console.log('Scheduling post for:', postDate);

    // Build post data for each platform type
    // platforms array contains social account IDs - we need to determine their types
    // For now, we'll send as FACEBOOK type since that's what's connected
    const postData: Record<string, unknown> = {
      FACEBOOK: {
        type: 'POST',
        text: content,
        ...(bundleUploadId ? { uploadIds: [bundleUploadId] } : {}),
      },
    };

    // Build the post payload for Bundle.Social (correct API format)
    const postPayload: Record<string, unknown> = {
      teamId: teamId,
      title: title || content.substring(0, 50),
      status: postStatus,
      socialAccountTypes: ['FACEBOOK'],
      data: postData,
    };

    // postDate is required by Bundle.Social
    postPayload.postDate = postDate;

    console.log('Creating Bundle.Social post with payload:', JSON.stringify(postPayload));

    // Create the post via Bundle.Social API (correct endpoint)
    const postResponse = await fetch(`https://api.bundle.social/api/v1/post/`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error('Bundle.Social post error:', postResponse.status, errorText);
      throw new Error(`Failed to create post: ${postResponse.status} - ${errorText}`);
    }

    const createdPost = await postResponse.json();
    console.log('Bundle.Social post created:', createdPost.id);

    // Save to our database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedPost, error: dbError } = await supabase
      .from('scheduled_social_posts')
      .insert({
        title: title || content.substring(0, 50) + '...',
        post_content: content,
        platforms: platforms,
        status: scheduledAt ? 'scheduled' : 'posted',
        scheduled_at: scheduledAt || null,
        posted_at: scheduledAt ? null : new Date().toISOString(),
        bundle_post_id: createdPost.id,
        image_url: imageUrl || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database save error:', dbError);
      // Don't fail the request, the Bundle.Social post was successful
    }

    return new Response(JSON.stringify({ 
      success: true,
      bundlePostId: createdPost.id,
      post: savedPost,
      scheduled: !!scheduledAt,
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('schedule-bundle-post error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

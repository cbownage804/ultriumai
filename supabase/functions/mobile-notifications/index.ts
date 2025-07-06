import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  priority?: 'normal' | 'high';
  badge?: number;
  sound?: string;
}

interface MobilePushRequest {
  user_id: string;
  notification: NotificationPayload;
  device_tokens?: string[];
  platforms?: ('ios' | 'android' | 'web')[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Firebase Cloud Messaging for Android and Web
async function sendFCMNotification(tokens: string[], payload: NotificationPayload) {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  if (!fcmServerKey) {
    throw new Error('FCM server key not configured');
  }

  const fcmPayload = {
    registration_ids: tokens,
    notification: {
      title: payload.title,
      body: payload.body,
      sound: payload.sound || 'default',
      badge: payload.badge || 1
    },
    data: payload.data || {},
    priority: payload.priority || 'high',
    content_available: true
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${fcmServerKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fcmPayload)
  });

  return await response.json();
}

// Apple Push Notification Service for iOS
async function sendAPNSNotification(tokens: string[], payload: NotificationPayload) {
  // For production, you'd use your APNS certificate/key
  // This is a simplified version for demo purposes
  const apnsPayload = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body
      },
      sound: payload.sound || 'default',
      badge: payload.badge || 1,
      'content-available': 1
    },
    data: payload.data || {}
  };

  // In a real implementation, you'd use node-apn or similar library
  console.log('APNS Notification (demo):', { tokens, payload: apnsPayload });
  
  return { 
    success: tokens.length, 
    failure: 0, 
    results: tokens.map(token => ({ token, success: true }))
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

    const { user_id, notification, device_tokens, platforms, severity }: MobilePushRequest = await req.json();

    if (!user_id || !notification) {
      throw new Error('user_id and notification are required');
    }

    // Get user's registered devices
    let query = supabase
      .from('mobile_devices')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (platforms?.length) {
      query = query.in('platform', platforms);
    }

    if (device_tokens?.length) {
      query = query.in('device_token', device_tokens);
    }

    const { data: devices, error: deviceError } = await query;

    if (deviceError) throw deviceError;

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No devices registered for push notifications',
        sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter devices based on notification preferences
    const filteredDevices = devices.filter(device => {
      const prefs = device.notification_preferences || {};
      return prefs[severity || 'medium'] !== false;
    });

    if (filteredDevices.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All devices have disabled notifications for this severity level',
        sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group devices by platform
    const iosDevices = filteredDevices.filter(d => d.platform === 'ios');
    const androidDevices = filteredDevices.filter(d => d.platform === 'android');
    const webDevices = filteredDevices.filter(d => d.platform === 'web');

    const results = [];

    // Send to iOS devices (APNS)
    if (iosDevices.length > 0) {
      try {
        const iosResult = await sendAPNSNotification(
          iosDevices.map(d => d.device_token), 
          notification
        );
        results.push({ platform: 'ios', ...iosResult });
      } catch (error) {
        console.error('iOS push notification error:', error);
        results.push({ platform: 'ios', success: 0, failure: iosDevices.length, error: error.message });
      }
    }

    // Send to Android and Web devices (FCM)
    const fcmDevices = [...androidDevices, ...webDevices];
    if (fcmDevices.length > 0) {
      try {
        const fcmResult = await sendFCMNotification(
          fcmDevices.map(d => d.device_token), 
          notification
        );
        results.push({ platform: 'fcm', ...fcmResult });
      } catch (error) {
        console.error('FCM push notification error:', error);
        results.push({ platform: 'fcm', success: 0, failure: fcmDevices.length, error: error.message });
      }
    }

    // Update device last_seen timestamps
    const deviceIds = filteredDevices.map(d => d.id);
    await supabase
      .from('mobile_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .in('id', deviceIds);

    // Log notification for analytics
    await supabase
      .from('safe_shield_actions')
      .insert({
        user_id: user_id,
        hostname: 'mobile_notification_system',
        action_type: 'mobile_push_notification',
        action_details: {
          notification: notification,
          devices_targeted: filteredDevices.length,
          results: results,
          severity: severity
        },
        performed_at: new Date().toISOString(),
        status: results.some(r => r.success > 0) ? 'completed' : 'failed'
      });

    const totalSent = results.reduce((sum, r) => sum + (r.success || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.failure || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      message: `Push notifications sent to ${totalSent} devices`,
      sent: totalSent,
      failed: totalFailed,
      devices_targeted: filteredDevices.length,
      results: results,
      notification_id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Mobile notification error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
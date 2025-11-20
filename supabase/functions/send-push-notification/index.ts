import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { userId, title, body, data = {}, sound = 'default', badge } = payload;

    console.log('📨 Envoi de notification pour l\'utilisateur:', userId);

    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Récupérer le token FCM de l'utilisateur
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('fcm_token, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!user.fcm_token) {
      console.log('⚠️ Utilisateur sans token FCM:', userId);
      return new Response(
        JSON.stringify({ error: 'No FCM token for this user' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Préparer le message pour Expo Push Notifications
    const message = {
      to: user.fcm_token,
      sound,
      title,
      body,
      data,
      ...(badge !== undefined && { badge }),
    };

    console.log('📬 Message à envoyer:', message);

    // Envoyer via Expo Push Notification service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data && result.data[0].status === 'error') {
      console.error('❌ Erreur lors de l\'envoi:', result.data[0]);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: result.data[0] }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log('✅ Notification envoyée avec succès');

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

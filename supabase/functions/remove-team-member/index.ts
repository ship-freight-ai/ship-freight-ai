import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { member_id } = await req.json();
    
    if (!member_id) {
      throw new Error('member_id is required');
    }

    console.log('Remove team member request:', { requestor: user.id, member_id });

    // Get the requestor's subscription (must be owner)
    const { data: requestorProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !requestorProfile?.subscription_id) {
      throw new Error('You do not have an active subscription');
    }

    // Verify requestor is the subscription owner
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('id', requestorProfile.subscription_id)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.user_id !== user.id) {
      throw new Error('Only the subscription owner can remove team members');
    }

    // Cannot remove yourself
    if (member_id === user.id) {
      throw new Error('You cannot remove yourself from the team');
    }

    // Get the member to be removed
    const { data: memberProfile, error: memberError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', member_id)
      .single();

    if (memberError || !memberProfile) {
      throw new Error('Team member not found');
    }

    // Verify member belongs to this subscription
    if (memberProfile.subscription_id !== subscription.id) {
      throw new Error('This user is not part of your team');
    }

    // Remove the member: set subscription_id to NULL
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        subscription_id: null,
        claimed_via_invite: null 
      })
      .eq('user_id', member_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to remove team member');
    }

    // Decrement seats_used
    const { error: seatsError } = await supabaseClient
      .from('subscriptions')
      .update({ 
        seats_used: Math.max(0, subscription.seats_used - 1)
      })
      .eq('id', subscription.id);

    if (seatsError) {
      console.error('Error updating seats:', seatsError);
      throw new Error('Failed to update seat count');
    }

    console.log('Team member removed successfully:', { 
      member_id, 
      new_seats_used: subscription.seats_used - 1 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Team member removed successfully',
        seats_used: subscription.seats_used - 1
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in remove-team-member function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

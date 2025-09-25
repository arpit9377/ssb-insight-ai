import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for webhook access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const webhookData = await req.json();
    console.log('Received Cashfree webhook:', webhookData);

    const { type, data } = webhookData;

    // Handle different webhook events
    switch (type) {
      case 'PAYMENT_SUCCESS':
      case 'ORDER_PAID':
        await handleSuccessfulPayment(supabase, data);
        break;
      
      case 'PAYMENT_FAILED':
        await handleFailedPayment(supabase, data);
        break;
      
      default:
        console.log('Unhandled webhook event type:', type);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in cashfree-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleSuccessfulPayment(supabase: any, data: any) {
  const { order_id, payment_id, payment_status } = data;
  
  console.log('Processing successful payment:', { order_id, payment_id, payment_status });

  if (payment_status === 'SUCCESS') {
    // Calculate subscription period (1 month from now)
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Update subscription status
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        cashfree_payment_id: payment_id,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('cashfree_order_id', order_id);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }

    // Get user_id from subscription to update profile
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type')
      .eq('cashfree_order_id', order_id)
      .single();

    if (!fetchError && subscription) {
      // Update user profile subscription status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.plan_type,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', subscription.user_id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      }
    }
  }
}

async function handleFailedPayment(supabase: any, data: any) {
  const { order_id, payment_id, payment_status } = data;
  
  console.log('Processing failed payment:', { order_id, payment_id, payment_status });

  // Update subscription to failed status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'failed',
      cashfree_payment_id: payment_id,
      updated_at: new Date().toISOString()
    })
    .eq('cashfree_order_id', order_id);

  if (error) {
    console.error('Error updating failed payment:', error);
    throw error;
  }
}
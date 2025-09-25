import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID')!;
const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '') || supabaseAnonKey;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authHeader}` } }
    });

    const { orderId, paymentId, signature, userId } = await req.json();

    console.log('Verifying Cashfree payment:', { orderId, paymentId, signature, userId });

    // Get payment details from Cashfree
    const paymentResponse = await fetch(`https://sandbox-api.cashfree.com/pg/orders/${orderId}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey
      }
    });

    const paymentData = await paymentResponse.json();
    console.log('Cashfree payment data:', paymentData);

    if (!paymentResponse.ok || paymentData.payment_status !== 'SUCCESS') {
      throw new Error('Payment verification failed');
    }

    // Calculate subscription period (1 month from now)
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cashfree_payment_id: paymentId,
        cashfree_signature: signature,
        status: 'active',
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('cashfree_order_id', orderId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update subscription');
    }

    // Update user profile subscription status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in verify-cashfree-payment:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
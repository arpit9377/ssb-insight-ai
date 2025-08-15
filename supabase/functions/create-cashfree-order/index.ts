import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { amount, currency, planType, userId } = await req.json();

    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create Cashfree order
    const orderData = {
      order_amount: amount,
      order_currency: currency,
      order_id: orderId,
      customer_details: {
        customer_id: userId,
        customer_name: "User",
        customer_email: "user@example.com",
        customer_phone: "9999999999"
      },
      order_meta: {
        return_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/verify-cashfree-payment?session_id={order_session_id}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/cashfree-webhook`
      }
    };

    console.log('Creating Cashfree order:', orderData);

    const response = await fetch('https://sandbox-api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();
    console.log('Cashfree API response:', responseData);

    if (!response.ok) {
      throw new Error(`Cashfree API error: ${responseData.message || 'Unknown error'}`);
    }

    // Store order in database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        amount: amount,
        currency: currency,
        cashfree_order_id: orderId,
        cashfree_order_token: responseData.order_token,
        status: 'inactive'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store order in database');
    }

    return new Response(JSON.stringify({
      orderId: orderId,
      orderToken: responseData.order_token,
      sessionId: responseData.payment_session_id,
      appId: cashfreeAppId,
      amount: amount,
      currency: currency
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-cashfree-order:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
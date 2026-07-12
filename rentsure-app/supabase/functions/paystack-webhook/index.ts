import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY') || ''

    // 1. Verify signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["verify", "sign"]
    )
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody))
    const expectedSignature = Array.from(new Uint8Array(mac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    const body = JSON.parse(rawBody)
    if (body.event !== 'charge.success') {
      return new Response('Ignored event', { status: 200 })
    }

    const data = body.data
    const paystackRef = data.reference

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Idempotency Check
    const { data: payment } = await supabase
      .from('payments')
      .select('*, bookings(*, properties(*))')
      .eq('paystack_ref', paystackRef)
      .single()

    if (!payment) {
      return new Response('Payment not found', { status: 404 })
    }

    if (payment.escrow_status === 'HELD') {
      return new Response('Already processed', { status: 200 })
    }

    // 3. Update Statuses
    const booking = payment.bookings
    const property = booking.properties

    await supabase.from('payments').update({
      escrow_status: 'HELD',
      paid_at: new Date().toISOString()
    }).eq('id', payment.id)

    await supabase.from('bookings').update({
      status: 'PAID_ESCROW'
    }).eq('id', booking.id)

    await supabase.from('properties').update({
      status: 'RENTED'
    }).eq('id', property.id)

    // 4. Notifications
    await supabase.from('notifications').insert([
      {
        user_id: booking.tenant_id,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        body: `Your payment for ${property.title} was successful.`
      },
      {
        user_id: property.landlord_id,
        type: 'PAYMENT_HELD',
        title: 'Rent Secured in Escrow',
        body: `The tenant has paid for ${property.title}. Funds are held in escrow until move-in.`
      }
    ])

    return new Response('Success', { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

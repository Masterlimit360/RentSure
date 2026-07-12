import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role for internal DB operations
    )

    // Get Auth user from request header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { bookingId } = await req.json()
    if (!bookingId) throw new Error('Missing bookingId')

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, properties(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) throw new Error('Booking not found')
    if (booking.tenant_id !== user.id) throw new Error('Unauthorized for this booking')
    if (booking.status !== 'ACCEPTED') throw new Error('Booking is not in ACCEPTED state')

    // DOUBLE-BOOKING RACE FIX: Check if property is already paid for by someone else
    const { data: competingBookings, error: competingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('property_id', booking.property_id)
      .neq('id', booking.id)
      .in('status', ['PAID_ESCROW', 'MOVED_IN'])
      
    if (competingError) throw new Error('Failed to verify property availability')
    if (competingBookings && competingBookings.length > 0) {
      throw new Error('This property has already been paid for by another tenant.')
    }

    const amountInPesewas = Math.round(booking.total_amount * 100)
    
    // Call Paystack
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInPesewas,
        reference: booking.booking_ref + '-' + Date.now(), // Ensure unique across retries
      }),
    })

    const paystackData = await response.json()
    if (!paystackData.status) throw new Error('Paystack init failed')

    // Create pending payment row
    await supabase.from('payments').insert({
      booking_id: booking.id,
      paystack_ref: paystackData.data.reference,
      amount: booking.total_amount,
      fee: 0,
      escrow_status: 'PENDING',
    })

    return new Response(JSON.stringify({ 
      checkoutUrl: paystackData.data.authorization_url, 
      paystackRef: paystackData.data.reference 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

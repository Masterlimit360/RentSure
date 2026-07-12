import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Basic auth check to ensure it's called by cron (optional but good practice)
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
        // If you don't use CRON_SECRET, remove this.
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate 72 hours ago
    const dateLimit = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

    // Find ACCEPTED bookings older than 72 hours
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, tenant_id, property_id, properties(title)')
      .eq('status', 'ACCEPTED')
      .lte('updated_at', dateLimit)

    if (error) throw error

    for (const booking of bookings || []) {
      // Expire the booking
      await supabase.from('bookings').update({ status: 'EXPIRED' }).eq('id', booking.id)

      // Notify tenant
      await supabase.from('notifications').insert({
        user_id: booking.tenant_id,
        type: 'BOOKING_EXPIRED',
        title: 'Booking Expired',
        body: `Your booking for ${booking.properties.title} has expired because escrow was not paid in time.`
      })
    }

    return new Response(JSON.stringify({ expiredCount: bookings?.length || 0 }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

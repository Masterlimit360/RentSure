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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') throw new Error('Forbidden: Admin access required')

    const { verificationId, action, notes } = await req.json()
    if (!['APPROVED', 'REJECTED'].includes(action)) throw new Error('Invalid action')

    // Get verification
    const { data: verification } = await supabase
      .from('verifications')
      .select('*')
      .eq('id', verificationId)
      .single()

    if (!verification) throw new Error('Verification not found')

    // Update verification
    await supabase.from('verifications').update({
      status: action,
      rejection_reason: notes || null,
      updated_at: new Date().toISOString()
    }).eq('id', verificationId)

    if (action === 'APPROVED') {
      if (verification.property_id) {
        // Approve single property
        await supabase.from('properties').update({ is_verified: true }).eq('id', verification.property_id)
      } else {
        // Approve user
        await supabase.from('profiles').update({ is_verified: true }).eq('id', verification.landlord_id)
        // Also verify all their properties atomically
        await supabase.from('properties').update({ is_verified: true }).eq('landlord_id', verification.landlord_id)
      }
    }

    // Notify user
    await supabase.from('notifications').insert({
      user_id: verification.landlord_id,
      type: `VERIFICATION_${action}`,
      title: `Verification ${action}`,
      body: `Your verification request has been ${action.toLowerCase()}.`
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

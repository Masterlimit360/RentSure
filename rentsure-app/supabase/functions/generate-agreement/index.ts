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
    const { bookingId } = await req.json()
    if (!bookingId) throw new Error('Missing bookingId')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify it doesn't already have an agreement
    const { data: existingAgreement } = await supabase
      .from('agreements')
      .select('id')
      .eq('booking_id', bookingId)
      .single()

    if (existingAgreement) {
      return new Response('Agreement already exists', { status: 200 })
    }

    // Fetch full booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, properties(*), tenant:users!tenant_id(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) throw new Error('Booking not found')
    
    const property = booking.properties;
    const landlordId = property.landlord_id;
    const { data: landlord } = await supabase.from('users').select('*').eq('id', landlordId).single();

    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tenancy Agreement - ${property.title}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
          h1 { text-align: center; }
          .party { font-weight: bold; }
          .amount { font-weight: bold; color: green; }
        </style>
      </head>
      <body>
        <h1>Tenancy Agreement</h1>
        <p>This agreement is made on <strong>${new Date().toLocaleDateString()}</strong> between:</p>
        <p><span class="party">Landlord:</span> ${landlord.full_name} (${landlord.email})</p>
        <p><span class="party">Tenant:</span> ${booking.tenant.full_name} (${booking.tenant.email})</p>
        
        <h2>Property Details</h2>
        <p>The Landlord agrees to let and the Tenant agrees to take the property located at:</p>
        <p><strong>${property.title}</strong><br/>${property.address}, ${property.area}, ${property.city}</p>
        
        <h2>Terms</h2>
        <p><strong>Move-in Date:</strong> ${booking.start_date}</p>
        <p><strong>End Date:</strong> ${booking.end_date}</p>
        <p><strong>Total Amount Paid in Escrow:</strong> <span class="amount">GHS ${booking.total_amount}</span></p>
        
        <p>Both parties agree to the platform's standard terms of service regarding escrow release and property conditions.</p>
        
        <div style="margin-top: 50px;">
          <p>___________________________</p>
          <p>Tenant Signature (Digital)</p>
        </div>
        <div style="margin-top: 50px;">
          <p>___________________________</p>
          <p>Landlord Signature (Digital)</p>
        </div>
      </body>
      </html>
    `;

    // Upload HTML to bucket
    const fileName = `agreement_${bookingId}_${Date.now()}.html`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('agreements')
      .upload(fileName, htmlContent, {
        contentType: 'text/html',
        upsert: true
      })

    if (uploadError) throw new Error('Failed to upload agreement: ' + uploadError.message)

    // Get public URL
    const { data: urlData } = supabase.storage.from('agreements').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Insert Agreement Row
    const { data: agreement, error: insertError } = await supabase
      .from('agreements')
      .insert({
        booking_id: bookingId,
        pdf_url: publicUrl, // Storing HTML URL in the pdf_url field for now
      })
      .select()
      .single()

    if (insertError) throw new Error('Failed to insert agreement row: ' + insertError.message)

    return new Response(JSON.stringify(agreement), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

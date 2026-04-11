import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/email';

export async function PATCH(request: Request) {
  try {
    // isFinal: true means this is the last step in the commit flow — send confirmation email.
    // When user picks "No motivation", isFinal=true is sent with notes.
    // When user picks anti-charity, isFinal=true is sent with antiCharitySlug.
    // Intermediate "describe commitment" step sends isFinal=false.
    const { paymentIntentId, notes, antiCharitySlug, isFinal = false } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    // Fetch the donation using only scalar columns to avoid failures caused
    // by PostgREST join resolution on nullable FKs (anti_charity_id is null
    // until the user picks one, and the joined-field select can return an
    // error in some Supabase configurations when the FK is null).
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select(`
        id, commitment_description, donor_email, donor_name, amount_cents,
        charity_id, anti_charity_id, timeframe, capture_at
      `)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (fetchError || !donation) {
      console.error('[Commitment] Donation lookup error:', fetchError, 'paymentIntentId:', paymentIntentId);
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Fetch charity name for confirmation email (separate query avoids join issues)
    let charityName: string | null = null;
    let existingAntiCharityName: string | null = null;
    if (isFinal && donation.donor_email) {
      if (donation.charity_id) {
        const { data: charityData } = await supabase
          .from('charities')
          .select('name')
          .eq('id', donation.charity_id)
          .single();
        charityName = charityData?.name ?? null;
      }
      if (donation.anti_charity_id) {
        const { data: acData } = await supabase
          .from('charities')
          .select('name')
          .eq('id', donation.anti_charity_id)
          .single();
        existingAntiCharityName = acData?.name ?? null;
      }
    }

    // Resolve anti-charity slug to ID if provided
    let antiCharityId: string | null = null;
    if (antiCharitySlug) {
      const { data: antiCharityData } = await supabase
        .from('charities')
        .select('id')
        .eq('slug', antiCharitySlug)
        .single();
      antiCharityId = antiCharityData?.id ?? null;
    }

    // Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = { commitment_description: notes ?? null };
    if (antiCharityId !== null) {
      updatePayload.anti_charity_id = antiCharityId;
    }

    // Update commitment description (and anti-charity if provided)
    const { error: updateError } = await supabase
      .from('donations')
      .update(updatePayload)
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('[Commitment] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save commitment' }, { status: 500 });
    }

    // Send confirmation email only on the final step of the flow
    if (isFinal && donation.donor_email) {
      // Use the newly resolved anti-charity name if this call set it,
      // otherwise fall back to what was already fetched from the DB.
      let resolvedAntiCharityName: string | null = existingAntiCharityName;
      if (antiCharitySlug && antiCharityId) {
        // Fetch the name for the newly set anti-charity
        const { data: acNameData } = await supabase
          .from('charities')
          .select('name')
          .eq('id', antiCharityId)
          .single();
        resolvedAntiCharityName = acNameData?.name || null;
      }

      const timeframeLabels: Record<string, string> = {
        immediate: 'immediately',
        '5pm': 'today at 5 PM',
        '10pm': 'today at 10 PM',
        midnight: 'tonight at midnight',
        end_of_week: 'end of this week',
        end_of_month: 'end of this month',
        end_of_quarter: 'end of this quarter',
        end_of_year: 'end of this year',
      };

      await sendConfirmationEmail({
        to: donation.donor_email,
        donorName: donation.donor_name,
        amountCents: donation.amount_cents,
        recipientName: charityName || 'your recipient',
        timeframeLabel: timeframeLabels[donation.timeframe] || donation.timeframe,
        commitmentDescription: notes ?? (donation.commitment_description as string | null),
        hasAntiCharity: !!resolvedAntiCharityName,
        antiCharityName: resolvedAntiCharityName,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Commitment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
